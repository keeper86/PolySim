#pragma once

#include <array>
#include <cerrno>
#include <chrono>
#include <cstdio>
#include <cstdlib>
#include <cstring>
#include <dirent.h>
#include <filesystem>
#include <iostream>
#include <regex>
#include <string>
#include <sys/wait.h>
#include <unistd.h>
#include <unordered_map>
#include <unordered_set>
#include <vector>

#include "prov_client.hpp"
#include "sha256.hpp"
#include "strace_pegtl.hpp"
#include <tao/pegtl.hpp>

#include <nlohmann/json.hpp>
using json = nlohmann::json;

class StraceParser {
  public:
    bool debug = false;
    struct FileAccess {
        std::string path;
        std::string role; // "input", "output" or "process"
        int pid;
        json metadata = json::object();
    };
    struct FileRecord {
        std::vector<FileAccess> accesses;
    };

    void parse_line(const std::string &line, int file_pid = -1);
    bool run_and_parse(int argc, char **argv);
    prov::ProvUploadInput get_provenance_data();

    const std::unordered_map<std::string, FileRecord> &records() const { return records_; }

  private:
    std::unordered_map<std::string, FileRecord> records_;
    size_t next_insertion_index_ = 0;
    int argc_ = 0;
    char **argv_ = nullptr;
    int64_t start_tp_ = 0;
    int64_t end_tp_ = 0;
};

// --- Implementation -----------------------------------------------------------
void StraceParser::parse_line(const std::string &line, int file_pid) {
    strace_pegtl::syscall_state state;

    try {
        tao::pegtl::memory_input mem_input(line, "strace_line");
        tao::pegtl::parse<strace_pegtl::grammar, strace_pegtl::action>(mem_input, state);

        if (state.return_value == "-1") {
            return;
        }

        if (file_pid < 0) {
            std::cerr << "StraceParser::parse_line: no file_pid provided."
                      << "\n";
            return;
        }

        FileAccess access = {};
        access.path = state.path;
        access.role = strace_pegtl::classify(state);
        access.pid = file_pid;
        if (state.syscall == "execve") {
            access.metadata["execve_argv"] = state.execve_argv;
        }

        auto it = records_.find(state.path);
        if (it == records_.end()) {
            FileRecord rec = {};
            rec.accesses.push_back(access);
            records_.emplace(state.path, std::move(rec));
        } else {
            it->second.accesses.push_back(access);
        }

    } catch (const tao::pegtl::parse_error &e) {
        if (debug) {
            const auto pos = e.positions().front();
            std::cerr << e.what() << "\n" << line << "\n";
        }
    }
}

bool StraceParser::run_and_parse(int argc, char **argv) {

    if (argc_ != 0 || argv_ != nullptr) {
        throw std::invalid_argument("StraceParser::run_and_parse called multiple times");
    }

    argc_ = argc;
    argv_ = argv;

    std::string tmpfile = "/tmp/strace_output_XXXXXX";
    int fileDesc = mkstemp(tmpfile.data());
    if (fileDesc < 0) {
        perror("mkstemp");
        return false;
    }
    close(fileDesc);

    start_tp_ = std::chrono::duration_cast<std::chrono::milliseconds>(
                    std::chrono::system_clock::now().time_since_epoch())
                    .count();
    pid_t pid = fork();
    if (pid < 0) {
        perror("fork");
        unlink(tmpfile.c_str());
        return false;
    }

    if (pid == 0) {
        // ------------------ CHILD ------------------
        std::vector<std::string> args = {"strace",
                                         "-ff",  // follow forks; create separate files
                                         "-ttt", // timestamps
                                         "-y",   // print fd paths
                                         "-e",     "trace=file", // trace only file syscalls
                                         "-o",     tmpfile,      // write output to temp file
                                         "-s",     "4096",       // max string size
                                         "--"};

        for (int i = 1; i < argc; ++i) {
            args.emplace_back(argv[i]);
        }

        std::vector<char *> cargs;
        cargs.reserve(args.size() + 1);
        for (auto &arg : args) {
            cargs.push_back(const_cast<char *>(arg.c_str()));
        }
        cargs.push_back(nullptr);

        if (debug) {
            std::cerr << "Executing strace with arguments:\n";
            for (const auto &arg : args) {
                std::cerr << "  " << arg;
            }
            std::cerr << '\n';
        }

        execvp("strace", cargs.data());
        perror("execvp strace");
        _exit(1);
    }

    // ------------------ PARENT ------------------
    if (debug) {
        std::cerr << "Started strace with PID " << pid << "\n";
    }

    int status = 0;
    if (waitpid(pid, &status, 0) < 0) {
        perror("waitpid");
        unlink(tmpfile.c_str());
        return false;
    }
    end_tp_ = std::chrono::duration_cast<std::chrono::milliseconds>(
                  std::chrono::system_clock::now().time_since_epoch())
                  .count();

    if (debug) {
        std::cerr << "Strace process exited with status " << status << "\n";
    }

    std::filesystem::path tmp_path(tmpfile);
    std::string dir = tmp_path.parent_path().string();
    std::string base = tmp_path.filename().string();
    if (dir.empty()) {
        dir = ".";
    }

    std::vector<std::pair<std::string, int>> outputs;
    try {
        for (const auto &entry : std::filesystem::directory_iterator(dir)) {
            const auto &p = entry.path();
            const std::string name = p.filename().string();
            // starts with base
            if (name.rfind(base, 0) == 0) {
                int found_pid = -1;
                if (name.size() > base.size() && name[base.size()] == '.') {
                    try {
                        found_pid = std::stoi(name.substr(base.size() + 1));
                    } catch (...) {
                        std::cerr << "PID malformed: " << name.substr(base.size() + 1) << "\n";
                    }
                }
                outputs.emplace_back(p.string(), found_pid);
            }
        }
    } catch (const std::filesystem::filesystem_error &e) {
        if (debug) {
            std::cerr << "Failed to iterate directory '" << dir << "': " << e.what() << "\n";
        }
    }

    if (outputs.empty()) {
        std::cerr << "No strace output files found with base: " << base << "\n";
        return false;
    }

    char *lineptr = nullptr;
    size_t cap = 0;

    for (const auto &output_path : outputs) {
        const std::string &path = output_path.first;
        const int file_pid = output_path.second;
        FILE *stream = fopen(path.c_str(), "r");
        if (stream == nullptr) {
            if (debug) {
                std::cerr << "Could not open strace output '" << path << "': " << strerror(errno)
                          << "\n";
            }
            continue;
        }

        for (;;) {
            ssize_t nread = getline(&lineptr, &cap, stream);
            if (nread == -1) {
                break;
            }
            parse_line(lineptr, file_pid);
        }

        fclose(stream);

        if (unlink(path.c_str()) != 0 && debug) {
            std::cerr << "Failed to unlink '" << path << "': " << strerror(errno) << "\n";
        }
    }

    if (debug) {
        std::cerr << "Finished parsing strace output\n";
    }

    free(lineptr);

    return true;
}

prov::ProvUploadInput StraceParser::get_provenance_data() {
    std::cout << "Gathering provenance data..." << '\n';
    if (argc_ < 2) {
        std::cerr
            << "Not enough arguments to gather provenance data\n Did you call run_and_parse()?\n";
        return {};
    }

    auto is_shared_object = [&](const std::string &path) -> bool {
        static const std::vector<std::string> excludedPrefixes = {
            "/lib/", "/usr/", "/lib64/", "/proc/", "/sys/", "/dev/", "/etc/", "/tmp/",
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
            if (!fs::is_regular_file(path)) {
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
            entity.label = fs::path(path).filename().string();
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
                    fs::last_write_time(path) - fs::file_time_type::clock::now() +
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