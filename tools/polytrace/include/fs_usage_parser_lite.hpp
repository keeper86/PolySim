#pragma once

#include <cerrno>
#include <csignal>
#include <cstring>
#include <cstdlib>
#include <fcntl.h>
#include <filesystem>
#include <fstream>
#include <iostream>
#include <spawn.h>
#include <string>
#include <sys/wait.h>
#include <unordered_set>
#include <unistd.h>
#include <vector>

extern char **environ;

class FsUsageParserLite {
  public:
    bool debug = true;

    bool run_and_capture(int argc, char **argv) {
        Options opts;
        int arg_index = 1;
        if (!parse_options(argc, argv, opts, arg_index)) {
            return false;
        }
        if (argc - arg_index < 2) {
            print_usage(argv[0]);
            return false;
        }

        std::string output_path = argv[arg_index];
        std::filesystem::path output_fs_path(output_path);
        const char *target_path = argv[arg_index + 1];
        std::string target_name = std::filesystem::path(target_path).filename().string();
        if (target_name.empty()) {
            target_name = target_path;
        }
        std::string raw_output_path = output_path + ".raw";

        log_debug("Starting tracer_lite");
        log_debug("Args received: " + std::to_string(argc));
        log_debug("Output file: " + output_path);
        log_debug("Options: prestart=" + std::string(opts.prestart ? "true" : "false") +
                  ", suspend=" + std::string(opts.use_suspension ? "true" : "false") +
                  ", stop=" + std::string(opts.stop_target ? "true" : "false") +
                  ", attach_delay_ms=" + std::to_string(opts.attach_delay_ms) +
                  ", post_exit_delay_ms=" + std::to_string(opts.post_exit_delay_ms));

        std::error_code cwd_ec;
        std::filesystem::path cwd = std::filesystem::current_path(cwd_ec);
        if (!cwd_ec) {
            log_debug("CWD: " + cwd.string());
        }

        const char *env_path = std::getenv("PATH");
        if (env_path != nullptr) {
            log_debug(std::string("PATH: ") + env_path);
        }

        if (!output_fs_path.has_parent_path()) {
            log_debug("Output directory: <cwd>");
        } else {
            std::filesystem::path parent = output_fs_path.parent_path();
            std::error_code dir_ec;
            bool exists = std::filesystem::exists(parent, dir_ec);
            if (dir_ec || !exists) {
                std::cerr << "[tracer_lite] ERROR: Output directory missing: "
                          << parent.string() << "\n";
                return false;
            }
            log_debug("Output directory: " + parent.string());
        }

        std::vector<char *> target_argv;
        target_argv.reserve(static_cast<size_t>(argc));
        for (int i = arg_index + 1; i < argc; ++i) {
            target_argv.push_back(argv[i]);
        }
        target_argv.push_back(nullptr);

        std::string target_cmd;
        for (int i = arg_index + 1; i < argc; ++i) {
            target_cmd += argv[i];
            if (i + 1 < argc) {
                target_cmd += " ";
            }
        }
        log_debug("Target command: " + target_cmd);

        log_debug("Using raw output file: " + raw_output_path);
        log_debug("Post-filtering by process name: " + target_name);

        int fd = open(raw_output_path.c_str(), O_CREAT | O_TRUNC | O_WRONLY, 0644);
        if (fd < 0) {
            std::cerr << "[tracer_lite] ERROR: open failed: " << std::strerror(errno) << "\n";
            return false;
        }
        log_debug("Opened output fd: " + std::to_string(fd));

        pid_t target_pid = -1;
        pid_t fsu_pid = -1;

        if (opts.prestart) {
            fsu_pid = spawn_fs_usage(fd);
            close(fd);
            if (fsu_pid <= 0) {
                return false;
            }
            log_debug("Spawned fs_usage PID: " + std::to_string(fsu_pid));

            if (opts.attach_delay_ms > 0) {
                log_debug("Waiting " + std::to_string(opts.attach_delay_ms) +
                          "ms for fs_usage to attach");
                usleep(opts.attach_delay_ms * 1000);
            }

            target_pid = spawn_target(target_path, target_argv.data(), opts.use_suspension);
            if (target_pid <= 0) {
                std::cerr << "[tracer_lite] ERROR: failed to spawn target\n";
                kill(fsu_pid, SIGTERM);
                (void)waitpid(fsu_pid, nullptr, 0);
                return false;
            }
            log_debug("Spawned target PID: " + std::to_string(target_pid));

            if (opts.stop_target) {
                bool target_stopped = stop_target_for_attach(target_pid);
                if (!target_stopped) {
                    log_debug("Target did not reach SIGSTOP; proceeding anyway");
                }
            }
        } else {
            target_pid = spawn_target(target_path, target_argv.data(), opts.use_suspension);
            if (target_pid <= 0) {
                std::cerr << "[tracer_lite] ERROR: failed to spawn target\n";
                close(fd);
                return false;
            }
            log_debug("Spawned target PID: " + std::to_string(target_pid));

            if (opts.stop_target) {
                bool target_stopped = stop_target_for_attach(target_pid);
                if (!target_stopped) {
                    log_debug("Target did not reach SIGSTOP; proceeding anyway");
                }
            }

            fsu_pid = spawn_fs_usage(fd);
            close(fd);
            if (fsu_pid <= 0) {
                kill(target_pid, SIGKILL);
                (void)waitpid(target_pid, nullptr, 0);
                return false;
            }
            log_debug("Spawned fs_usage PID: " + std::to_string(fsu_pid));

            if (opts.attach_delay_ms > 0) {
                log_debug("Waiting " + std::to_string(opts.attach_delay_ms) +
                          "ms for fs_usage to attach");
                usleep(opts.attach_delay_ms * 1000);
            }
        }

        if (opts.use_suspension || opts.stop_target) {
            if (kill(target_pid, SIGCONT) != 0) {
                std::cerr << "[tracer_lite] ERROR: SIGCONT failed: " << std::strerror(errno)
                          << "\n";
                kill(fsu_pid, SIGTERM);
                (void)waitpid(fsu_pid, nullptr, 0);
                kill(target_pid, SIGKILL);
                (void)waitpid(target_pid, nullptr, 0);
                return false;
            }
            log_debug("Resumed target process");
        }

        int target_status = 0;
        if (waitpid(target_pid, &target_status, 0) < 0) {
            std::cerr << "[tracer_lite] ERROR: waitpid(target) failed: "
                      << std::strerror(errno) << "\n";
        } else {
            log_debug("Target exit status: " + wait_status_string(target_status));
        }

        if (opts.post_exit_delay_ms > 0) {
            log_debug("Waiting " + std::to_string(opts.post_exit_delay_ms) +
                      "ms before stopping fs_usage");
            usleep(opts.post_exit_delay_ms * 1000);
        }

        bool fsu_exited = false;
        int fsu_status = 0;
        if (kill(fsu_pid, SIGINT) != 0 && errno != ESRCH) {
            std::cerr << "[tracer_lite] ERROR: SIGINT fs_usage failed: "
                      << std::strerror(errno) << "\n";
        } else {
            log_debug("Sent SIGINT to fs_usage");
        }

        fsu_exited = wait_for_exit(fsu_pid, 500, fsu_status);
        if (!fsu_exited) {
            if (kill(fsu_pid, SIGTERM) != 0 && errno != ESRCH) {
                std::cerr << "[tracer_lite] ERROR: SIGTERM fs_usage failed: "
                          << std::strerror(errno) << "\n";
            } else {
                log_debug("Sent SIGTERM to fs_usage");
            }
        }

        if (!fsu_exited) {
            if (waitpid(fsu_pid, &fsu_status, 0) < 0) {
                std::cerr << "[tracer_lite] ERROR: waitpid(fs_usage) failed: "
                          << std::strerror(errno) << "\n";
            } else {
                log_debug("fs_usage exit status: " + wait_status_string(fsu_status));
            }
        } else {
            log_debug("fs_usage exit status: " + wait_status_string(fsu_status));
        }

        int total_lines = 0;
        int kept_lines = 0;
        if (!filter_output_by_process(raw_output_path, output_path, target_name, target_pid,
                                      total_lines, kept_lines)) {
            std::cerr << "[tracer_lite] ERROR: failed to filter output by process name\n";
            return false;
        }
        log_debug("Filtered fs_usage lines: kept " + std::to_string(kept_lines) + " of " +
                  std::to_string(total_lines));
        log_debug("Raw output kept at: " + raw_output_path);

        std::error_code size_ec;
        auto file_size = std::filesystem::file_size(output_path, size_ec);
        if (!size_ec) {
            log_debug("Output size: " + std::to_string(file_size) + " bytes");
            if (file_size == 0) {
                log_debug("Output is empty; target may not have produced filesys activity");
            }
        }
        log_debug("Done. Output written to: " + output_path);

        return true;
    }

  private:
    struct Options {
        bool prestart = true;
        bool use_suspension = true;
        bool stop_target = true;
        int attach_delay_ms = 1000;
        int post_exit_delay_ms = 100;
    };

    void log_debug(const std::string &msg) const {
        if (debug) {
            std::cerr << "[tracer_lite] " << msg << "\n";
        }
    }

    static void print_usage(const char *argv0) {
        std::cerr << "Usage: " << argv0
                  << " [options] <output.txt> <program> [args...]\n"
                  << "Options:\n"
                  << "  --prestart            Start fs_usage before the target (default)\n"
                  << "  --no-suspend          Do not start target suspended\n"
                  << "  --no-stop             Do not send SIGSTOP before attach\n"
                  << "  --attach-delay-ms N   Delay before resuming target (default 200)\n"
                  << "  --post-exit-delay-ms N Delay before stopping fs_usage (default 100)\n"
                  << "Example:\n"
                  << "  " << argv0
                  << " --prestart /tmp/fs_usage.txt /bin/ls -la\n";
    }

    static bool parse_int_arg(const char *arg, int &value_out) {
        if (arg == nullptr || *arg == '\0') {
            return false;
        }
        char *end_ptr = nullptr;
        long v = std::strtol(arg, &end_ptr, 10);
        if (end_ptr == arg || *end_ptr != '\0') {
            return false;
        }
        if (v < 0 || v > 3600 * 24) {
            return false;
        }
        value_out = static_cast<int>(v);
        return true;
    }

    static bool parse_options(int argc, char **argv, Options &opts, int &arg_index) {
        int i = 1;
        for (; i < argc; ++i) {
            std::string arg = argv[i];
            if (arg == "--") {
                ++i;
                break;
            }
            if (arg.rfind("--", 0) != 0) {
                break;
            }
            if (arg == "--prestart") {
                opts.prestart = true;
                continue;
            }
            if (arg == "--no-suspend") {
                opts.use_suspension = false;
                continue;
            }
            if (arg == "--no-stop") {
                opts.stop_target = false;
                continue;
            }
            if (arg == "--attach-delay-ms") {
                if (i + 1 >= argc || !parse_int_arg(argv[i + 1], opts.attach_delay_ms)) {
                    std::cerr << "Invalid --attach-delay-ms value\n";
                    return false;
                }
                ++i;
                continue;
            }
            if (arg == "--post-exit-delay-ms") {
                if (i + 1 >= argc || !parse_int_arg(argv[i + 1], opts.post_exit_delay_ms)) {
                    std::cerr << "Invalid --post-exit-delay-ms value\n";
                    return false;
                }
                ++i;
                continue;
            }

            std::cerr << "Unknown option: " << arg << "\n";
            print_usage(argv[0]);
            return false;
        }

        arg_index = i;
        return true;
    }

    static std::string wait_status_string(int status) {
        if (WIFEXITED(status)) {
            return "exited=" + std::to_string(WEXITSTATUS(status));
        }
        if (WIFSIGNALED(status)) {
            return "signaled=" + std::to_string(WTERMSIG(status));
        }
        if (WIFSTOPPED(status)) {
            return "stopped=" + std::to_string(WSTOPSIG(status));
        }
        return "status=" + std::to_string(status);
    }

    pid_t spawn_target(const char *path, char *const argv[], bool start_suspended) const {
        posix_spawnattr_t attr;
        int rc = posix_spawnattr_init(&attr);
        if (rc != 0) {
            std::cerr << "[tracer_lite] ERROR: posix_spawnattr_init failed: "
                      << std::strerror(rc) << "\n";
            return -1;
        }

        short flags = 0;
        if (start_suspended) {
#ifdef POSIX_SPAWN_START_SUSPENDED
            flags |= POSIX_SPAWN_START_SUSPENDED;
#else
            log_debug("POSIX_SPAWN_START_SUSPENDED not supported; continuing unsuspended");
#endif
            rc = posix_spawnattr_setflags(&attr, flags);
            if (rc != 0) {
                std::cerr << "[tracer_lite] ERROR: posix_spawnattr_setflags failed: "
                          << std::strerror(rc) << "\n";
            }
        }

        pid_t pid = -1;
        rc = posix_spawnp(&pid, path, nullptr, &attr, argv, environ);
        posix_spawnattr_destroy(&attr);

        if (rc != 0) {
            std::cerr << "[tracer_lite] ERROR: posix_spawnp(target) failed: "
                      << std::strerror(rc) << "\n";
            return -1;
        }

        return pid;
    }

    pid_t spawn_fs_usage(int fd) const {
        posix_spawn_file_actions_t actions;
        posix_spawn_file_actions_init(&actions);
        posix_spawn_file_actions_adddup2(&actions, fd, STDOUT_FILENO);
        posix_spawn_file_actions_adddup2(&actions, fd, STDERR_FILENO);
        posix_spawn_file_actions_addclose(&actions, fd);

        std::vector<std::string> fsu_arg_strs = {"fs_usage", "-w", "-f", "filesys"};

        std::vector<char *> fsu_argv;
        fsu_argv.reserve(fsu_arg_strs.size() + 1);
        for (auto &s : fsu_arg_strs) {
            fsu_argv.push_back(const_cast<char *>(s.c_str()));
        }
        fsu_argv.push_back(nullptr);

        std::string fsu_cmd;
        for (size_t i = 0; i < fsu_arg_strs.size(); ++i) {
            fsu_cmd += fsu_arg_strs[i];
            if (i + 1 < fsu_arg_strs.size()) {
                fsu_cmd += " ";
            }
        }
        log_debug("Spawning fs_usage: " + fsu_cmd);

        pid_t fsu_pid = -1;
        int fs_rc =
            posix_spawnp(&fsu_pid, "fs_usage", &actions, nullptr, fsu_argv.data(), environ);
        posix_spawn_file_actions_destroy(&actions);

        if (fs_rc != 0) {
            std::cerr << "[tracer_lite] ERROR: posix_spawnp(fs_usage) failed: "
                      << std::strerror(fs_rc) << "\n";
            return -1;
        }

        return fsu_pid;
    }

    bool stop_target_for_attach(pid_t pid) const {
        log_debug("Sending SIGSTOP to target");
        if (kill(pid, SIGSTOP) != 0) {
            std::cerr << "[tracer_lite] ERROR: SIGSTOP failed: " << std::strerror(errno)
                      << "\n";
            return false;
        }

        for (int attempt = 0; attempt < 50; ++attempt) {
            int status = 0;
            pid_t rc = waitpid(pid, &status, WUNTRACED | WNOHANG);
            if (rc == pid) {
                if (WIFSTOPPED(status)) {
                    log_debug("Target confirmed stopped");
                    return true;
                }
                if (WIFEXITED(status) || WIFSIGNALED(status)) {
                    log_debug("Target exited before tracing could attach");
                    return false;
                }
            } else if (rc == 0) {
                usleep(10 * 1000);
                continue;
            } else {
                std::cerr << "[tracer_lite] ERROR: waitpid(WUNTRACED) failed: "
                          << std::strerror(errno) << "\n";
                return false;
            }
        }

        log_debug("Timed out waiting for SIGSTOP");
        return false;
    }

    bool wait_for_exit(pid_t pid, int timeout_ms, int &status_out) const {
        int waited_ms = 0;
        while (waited_ms < timeout_ms) {
            int status = 0;
            pid_t rc = waitpid(pid, &status, WNOHANG);
            if (rc == pid) {
                status_out = status;
                return true;
            }
            if (rc == 0) {
                usleep(10 * 1000);
                waited_ms += 10;
                continue;
            }
            if (rc < 0 && errno == EINTR) {
                continue;
            }
            return false;
        }
        return false;
    }

  public:
    static int extract_pid_from_process_token(const std::string &token) {
        size_t dot_pos = token.rfind('.');
        if (dot_pos == std::string::npos || dot_pos + 1 >= token.size()) {
            return -1;
        }
        const char *pid_str = token.c_str() + dot_pos + 1;
        char *end_ptr = nullptr;
        long pid = std::strtol(pid_str, &end_ptr, 10);
        if (end_ptr == pid_str || *end_ptr != '\0' || pid <= 0) {
            return -1;
        }
        return static_cast<int>(pid);
    }

    static std::string extract_process_column(const std::string &line) {
        size_t end = line.find_last_not_of(" \t\r\n");
        if (end == std::string::npos) {
            return {};
        }

        for (size_t i = end; i > 0; --i) {
            if (line[i] == ' ' || line[i] == '\t') {
                size_t run_end = i;
                while (i > 0 && (line[i] == ' ' || line[i] == '\t')) {
                    --i;
                }
                size_t run_len = run_end - i;
                if (run_len >= 2) {
                    size_t col_start = run_end + 1;
                    if (col_start <= end) {
                        return line.substr(col_start, end - col_start + 1);
                    }
                }
            }
        }

        size_t start = line.find_last_of(" \t", end);
        if (start == std::string::npos) {
            start = 0;
        } else {
            start += 1;
        }
        return line.substr(start, end - start + 1);
    }

    static std::string extract_process_name(const std::string &process_column) {
        size_t dot_pos = process_column.rfind('.');
        if (dot_pos == std::string::npos || dot_pos == 0) {
            return process_column;
        }
        return process_column.substr(0, dot_pos);
    }

    static bool is_number_like(const std::string &text) {
        if (text.empty()) {
            return false;
        }
        for (char ch : text) {
            if ((ch < '0' || ch > '9') && ch != '.') {
                return false;
            }
        }
        return true;
    }

    static std::string strip_wait_prefix(const std::string &process_column) {
        size_t w_pos = process_column.find(" W ");
        if (w_pos == std::string::npos) {
            return process_column;
        }
        std::string prefix = process_column.substr(0, w_pos);
        if (is_number_like(prefix)) {
            return process_column.substr(w_pos + 3);
        }
        return process_column;
    }

    static bool process_name_matches(const std::string &name, const std::string &expected) {
        if (name.empty() || expected.empty()) {
            return false;
        }
        if (name == expected) {
            return true;
        }
        if (name.rfind(expected, 0) == 0) {
            return true;
        }
        if (expected.rfind(name, 0) == 0) {
            return true;
        }
        return false;
    }

    bool filter_output_by_process(const std::string &input_path, const std::string &output_path,
                                  const std::string &expected_name, pid_t target_pid,
                                  int &total_lines, int &kept_lines) const {
        std::ifstream in(input_path);
        if (!in) {
            std::cerr << "[tracer_lite] ERROR: failed to open raw output: " << input_path
                      << "\n";
            return false;
        }
        std::ofstream out(output_path, std::ios::trunc);
        if (!out) {
            std::cerr << "[tracer_lite] ERROR: failed to open output: " << output_path << "\n";
            return false;
        }

        std::string line;
        total_lines = 0;
        kept_lines = 0;
        int name_matches = 0;
        int id_matches = 0;
        std::unordered_set<int> thread_ids;
        while (std::getline(in, line)) {
            ++total_lines;
            std::string process_column = extract_process_column(line);
            if (process_column.empty()) {
                continue;
            }

            process_column = strip_wait_prefix(process_column);
            int id = extract_pid_from_process_token(process_column);
            bool id_match = (id > 0 && thread_ids.count(id) > 0);
            if (!id_match && id > 0 && id == static_cast<int>(target_pid)) {
                id_match = true;
            }

            if (id_match) {
                out << line << '\n';
                ++kept_lines;
                ++id_matches;
                continue;
            }

            std::string process_name = extract_process_name(process_column);
            bool name_match = process_name_matches(process_name, expected_name);
            if (name_match) {
                out << line << '\n';
                ++kept_lines;
                ++name_matches;
                if (id > 0) {
                    thread_ids.insert(id);
                }
            }
        }

        if (debug) {
            log_debug("Filter matches: name=" + std::to_string(name_matches) +
                      ", id=" + std::to_string(id_matches) +
                      ", threads=" + std::to_string(thread_ids.size()));
        }
        return true;
    }
};
