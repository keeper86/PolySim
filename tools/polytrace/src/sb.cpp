#include <spawn.h>
#include <sys/wait.h>
#include <fcntl.h>
#include <unistd.h>
#include <signal.h>
#include <cerrno>
#include <cstring>
#include <iostream>
#include <string>
#include <vector>

extern char **environ;

static bool process_exists(pid_t pid) {
    // kill(pid, 0) doesn't send a signal; it just checks existence/permission.
    if (pid <= 0) return false;
    int rc = kill(pid, 0);
    if (rc == 0) return true;
    return (errno == EPERM); // exists but we lack permission
}

static int run_fs_usage(pid_t target_pid,
                        const std::string& output_path,
                        int duration_seconds) {
    // Open output file
    int fd = open(output_path.c_str(), O_CREAT | O_TRUNC | O_WRONLY, 0644);
    if (fd < 0) {
        std::cerr << "open failed: " << std::strerror(errno) << "\n";
        return 1;
    }

    // Set up redirection actions for the spawned child.
    posix_spawn_file_actions_t actions;
    posix_spawn_file_actions_init(&actions);

    // Redirect stdout and stderr to the file
    posix_spawn_file_actions_adddup2(&actions, fd, STDOUT_FILENO);
    posix_spawn_file_actions_adddup2(&actions, fd, STDERR_FILENO);
    posix_spawn_file_actions_addclose(&actions, fd);

    std::string pid_str = std::to_string(target_pid);
    std::string duration_str = std::to_string(duration_seconds);
    std::vector<std::string> arg_strs = {
        "fs_usage",
        "-w",
        "-f", "filesys",
        "-t", duration_str,
        pid_str
    };

    // Convert to char* argv
    std::vector<char*> argv;
    argv.reserve(arg_strs.size() + 1);
    for (auto& s : arg_strs) argv.push_back(const_cast<char*>(s.c_str()));
    argv.push_back(nullptr);

    pid_t child_pid = 0;
    int rc = posix_spawnp(&child_pid, "fs_usage", &actions, nullptr, argv.data(), environ);
    posix_spawn_file_actions_destroy(&actions);
    close(fd);

    if (rc != 0) {
        std::cerr << "posix_spawnp failed: " << std::strerror(rc) << "\n";
        return 1;
    }

    int status = 0;
    if (waitpid(child_pid, &status, 0) < 0) {
        std::cerr << "waitpid failed: " << std::strerror(errno) << "\n";
        return 1;
    }
    return 0;

    // Otherwise, run until target process exits, then stop fs_usage cleanly.
    while (process_exists(target_pid)) {
        usleep(100 * 1000); // 100ms polling
    }

    // Ask fs_usage to stop (SIGINT behaves like Ctrl+C)
    kill(child_pid, SIGINT);

    waitpid(child_pid, &status, 0);
    return 0;
}

int main(int argc, char** argv) {
    if (argc != 4) {
        std::cerr << "Usage:\n"
                  << "  " << argv[0] << " <target_pid> <output.txt> [seconds]\n"
                  << "Examples:\n"
                  << "  " << argv[0] << " 12345 /tmp/fs.txt 10   # run 10 seconds\n";
        return 1;
    }

    pid_t target_pid = static_cast<pid_t>(std::stoi(argv[1]));
    std::string out = argv[2];
    int seconds = (argc >= 4) ? std::stoi(argv[3]) : 0;

    return run_fs_usage(target_pid, out, seconds);
}