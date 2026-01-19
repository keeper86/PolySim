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
#include <sys/wait.h>
#include <unordered_map>
#include <unistd.h>
#include <vector>

#include "prov_client.hpp"
#include "sha256.hpp"

#include "../../../local/color.hpp"
using namespace color;

extern char **environ;

class FsUsageParser {
  public:
    bool debug = false;
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
    static std::string trim_whitespace_and_brackets(std::string input);
    static std::string classify_operation(const std::string &op, const std::string &line);
    static bool extract_fs_usage_fields(const std::string &line, std::string &op,
                                        std::string &path, int &pid);
    static int extract_pid_from_process_token(const std::string &token);

    std::unordered_map<std::string, FileRecord> records_;
    int argc_ = 0;
    char **argv_ = nullptr;
    int64_t start_tp_ = 0;
    int64_t end_tp_ = 0;
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

bool FsUsageParser::extract_fs_usage_fields(const std::string &line, std::string &op,
                                            std::string &path, int &pid) {
    std::istringstream iss(line);
    std::string timestamp;
    std::string process_token;
    if (!(iss >> timestamp >> process_token >> op)) {
        return false;
    }

    pid = extract_pid_from_process_token(process_token);

    std::string token;
    while (iss >> token) {
        if (!token.empty() && token[0] == '/') {
            path = token;
        }
    }

    if (path.empty()) {
        size_t last_slash = line.find_last_of('/');
        if (last_slash == std::string::npos) {
            return false;
        }
        size_t start = line.find_last_of(" \t", last_slash);
        if (start == std::string::npos) {
            start = 0;
        } else {
            start += 1;
        }
        path = line.substr(start);
    }

    path = trim_whitespace_and_brackets(path);
    return !op.empty() && !path.empty() && path[0] == '/';
}

std::string FsUsageParser::classify_operation(const std::string &op, const std::string &line) {
    auto lower = op;
    std::transform(lower.begin(), lower.end(), lower.begin(),
                   [](unsigned char ch_char) { return static_cast<char>(std::tolower(ch_char)); });

    if (lower == "execve" || lower == "posix_spawn") {
        return "process";
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

    if (file_pid > 0) {
        if (parsed_pid <= 0 || parsed_pid != file_pid) {
            return;
        }
    }
    int record_pid = (parsed_pid > 0) ? parsed_pid : file_pid;
    if (record_pid <= 0) {
        return;
    }

    FileAccess access = {};
    access.path = path;
    access.role = classify_operation(op, line);
    access.pid = record_pid;
    access.metadata["operation"] = op;

    auto it = records_.find(path);
    if (it == records_.end()) {
        FileRecord rec = {};
        rec.accesses.push_back(access);
        records_.emplace(path, std::move(rec));
    } else {
        it->second.accesses.push_back(access);
    }
}

pid_t spawn_suspended(const char* path, char* const argv[]) {
    posix_spawnattr_t attr;
    if (posix_spawnattr_init(&attr) != 0)
        std::cerr << RED << "posix_spawnattr_init failed" << RESET << "\n";

    short flags = 0;
    flags |= POSIX_SPAWN_START_SUSPENDED; // Apple extension: start task suspended
    if (posix_spawnattr_setflags(&attr, flags) != 0) {
        posix_spawnattr_destroy(&attr);
        std::cerr << RED << "posix_spawnattr_setflags failed" << RESET << "\n";
    }

    pid_t pid = -1;
    int rc = posix_spawn(&pid, path, /*file_actions*/nullptr, &attr, argv, environ);

    posix_spawnattr_destroy(&attr);

    if (rc != 0) {
        // posix_spawn returns an error number (not -1)
        std::cerr << RED << "posix_spawn failed: " << std::strerror(rc) << RESET << "\n";
    }

    return pid;
}

void resume_process(pid_t pid) {
    if (kill(pid, SIGCONT) != 0)
        std::cerr << RED << "SIGCONT failed: " << std::strerror(errno) << RESET << "\n";
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

    std::string tmpfile = "./fs_usage_output_XXXXXX.txt";
    int file_desc = mkstemps(tmpfile.data(), 4);
    if (file_desc < 0) {
        perror("mkstemp");
        return false;
    }
    close(file_desc);

    start_tp_ = std::chrono::duration_cast<std::chrono::milliseconds>(
                    std::chrono::system_clock::now().time_since_epoch())
                    .count();

    // Create output file for fs_usage
    int fd = open(tmpfile.c_str(), O_CREAT | O_TRUNC | O_WRONLY, 0644);
    if (fd < 0) {
        std::cerr << "open failed: " << std::strerror(errno) << "\n";
        unlink(tmpfile.c_str());
        return false;
    }

    if (debug) {
        std::cerr << "fs_usage output temp file: " << tmpfile << "\n";
    }
// --------------- TARGET PROCESS -----------------
    int t_argc = argc - 1;
    char *t_path = argv[1];
    std::vector<char*> t_argv;
    t_argv.push_back(t_path);      // target argv[0]
    for (int i = 2; i < argc; ++i) {
        t_argv.push_back(argv[i]); // target args
    }
    t_argv.push_back(nullptr);

    pid_t t_pid = spawn_suspended(t_path, t_argv.data());
    if (debug) {
        std::cerr << "Target called as: " << YELLOW << t_path << " [" ;
        for (int i = 0; i < t_argc; ++i) {
            std::cerr << t_argv[i];
            if (i + 1 < t_argc) {
                std::cerr << " ";
            }
        }
        std::cerr << "]" << RESET << "\n";
        std::cerr << YELLOW << "Spawned target process with PID " << t_pid << RESET << "\n";
    }

// --------------- FS_USAGE -----------------    
    posix_spawn_file_actions_t actions;
    posix_spawn_file_actions_init(&actions);

    // Redirect stdout and stderr to the file
    posix_spawn_file_actions_adddup2(&actions, fd, STDOUT_FILENO);
    posix_spawn_file_actions_adddup2(&actions, fd, STDERR_FILENO);
    posix_spawn_file_actions_addclose(&actions, fd);

    std::string t_pid_str = std::to_string(t_pid);
    std::vector<std::string> fsu_arg_strs = {
                                        "fs_usage",
                                        "-w",
                                        "-f", "filesys",
                                        t_pid_str
                                    };
    std::vector<char*> fsu_argv;
    fsu_argv.reserve(fsu_arg_strs.size() + 1);
    for (auto& s : fsu_arg_strs) fsu_argv.push_back(const_cast<char*>(s.c_str()));
    fsu_argv.push_back(nullptr);

    pid_t fsu_pid = -1;
    int fs_rc = posix_spawnp(&fsu_pid, "fs_usage", &actions, nullptr, fsu_argv.data(), environ);
    posix_spawn_file_actions_destroy(&actions);
    close(fd);

    if (fs_rc != 0) {
        std::cerr << "posix_spawnp(fs_usage) failed: " << std::strerror(fs_rc) << RESET << "\n";
        kill(t_pid, SIGKILL);
        (void)waitpid(t_pid, nullptr, 0);
        unlink(tmpfile.c_str()) ;
        return false;
    }
    if (debug) {
        std::cerr << GREEN << "Spawned fs_usage with PID " << fsu_pid << RESET << "\n";
    }

    try {
        resume_process(t_pid);
    } catch (const std::exception &e) {
        std::cerr << "Failed to resume target: " << e.what() << "\n";
        kill(fsu_pid, SIGTERM);
        (void)waitpid(fsu_pid, nullptr, 0);
        kill(t_pid, SIGKILL);
        (void)waitpid(t_pid, nullptr, 0);
        unlink(tmpfile.c_str());
        return false;
    }

    int t_status = 0;
    if (waitpid(t_pid, &t_status, 0) < 0) {
        std::cerr << "waitpid(target) failed: " << std::strerror(errno) << "\n";
    }

    if (kill(fsu_pid, SIGTERM) != 0 && errno != ESRCH) {
        if (debug) {
            std::cerr << "SIGTERM fs_usage failed: " << std::strerror(errno) << "\n";
        }
    }

    int fsu_status = 0;
    (void)waitpid(fsu_pid, &fsu_status, 0);

    end_tp_ = std::chrono::duration_cast<std::chrono::milliseconds>(
                  std::chrono::system_clock::now().time_since_epoch())
                  .count();

    if (debug) {
        std::cerr << "Target exited with status " << t_status
                  << ", fs_usage status " << fsu_status << "\n";
    }

    std::ifstream in(tmpfile);
        if (!in) {
            std::cerr << "Failed to open fs_usage output: " << tmpfile << "\n";
            unlink(tmpfile.c_str());
            return false;
        }

        std::string line;
        while (std::getline(in, line)) {
            parse_line(line, /*file_pid=*/-1);
        }

    if (debug) {
        std::cerr << "Keeping fs_usage output at: " << tmpfile << "\n";
    } else {
        unlink(tmpfile.c_str());
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
