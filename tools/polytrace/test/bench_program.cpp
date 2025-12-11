// Simple configurable benchmark program for polytrace testing.
// Supports modes: write, read, create, unlink, cpu, sleep
// Command-line options (simple parsing):
// --mode <write|read|create|unlink|cpu|sleep>
// --path <dir> (default: ./bench_out)
// --files <n> (number of files per worker, default 4)
// --file-size <bytes> (size of file for write/read, default 1MB)
// --write-size <bytes> (write chunk size, default 4096)
// --iterations <n> (iterations per worker, default 10)
// --threads <n> (worker threads, default 1)
// --fork <n> (spawn n child processes instead of threads; if >0, threads ignored)
// --fsync (enable fsync after write)
// --sleep-ms <ms> (sleep between iterations)
// --cpu-ms <ms> (busy CPU work per iteration)

#include <atomic>
#include <chrono>
#include <cstring>
#include <fcntl.h>
#include <filesystem>
#include <fstream>
#include <iostream>
#include <nlohmann/json.hpp>
#include <set>
#include <string>
#include <sys/stat.h>
#include <sys/types.h>
#include <sys/wait.h>
#include <thread>
#include <unistd.h>
#include <vector>

using namespace std::chrono_literals;
namespace fs = std::filesystem;

struct Config {
    std::string mode = "write";
    std::string path = "./bench_out";
    int files = 4;
    size_t file_size = 1024 * 1024; // 1MB
    size_t write_size = 4096;
    int iterations = 10;
    int threads = 1;
    int fork_children = 0;
    bool fsync_after_write = false;
    int sleep_ms = 0;
    int cpu_ms = 0;
    std::string config_file = "";
};

static bool load_config_from_file(const std::string &path, Config &cfg) {
    try {
        if (path.empty()) {
            std::cerr << "Config file path empty\n";
            return false;
        }
        if (!fs::exists(path))
            return false;
        std::ifstream f(path);
        if (!f)
            return false;
        nlohmann::json j;
        f >> j;

        if (!j.contains("bench_program")) {
            return false;
        }

        nlohmann::json bp = j.at("bench_program");
        if (!bp.is_object()) {
            std::cerr << "Config 'bench_program' must be a JSON object\n";
            return false;
        }

        const std::set<std::string> allowed_keys = {
            "mode",       "path",    "files",         "file_size",         "write_size",
            "iterations", "threads", "fork_children", "fsync_after_write", "sleep_ms",
            "cpu_ms"};

        for (auto it = bp.begin(); it != bp.end(); ++it) {
            if (allowed_keys.find(it.key()) == allowed_keys.end()) {
                std::cerr << "Warning: unexpected key inside 'bench_program': '" << it.key()
                          << "' - this will be ignored\n";
            }
        }
        if (bp.contains("mode"))
            cfg.mode = bp.at("mode").get<std::string>();
        if (bp.contains("path"))
            cfg.path = bp.at("path").get<std::string>();
        if (bp.contains("files"))
            cfg.files = bp.at("files").get<int>();
        if (bp.contains("file_size"))
            cfg.file_size = bp.at("file_size").get<size_t>();
        if (bp.contains("write_size"))
            cfg.write_size = bp.at("write_size").get<size_t>();
        if (bp.contains("iterations"))
            cfg.iterations = bp.at("iterations").get<int>();
        if (bp.contains("threads"))
            cfg.threads = bp.at("threads").get<int>();
        if (bp.contains("fork_children"))
            cfg.fork_children = bp.at("fork_children").get<int>();
        if (bp.contains("fsync_after_write"))
            cfg.fsync_after_write = bp.at("fsync_after_write").get<bool>();
        if (bp.contains("sleep_ms"))
            cfg.sleep_ms = bp.at("sleep_ms").get<int>();
        if (bp.contains("cpu_ms"))
            cfg.cpu_ms = bp.at("cpu_ms").get<int>();
        return true;
    } catch (const std::exception &e) {
        std::cerr << "Failed to parse config file '" << path << "': " << e.what() << std::endl;
        return false;
    }
}

static std::string validate_config(const Config &c) {
    static const std::vector<std::string> allowed_modes = {"write",  "read", "create",
                                                           "unlink", "cpu",  "sleep"};
    if (std::find(allowed_modes.begin(), allowed_modes.end(), c.mode) == allowed_modes.end())
        return "invalid 'mode' value: '" + c.mode +
               "' (allowed: write, read, create, unlink, cpu, sleep)";
    if (c.path.empty())
        return "'path' must not be empty";
    if (c.files <= 0)
        return "'files' must be > 0";
    if (c.file_size == 0)
        return "'file_size' must be > 0";
    if (c.write_size == 0)
        return "'write_size' must be > 0";
    if (c.iterations < 0)
        return "'iterations' must be >= 0";
    if (c.threads <= 0)
        return "'threads' must be > 0";
    if (c.fork_children < 0)
        return "'fork_children' must be >= 0";
    if (c.sleep_ms < 0)
        return "'sleep_ms' must be >= 0";
    if (c.cpu_ms < 0)
        return "'cpu_ms' must be >= 0";
    return std::string();
}

void busy_cpu(int ms) {
    if (ms <= 0)
        return;
    auto deadline = std::chrono::steady_clock::now() + std::chrono::milliseconds(ms);
    volatile uint64_t x = 0;
    std::cout << "start busy_cpu for " << ms << " ms ... ";
    while (std::chrono::steady_clock::now() < deadline) {
        x += 1;
        x *= 2;
        x ^= 0xdeadbeef;
    }
    std::cout << "end\n";
}

void do_write_work(const Config &cfg, int worker_id, std::atomic<uint64_t> &bytes_written,
                   std::atomic<uint64_t> &ops) {
    fs::create_directories(cfg.path);
    std::string basename = cfg.path + "/bench_w" + std::to_string(worker_id) + "_";
    std::vector<char> buffer(cfg.write_size, 'a');

    for (int it = 0; it < cfg.iterations; ++it) {
        for (int f = 0; f < cfg.files; ++f) {
            std::string fname = basename + std::to_string(f);
            int fd = open(fname.c_str(), O_CREAT | O_WRONLY | O_TRUNC, 0644);
            if (fd < 0) {
                perror("open");
                continue;
            }
            size_t remaining = cfg.file_size;
            while (remaining > 0) {
                size_t towrite = std::min(remaining, cfg.write_size);
                ssize_t w = write(fd, buffer.data(), towrite);
                if (w <= 0) {
                    perror("write");
                    break;
                }
                remaining -= w;
                bytes_written += (uint64_t)w;
                ops += 1;
            }
            if (cfg.fsync_after_write)
                fsync(fd);
            close(fd);
        }
        if (cfg.sleep_ms > 0)
            std::this_thread::sleep_for(std::chrono::milliseconds(cfg.sleep_ms));
        if (cfg.cpu_ms > 0)
            busy_cpu(cfg.cpu_ms);
    }
}

void do_read_work(const Config &cfg, int worker_id, std::atomic<uint64_t> &bytes_read,
                  std::atomic<uint64_t> &ops) {
    std::string basename = cfg.path + "/bench_w" + std::to_string(worker_id) + "_";
    std::vector<char> buffer(cfg.write_size);

    for (int it = 0; it < cfg.iterations; ++it) {
        for (int f = 0; f < cfg.files; ++f) {
            std::string fname = basename + std::to_string(f);
            int fd = open(fname.c_str(), O_RDONLY);
            if (fd < 0) {
                perror("open");
                continue;
            }
            while (true) {
                ssize_t r = read(fd, buffer.data(), buffer.size());
                if (r < 0) {
                    perror("read");
                    break;
                }
                if (r == 0)
                    break;
                bytes_read += (uint64_t)r;
                ops += 1;
            }
            close(fd);
        }
        if (cfg.sleep_ms > 0)
            std::this_thread::sleep_for(std::chrono::milliseconds(cfg.sleep_ms));
        if (cfg.cpu_ms > 0)
            busy_cpu(cfg.cpu_ms);
    }
}

void do_create_unlink_work(const Config &cfg, int worker_id, std::atomic<uint64_t> &ops) {
    fs::create_directories(cfg.path);
    std::string basename = cfg.path + "/bench_c" + std::to_string(worker_id) + "_";
    for (int it = 0; it < cfg.iterations; ++it) {
        for (int f = 0; f < cfg.files; ++f) {
            std::string fname = basename + std::to_string(f);
            int fd = open(fname.c_str(), O_CREAT | O_WRONLY | O_TRUNC, 0644);
            if (fd >= 0)
                close(fd);
            ops += 1;
            if (cfg.sleep_ms > 0)
                std::this_thread::sleep_for(std::chrono::milliseconds(cfg.sleep_ms));
            if (unlink(fname.c_str()) == 0)
                ops += 1;
        }
        if (cfg.cpu_ms > 0)
            busy_cpu(cfg.cpu_ms);
    }
}

int run_worker_process(const Config &cfg, int worker_id) {
    std::atomic<uint64_t> bytes(0);
    std::atomic<uint64_t> ops(0);
    auto start = std::chrono::steady_clock::now();
    if (cfg.mode == "write") {
        do_write_work(cfg, worker_id, bytes, ops);
    } else if (cfg.mode == "read") {
        do_read_work(cfg, worker_id, bytes, ops);
    } else if (cfg.mode == "create") {
        do_create_unlink_work(cfg, worker_id, ops);
    } else if (cfg.mode == "unlink") {
        do_create_unlink_work(cfg, worker_id, ops);
    } else if (cfg.mode == "cpu") {
        for (int i = 0; i < cfg.iterations; ++i) {
            busy_cpu(cfg.cpu_ms);
        }
    } else if (cfg.mode == "sleep") {
        for (int i = 0; i < cfg.iterations; ++i)
            std::this_thread::sleep_for(std::chrono::milliseconds(cfg.sleep_ms));
    } else {
        std::cerr << "Unknown mode: " << cfg.mode << std::endl;
        return 2;
    }
    auto end = std::chrono::steady_clock::now();
    auto ms = std::chrono::duration_cast<std::chrono::milliseconds>(end - start).count();
    std::cout << "worker=" << worker_id << " mode=" << cfg.mode << " ops=" << ops.load()
              << " bytes=" << bytes.load() << " ms=" << ms << "\n";
    return 0;
}

void spawn_fork_children_and_run(const Config &cfg) {
    std::vector<pid_t> children;
    for (int i = 0; i < cfg.fork_children; ++i) {
        pid_t pid = fork();
        if (pid == 0) {
            // child
            int res = run_worker_process(cfg, i);
            _exit(res);
        } else if (pid > 0) {
            children.push_back(pid);
        } else {
            perror("fork");
        }
    }
    for (pid_t c : children) {
        int status = 0;
        waitpid(c, &status, 0);
    }
}

int main(int argc, char **argv) {
    Config cfg;

    if (argc < 2) {
        std::cerr << "Usage: " << argv[0] << " <config_path>\n";
        return 1;
    }
    cfg.config_file = argv[1];

    if (!load_config_from_file(cfg.config_file, cfg)) {
        std::cerr << "Failed to load config from: " << cfg.config_file << "\n";
        return 2;
    }

    std::string verr = validate_config(cfg);
    if (!verr.empty()) {
        std::cerr << "Configuration error: " << verr << std::endl;
        return 2;
    }

    std::cout << "bench_program starting: mode=" << cfg.mode << " path=" << cfg.path
              << " files=" << cfg.files << " file_size=" << cfg.file_size
              << " write_size=" << cfg.write_size << " iterations=" << cfg.iterations
              << " threads=" << cfg.threads << " fork=" << cfg.fork_children
              << " fsync=" << cfg.fsync_after_write << " cpu_ms=" << cfg.cpu_ms << "\n";

    if (cfg.fork_children > 0) {
        spawn_fork_children_and_run(cfg);
        return 0;
    }

    std::vector<std::thread> workers;
    for (int t = 0; t < cfg.threads; ++t) {
        workers.emplace_back([t, &cfg]() {
            std::atomic<uint64_t> bytes(0);
            std::atomic<uint64_t> ops(0);

            if (cfg.mode == "write") {
                do_write_work(cfg, t, bytes, ops);
            } else if (cfg.mode == "read") {
                do_read_work(cfg, t, bytes, ops);
            } else if (cfg.mode == "create" || cfg.mode == "unlink") {
                do_create_unlink_work(cfg, t, ops);
            } else if (cfg.mode == "cpu") {
                for (int i = 0; i < cfg.iterations; ++i)
                    busy_cpu(cfg.cpu_ms);
            } else if (cfg.mode == "sleep") {
                for (int i = 0; i < cfg.iterations; ++i)
                    std::this_thread::sleep_for(std::chrono::milliseconds(cfg.sleep_ms));
            }
        });
    }
    for (auto &w : workers)
        if (w.joinable())
            w.join();

    std::cout << "bench_program finished." << std::endl;
    return 0;
}
