#pragma once

#include <algorithm>
#include <cerrno>
#include <chrono>
#include <cctype>
#include <csignal>
#include <cstdio>
#include <cstdlib>
#include <cstring>
#include <fcntl.h>
#include <filesystem>
#include <fstream>
#include <iostream>
#include <set>
#include <spawn.h>
#include <sstream>
#include <string>
#include <sys/stat.h>
#include <sys/wait.h>
#include <unordered_map>
#include <unordered_set>
#include <unistd.h>
#include <vector>

#include "prov_client.hpp"
#include "sha256.hpp"
#include "fs_usage_pegtl.hpp"

#include "../../../local/color.hpp"
using namespace color;

extern char **environ;

class FsUsageParser {
  public:
    bool debug = true;
    struct FileAccess {
        std::string path;
        std::string role;
        int pid;
        prov::json metadata = prov::json::object();
    };
    struct FileRecord {
        std::vector<FileAccess> accesses;
    };

    void parse_line(const std::string &line, int file_pid = -1);
    bool run_and_parse(int argc, char **argv);
    prov::ProvUploadInput get_provenance_data();

    const std::unordered_map<std::string, FileRecord> &records() const { return records_; }

  private:
    struct Options {
        bool prestart = true;
        int attach_delay_ms = 1000;
        int post_exit_delay_ms = 100;
    };

    void log_debug(const std::string &msg) const;
    static std::string trim_whitespace_and_brackets(std::string input);
    static bool should_record_operation(const std::string &op);
    static bool open_flags_indicate_output(const std::string &line);
    static std::string normalize_path(const std::string &path);
    static std::string classify_operation(const std::string &op, const std::string &line);
    static bool extract_fs_usage_fields(const std::string &line, std::string &op,
                                        std::string &path, int &pid);
    static std::string wait_status_string(int status);
    pid_t spawn_target(const char *path, char *const argv[], bool start_suspended) const;
    pid_t spawn_fs_usage(int fd) const;
    bool wait_for_exit(pid_t pid, int timeout_ms, int &status_out) const;

    static int extract_pid_from_process_token(const std::string &token);
    static std::string extract_process_column(const std::string &line);
    static std::string extract_process_name(const std::string &process_column);
    static bool is_number_like(const std::string &text);
    static std::string strip_wait_prefix(const std::string &process_column);
    static bool process_name_matches(const std::string &name, const std::string &expected);
    bool filter_output_by_process(const std::string &input_path, const std::string &output_path,
                                  const std::string &expected_name, pid_t target_pid,
                                  int &total_lines, int &kept_lines) const;

    bool is_target_path(const std::string &raw_path, const std::string &normalized_path) const;
    prov::json build_execve_argv() const;

    std::unordered_map<std::string, FileRecord> records_;
    int argc_ = 0;
    char **argv_ = nullptr;
    int64_t start_tp_ = 0;
    int64_t end_tp_ = 0;
    std::string target_path_;
    std::string target_path_abs_;
    int target_pid_ = -1;
    bool saw_process_access_ = false;
};

// --- Implementation -----------------------------------------------------------
std::string FsUsageParser::trim_whitespace_and_brackets(std::string input) {
    input.erase(
        input.begin(), std::find_if(input.begin(), input.end(), [](unsigned char ch_char) {
            return (std::isspace(ch_char) == 0) && ch_char != '"' && ch_char != '<' &&
                   ch_char != '(' && ch_char != '[';
        }));
    input.erase(std::find_if(input.rbegin(), input.rend(),
                             [](unsigned char ch_char) {
                                 return (std::isspace(ch_char) == 0) && ch_char != '"' &&
                                        ch_char != '>' && ch_char != ')' && ch_char != ']';
                             })
                    .base(),
                input.end());
    return input;
}

bool FsUsageParser::should_record_operation(const std::string &op) {
    std::string lower = op;
    std::transform(lower.begin(), lower.end(), lower.begin(),
                   [](unsigned char ch_char) { return static_cast<char>(std::tolower(ch_char)); });

    if (lower.empty()) {
        return false;
    }
    if (lower.rfind("open", 0) == 0 || lower == "creat") {
        return true;
    }
    if (lower == "execve" || lower == "posix_spawn") {
        return true;
    }
    if (lower == "access" || lower == "unlink" || lower == "rename" || lower == "renameat" ||
        lower == "renameat2") {
        return true;
    }
    if (lower == "link" || lower == "linkat" || lower == "symlink" || lower == "readlink") {
        return true;
    }
    if (lower == "mkdir" || lower == "rmdir") {
        return true;
    }
    if (lower == "stat" || lower == "stat64" || lower == "lstat" || lower == "lstat64" ||
        lower == "fstat" || lower == "fstat64" || lower == "fstatat" || lower == "fstatat64") {
        return true;
    }
    return false;
}

bool FsUsageParser::open_flags_indicate_output(const std::string &line) {
    size_t lparen = line.find('(');
    if (lparen == std::string::npos) {
        return false;
    }
    size_t rparen = line.find(')', lparen + 1);
    if (rparen == std::string::npos || rparen <= lparen + 1) {
        return false;
    }
    std::string flags = line.substr(lparen + 1, rparen - lparen - 1);
    return flags.find('W') != std::string::npos || flags.find('A') != std::string::npos ||
           flags.find('C') != std::string::npos || flags.find('T') != std::string::npos;
}

std::string FsUsageParser::normalize_path(const std::string &path) {
    if (path.empty()) {
        return {};
    }
    std::filesystem::path fs_path(path);
    std::error_code ec;
    if (!fs_path.is_absolute()) {
        fs_path = std::filesystem::absolute(fs_path, ec);
        if (ec) {
            return path;
        }
    }
    return fs_path.lexically_normal().string();
}

bool FsUsageParser::extract_fs_usage_fields(const std::string &line, std::string &op,
                                            std::string &path, int &pid) {
    fs_usage_pegtl::parsed_line parsed;
    if (!fs_usage_pegtl::parse_line(line, parsed)) {
        return false;
    }

    op = parsed.operation;
    path = trim_whitespace_and_brackets(parsed.path);
    pid = parsed.pid;
    return !op.empty() && !path.empty();
}

std::string FsUsageParser::classify_operation(const std::string &op, const std::string &line) {
    auto lower = op;
    std::transform(lower.begin(), lower.end(), lower.begin(),
                   [](unsigned char ch_char) { return static_cast<char>(std::tolower(ch_char)); });

    if (lower == "execve" || lower == "posix_spawn") {
        return "process";
    }

    if (lower.rfind("open", 0) == 0 || lower == "creat") {
        if (open_flags_indicate_output(line)) {
            return "output";
        }
    }

    if (line.find("O_WRONLY") != std::string::npos || line.find("O_RDWR") != std::string::npos ||
        line.find("O_CREAT") != std::string::npos || line.find("O_TRUNC") != std::string::npos ||
        line.find("O_APPEND") != std::string::npos) {
        return "output";
    }

    static const std::vector<std::string> output_ops = {
        "write",    "pwrite",   "pwrite64", "pwritev",  "pwritev_nocancel",
        "create",   "rename",   "link",     "unlink",   "mkdir",
        "rmdir",    "truncate", "ftruncate","symlink",  "chmod",
        "chown",    "fchmod",   "fchown",   "setattr",  "setxattr",
        "removexattr",
    };

    for (const auto &needle : output_ops) {
        if (lower.find(needle) != std::string::npos) {
            return "output";
        }
    }

    return "input";
}

void FsUsageParser::parse_line(const std::string &line, int file_pid) {
    std::string op;
    std::string path;
    int parsed_pid = -1;
    if (!extract_fs_usage_fields(line, op, path, parsed_pid)) {
        return;
    }

    if (!should_record_operation(op)) {
        return;
    }

    if (file_pid > 0) {
        if (parsed_pid <= 0 || parsed_pid != file_pid) {
            return;
        }
    }
    int record_pid = (parsed_pid > 0) ? parsed_pid : file_pid;
    if (record_pid <= 0) {
        return;
    }

    std::string normalized_path = normalize_path(path);
    if (is_target_path(path, normalized_path)) {
        return;
    }

    FileAccess access = {};
    access.path = normalized_path.empty() ? path : normalized_path;
    access.role = classify_operation(op, line);
    access.pid = record_pid;

    auto it = records_.find(access.path);
    if (it == records_.end()) {
        FileRecord rec = {};
        rec.accesses.push_back(access);
        records_.emplace(access.path, std::move(rec));
    } else {
        it->second.accesses.push_back(access);
    }
}

void FsUsageParser::log_debug(const std::string &msg) const {
    if (debug) {
        std::cerr << "[fs_usage] " << msg << "\n";
    }
}

bool FsUsageParser::run_and_parse(int argc, char **argv) {
    if (argc_ != 0 || argv_ != nullptr) {
        throw std::invalid_argument("FsUsageParser::run_and_parse called multiple times");
    }
    if (argc < 2) {
        std::cerr << "Usage: " << argv[0] << " <program> [args...]\n";
        return false;
    }

    argc_ = argc;
    argv_ = argv;
    Options opts;
    target_path_ = argv[1];
    target_path_abs_ = normalize_path(target_path_);
    saw_process_access_ = false;

    std::string output_path = "./fs_usage_output_XXXXXX.txt";
    int file_desc = mkstemps(output_path.data(), 4);
    if (file_desc < 0) {
        perror("mkstemp");
        return false;
    }
    if (fchmod(file_desc, 0644) != 0) {
        log_debug(std::string("fchmod output failed: ") + std::strerror(errno));
    }
    close(file_desc);

    std::string raw_output_path = output_path + ".raw";

    const char *target_path = argv[1];
    std::string target_name = std::filesystem::path(target_path).filename().string();
    if (target_name.empty()) {
        target_name = target_path;
    }

    std::string target_cmd;
    for (int i = 1; i < argc; ++i) {
        target_cmd += argv[i];
        if (i + 1 < argc) {
            target_cmd += " ";
        }
    }

    start_tp_ = std::chrono::duration_cast<std::chrono::milliseconds>(
                    std::chrono::system_clock::now().time_since_epoch())
                    .count();

    log_debug("Starting fs_usage parser");
    log_debug("Output file: " + output_path);
    log_debug("Raw output file: " + raw_output_path);
    log_debug("Target command: " + target_cmd);
    log_debug("Options: prestart=" + std::string(opts.prestart ? "true" : "false") +
              ", attach_delay_ms=" + std::to_string(opts.attach_delay_ms) +
              ", post_exit_delay_ms=" + std::to_string(opts.post_exit_delay_ms));

    int fd = open(raw_output_path.c_str(), O_CREAT | O_TRUNC | O_WRONLY, 0644);
    if (fd < 0) {
        std::cerr << "open failed: " << std::strerror(errno) << "\n";
        unlink(output_path.c_str());
        return false;
    }
    if (fchmod(fd, 0644) != 0) {
        log_debug(std::string("fchmod raw output failed: ") + std::strerror(errno));
    }

    std::vector<char *> target_argv;
    target_argv.reserve(static_cast<size_t>(argc));
    for (int i = 1; i < argc; ++i) {
        target_argv.push_back(argv[i]);
    }
    target_argv.push_back(nullptr);

    pid_t target_pid = -1;
    pid_t fsu_pid = -1;

    if (opts.prestart) {
        fsu_pid = spawn_fs_usage(fd);
        close(fd);
        if (fsu_pid <= 0) {
            unlink(output_path.c_str());
            return false;
        }
        log_debug("Spawned fs_usage PID: " + std::to_string(fsu_pid));

        if (opts.attach_delay_ms > 0) {
            log_debug("Waiting " + std::to_string(opts.attach_delay_ms) +
                      "ms for fs_usage to attach");
            usleep(opts.attach_delay_ms * 1000);
        }

        target_pid = spawn_target(target_path, target_argv.data(), false);
        if (target_pid <= 0) {
            std::cerr << "Failed to spawn target\n";
            kill(fsu_pid, SIGTERM);
            (void)waitpid(fsu_pid, nullptr, 0);
            unlink(output_path.c_str());
            return false;
        }
        log_debug("Spawned target PID: " + std::to_string(target_pid));
        target_pid_ = static_cast<int>(target_pid);

    } else {
        target_pid = spawn_target(target_path, target_argv.data(), false);
        if (target_pid <= 0) {
            std::cerr << "Failed to spawn target\n";
            close(fd);
            unlink(output_path.c_str());
            return false;
        }
        log_debug("Spawned target PID: " + std::to_string(target_pid));
        target_pid_ = static_cast<int>(target_pid);

        fsu_pid = spawn_fs_usage(fd);
        close(fd);
        if (fsu_pid <= 0) {
            kill(target_pid, SIGKILL);
            (void)waitpid(target_pid, nullptr, 0);
            unlink(output_path.c_str());
            return false;
        }
        log_debug("Spawned fs_usage PID: " + std::to_string(fsu_pid));

        if (opts.attach_delay_ms > 0) {
            log_debug("Waiting " + std::to_string(opts.attach_delay_ms) +
                      "ms for fs_usage to attach");
            usleep(opts.attach_delay_ms * 1000);
        }
    }

    int target_status = 0;
    if (waitpid(target_pid, &target_status, 0) < 0) {
        std::cerr << "waitpid(target) failed: " << std::strerror(errno) << "\n";
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
        std::cerr << "SIGINT fs_usage failed: " << std::strerror(errno) << "\n";
    } else {
        log_debug("Sent SIGINT to fs_usage");
    }

    fsu_exited = wait_for_exit(fsu_pid, 500, fsu_status);
    if (!fsu_exited) {
        if (kill(fsu_pid, SIGTERM) != 0 && errno != ESRCH) {
            std::cerr << "SIGTERM fs_usage failed: " << std::strerror(errno) << "\n";
        } else {
            log_debug("Sent SIGTERM to fs_usage");
        }
    }

    if (!fsu_exited) {
        if (waitpid(fsu_pid, &fsu_status, 0) < 0) {
            std::cerr << "waitpid(fs_usage) failed: " << std::strerror(errno) << "\n";
        } else {
            log_debug("fs_usage exit status: " + wait_status_string(fsu_status));
        }
    } else {
        log_debug("fs_usage exit status: " + wait_status_string(fsu_status));
    }

    end_tp_ = std::chrono::duration_cast<std::chrono::milliseconds>(
                  std::chrono::system_clock::now().time_since_epoch())
                  .count();

    int total_lines = 0;
    int kept_lines = 0;
    if (!filter_output_by_process(raw_output_path, output_path, target_name, target_pid,
                                  total_lines, kept_lines)) {
        std::cerr << "Failed to filter fs_usage output\n";
        if (!debug) {
            unlink(raw_output_path.c_str());
            unlink(output_path.c_str());
        }
        return false;
    }
    log_debug("Filtered fs_usage lines: kept " + std::to_string(kept_lines) + " of " +
              std::to_string(total_lines));

    std::string parse_path = output_path;
    int parse_pid = -1;
    if (kept_lines == 0) {
        parse_path = raw_output_path;
        if (target_pid_ > 0) {
            parse_pid = target_pid_;
        }
        log_debug("No filtered lines; parsing raw output with pid filter");
    }

    std::ifstream in(parse_path);
    if (!in) {
        std::cerr << "Failed to open fs_usage output: " << parse_path << "\n";
        if (!debug) {
            unlink(raw_output_path.c_str());
            unlink(output_path.c_str());
        }
        return false;
    }

    std::string line;
    while (std::getline(in, line)) {
        parse_line(line, parse_pid);
    }

    if (debug) {
        std::cerr << "Keeping fs_usage output at: " << output_path << "\n";
        std::cerr << "Keeping raw fs_usage output at: " << raw_output_path << "\n";
    } else {
        unlink(raw_output_path.c_str());
        unlink(output_path.c_str());
    }

    if (!saw_process_access_ && !target_path_.empty() && target_pid_ > 0) {
        FileAccess access = {};
        access.path = target_path_;
        access.role = "process";
        access.pid = target_pid_;
        access.metadata["execve_argv"] = build_execve_argv();

        FileRecord &rec = records_[target_path_];
        rec.accesses.push_back(access);
        saw_process_access_ = true;
    }

    return true;
}

std::string FsUsageParser::wait_status_string(int status) {
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

pid_t FsUsageParser::spawn_target(const char *path, char *const argv[],
                                  bool start_suspended) const {
    posix_spawnattr_t attr;
    int rc = posix_spawnattr_init(&attr);
    if (rc != 0) {
        std::cerr << "posix_spawnattr_init failed: " << std::strerror(rc) << "\n";
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
            std::cerr << "posix_spawnattr_setflags failed: " << std::strerror(rc) << "\n";
        }
    }

    pid_t pid = -1;
    rc = posix_spawnp(&pid, path, nullptr, &attr, argv, environ);
    posix_spawnattr_destroy(&attr);

    if (rc != 0) {
        std::cerr << "posix_spawnp(target) failed: " << std::strerror(rc) << "\n";
        return -1;
    }

    return pid;
}

pid_t FsUsageParser::spawn_fs_usage(int fd) const {
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
    int fs_rc = posix_spawnp(&fsu_pid, "fs_usage", &actions, nullptr, fsu_argv.data(),
                             environ);
    posix_spawn_file_actions_destroy(&actions);

    if (fs_rc != 0) {
        std::cerr << "posix_spawnp(fs_usage) failed: " << std::strerror(fs_rc) << "\n";
        return -1;
    }

    return fsu_pid;
}

bool FsUsageParser::wait_for_exit(pid_t pid, int timeout_ms, int &status_out) const {
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

int FsUsageParser::extract_pid_from_process_token(const std::string &token) {
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

std::string FsUsageParser::extract_process_column(const std::string &line) {
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

std::string FsUsageParser::extract_process_name(const std::string &process_column) {
    size_t dot_pos = process_column.rfind('.');
    if (dot_pos == std::string::npos || dot_pos == 0) {
        return process_column;
    }
    return process_column.substr(0, dot_pos);
}

bool FsUsageParser::is_number_like(const std::string &text) {
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

std::string FsUsageParser::strip_wait_prefix(const std::string &process_column) {
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

bool FsUsageParser::process_name_matches(const std::string &name,
                                         const std::string &expected) {
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

bool FsUsageParser::is_target_path(const std::string &raw_path,
                                   const std::string &normalized_path) const {
    if (!target_path_.empty() && raw_path == target_path_) {
        return true;
    }
    if (!target_path_abs_.empty() && normalized_path == target_path_abs_) {
        return true;
    }
    return false;
}

prov::json FsUsageParser::build_execve_argv() const {
    prov::json argv = prov::json::array();
    if (argc_ < 2 || argv_ == nullptr) {
        return argv;
    }
    for (int i = 1; i < argc_; ++i) {
        argv.push_back(std::string(argv_[i]));
    }
    return argv;
}

bool FsUsageParser::filter_output_by_process(const std::string &input_path,
                                             const std::string &output_path,
                                             const std::string &expected_name,
                                             pid_t target_pid, int &total_lines,
                                             int &kept_lines) const {
    std::ifstream in(input_path);
    if (!in) {
        std::cerr << "Failed to open raw output: " << input_path << "\n";
        return false;
    }
    std::ofstream out(output_path, std::ios::trunc);
    if (!out) {
        std::cerr << "Failed to open output: " << output_path << "\n";
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

prov::ProvUploadInput FsUsageParser::get_provenance_data() {
    std::cout << "Gathering provenance data..." << '\n';
    if (argc_ < 2) {
        std::cerr
            << "Not enough arguments to gather provenance data\n Did you call run_and_parse()?\n";
        return {};
    }

    auto is_shared_object = [&](const std::string &path) -> bool {
        static const std::vector<std::string> excludedPrefixes = {
            "/System/", "/Library/", "/usr/", "/bin/", "/sbin/", "/private/var/",
            "/dev/",    "/etc/",     "/tmp/", "/var/",
        };

        for (const auto &prefix : excludedPrefixes) {
            if (path.rfind(prefix, 0) == 0) {
                return true;
            }
        }

        if (path.find("/CMakeFiles/Progress/", 0) != std::string::npos) {
            return true;
        }

        if (path.size() > 3 && path.substr(path.size() - 3) == ".so") {
            return true;
        }
        return false;
    };

    prov::ProvUploadInput prov_input;
    prov_input.entities.clear();

    std::set<std::string> filePathOfFilesUnableToCalculateAHashFor;
    std::cout << "Processing " << records_.size() << " traced files...\n";
    for (const auto &kv : records_) {
        const std::string &path = kv.first;
        const FileRecord &record = kv.second;

        if (is_shared_object(path)) {
            continue;
        }

        std::string hash = "IF YOU SEE THIS; SOMETHING WENT WRONG";
        try {
            if (!std::filesystem::is_regular_file(path)) {
                if (debug) {
                    std::cerr << " Skipping non-regular file (not hashed): " << path << "\n";
                }
                continue;
            }
            hash = hash_file(path);
        } catch (const std::exception &e) {
            if (debug) {
                std::cerr << " Failed to hash file: " << path << " (" << e.what() << ")\n";
            }
            filePathOfFilesUnableToCalculateAHashFor.insert(path);
            continue;
        }

        prov::Entity entity;
        entity.id = hash;
        try {
            entity.label = std::filesystem::path(path).filename().string();
            if (entity.label.empty()) {
                entity.label = path;
            }
        } catch (...) {
            entity.label = path;
        }
        entity.metadata = prov::json::object();
        entity.metadata["path"] = path;
        entity.role = "input";
        for (const auto &access : record.accesses) {
            prov::json access_json = prov::json::object();
            if (access.role == "output") {
                entity.role = "output";
            }
            if (access.role == "process") {
                if (entity.role == "input") {
                    entity.role = "process";
                }
            }
            access_json["role"] = access.role;
            access_json["pid"] = access.pid;
            access_json["metadata"] = access.metadata;
            entity.metadata["accesses"].push_back(access_json);
        }

        try {
            auto lastWriteTimePoint =
                std::chrono::time_point_cast<std::chrono::system_clock::duration>(
                    std::filesystem::last_write_time(path) -
                    std::filesystem::file_time_type::clock::now() +
                    std::chrono::system_clock::now());
            entity.createdAt = std::chrono::duration_cast<std::chrono::milliseconds>(
                                   lastWriteTimePoint.time_since_epoch())
                                   .count();
        } catch (...) {
            entity.createdAt = std::chrono::duration_cast<std::chrono::milliseconds>(
                                   std::chrono::system_clock::now().time_since_epoch())
                                   .count();
        }

        prov_input.entities.push_back(std::move(entity));
    }

    prov::Activity activity;
    activity.label = "Run " + std::string(argv_[1]);
    activity.startedAt = start_tp_;
    activity.endedAt = end_tp_;
    activity.metadata = prov::json::object();

    prov::json cmd = prov::json::array();
    std::string cmd_string;
    for (int i = 1; i < argc_; ++i) {
        cmd.push_back(std::string(argv_[i]));
        cmd_string += std::string(argv_[i]) + " ";
    }
    prov::json filesWithoutHash = prov::json::array();
    for (const auto &file_path : filePathOfFilesUnableToCalculateAHashFor) {
        filesWithoutHash.push_back(file_path);
    }
    activity.metadata["command"] = cmd;
    if (!filesWithoutHash.empty()) {
        activity.metadata["filesWithoutHash"] = filesWithoutHash;
    }
    activity.id = make_sha256(cmd_string + std::to_string(activity.startedAt) +
                              std::to_string(activity.endedAt));

    prov_input.activity = std::move(activity);

    return prov_input;
}
