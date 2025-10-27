#include "miniz.h"
#include <array>
#include <cstdio>
#include <cstdlib>
#include <cstring>
#include <ctime>
#include <filesystem>
#include <fstream>
#include <iomanip>
#include <iostream>
#include <openssl/evp.h>
#include <openssl/sha.h>
#include <sstream>
#include <string>
#include <sys/wait.h>
#include <unistd.h>
#include <unordered_map>
#include <unordered_set>
#include <vector>

namespace fs = std::filesystem;

// --- Struct for tracked files ---
struct FileEntry {
    std::string path;
    bool is_input;             // true=input, false=output
    bool skip_archive = false; // if true, record hash but don't include file in zip
};

// --- Global tracking ---
std::vector<FileEntry> files;
// keep a set to deduplicate paths
std::unordered_set<std::string> seen_paths;
// map path -> index in files vector to allow upgrades (input -> output)
std::unordered_map<std::string, size_t> path_index;

// Maximum size to include in the ZIP archive (1 MiB)
constexpr uint64_t MAX_ARCHIVE_BYTES = 1ULL * 1024 * 1024;

// --- Helpers ---
auto current_timestamp() -> std::string {
    constexpr size_t TIMESTAMP_BUF = 64;
    std::time_t now_t = std::time(nullptr);
    std::array<char, TIMESTAMP_BUF> buf{};
    std::strftime(buf.data(), buf.size(), "%Y-%m-%d_%H-%M-%S", std::localtime(&now_t));
    return std::string{buf.data()};
}

void hash_file(const fs::path &path, std::string &hash_out) {
    std::ifstream infile(path, std::ios::binary);
    if (!infile) {
        return;
    }

    // Use EVP APIs (preferred in OpenSSL 3+) to compute SHA-256
    EVP_MD_CTX *md_ctx = EVP_MD_CTX_new();
    const EVP_MD *md_alg = EVP_sha256();
    if (md_ctx == nullptr || md_alg == nullptr) {
        if (md_ctx != nullptr) {
            EVP_MD_CTX_free(md_ctx);
        }
        return;
    }
    if (EVP_DigestInit_ex(md_ctx, md_alg, nullptr) != 1) {
        EVP_MD_CTX_free(md_ctx);
        return;
    }

    constexpr size_t HASH_BUF = 8192;
    std::vector<char> buf(HASH_BUF);
    while (infile.read(buf.data(), static_cast<std::streamsize>(buf.size())) ||
           infile.gcount() > 0) {
        if (EVP_DigestUpdate(md_ctx, buf.data(), static_cast<size_t>(infile.gcount())) != 1) {
            EVP_MD_CTX_free(md_ctx);
            return;
        }
    }

    std::vector<unsigned char> hash(EVP_MAX_MD_SIZE);
    unsigned int hash_len = 0;
    if (EVP_DigestFinal_ex(md_ctx, hash.data(), &hash_len) != 1) {
        EVP_MD_CTX_free(md_ctx);
        return;
    }
    EVP_MD_CTX_free(md_ctx);

    std::ostringstream oss;
    for (unsigned int i = 0; i < hash_len; ++i) {
        oss << std::hex << std::setw(2) << std::setfill('0') << static_cast<int>(hash[i]);
    }
    hash_out = oss.str();
}

// --- Parse strace lines ---
void parse_line(const std::string &line) {
    // robustly extract path and detect write/read flags from strace output
    std::string line_s = line;
    std::string path_str;
    size_t path_pos = std::string::npos;

    auto extract_between_quotes = [&](size_t start_pos) -> std::pair<std::string, size_t> {
        size_t q1_idx = line_s.find('"', start_pos);
        if (q1_idx == std::string::npos) {
            return {"", std::string::npos};
        }
        size_t q2_idx = line_s.find('"', q1_idx + 1);
        if (q2_idx == std::string::npos) {
            return {"", std::string::npos};
        }
        return {line_s.substr(q1_idx + 1, q2_idx - q1_idx - 1), q2_idx};
    };

    if (line_s.find("open(") != std::string::npos) {
        auto extracted = extract_between_quotes(line_s.find("open("));
        path_str = extracted.first;
        path_pos = extracted.second;
    } else if (line_s.find("openat(") != std::string::npos) {
        auto extracted = extract_between_quotes(line_s.find("openat("));
        path_str = extracted.first;
        path_pos = extracted.second;
    } else if (line_s.find("creat(") != std::string::npos) {
        auto extracted = extract_between_quotes(line_s.find("creat("));
        path_str = extracted.first;
        path_pos = extracted.second;
    }

    if (path_str.empty()) {
        return;
    }

    // determine if the syscall indicates a write
    bool is_write = false;
    size_t check_from = (path_pos == std::string::npos) ? 0 : path_pos;
    std::string tail = line_s.substr(check_from);
    if (tail.find("O_WRONLY") != std::string::npos || tail.find("O_RDWR") != std::string::npos ||
        tail.find("O_CREAT") != std::string::npos || tail.find("O_TRUNC") != std::string::npos ||
        tail.find("O_APPEND") != std::string::npos || line_s.find("creat(") != std::string::npos) {
        is_write = true;
    }

    bool is_input = !is_write;

    // insert or upgrade existing entry
    auto found_it = path_index.find(path_str);
    if (found_it == path_index.end()) {
        size_t idx = files.size();
        files.push_back({path_str, is_input, false});
        path_index[path_str] = idx;
        seen_paths.insert(path_str);
    } else {
        size_t idx = found_it->second;
        // if previously marked input but now we see a write, upgrade to output
        if (files[idx].is_input && !is_input) {
            files[idx].is_input = false;
        }
    }
}

// --- Copy file to temp folder ---
auto copy_file_to_temp(const fs::path &src, const fs::path &temp_root) -> fs::path {
    fs::path dst = temp_root / src.filename();
    fs::copy_file(src, dst, fs::copy_options::overwrite_existing);
    return dst;
}

// --- Create ZIP archive ---
auto create_zip(const fs::path &zip_path, const fs::path &temp_root) -> bool {
    mz_zip_archive zip;
    memset(&zip, 0, sizeof(zip));
    if (mz_zip_writer_init_file(&zip, zip_path.c_str(), 0) == 0) {
        return false;
    }

    for (const auto &entry : fs::directory_iterator(temp_root)) {
        if (fs::is_regular_file(entry.path())) {
            std::ifstream infile(entry.path(), std::ios::binary);
            std::ostringstream oss;
            oss << infile.rdbuf();
            std::string data = oss.str();
            mz_zip_writer_add_mem(&zip, entry.path().filename().c_str(), data.data(), data.size(),
                                  MZ_BEST_COMPRESSION);
        }
    }
    bool ok_result = (mz_zip_writer_finalize_archive(&zip) != 0);
    mz_zip_writer_end(&zip);
    return ok_result;
}

// --- Main ---
auto main(int argc, char *argv[]) -> int {
    if (argc < 2) {
        std::cerr << "Usage: " << argv[0] << " <program> [args...]\n";
        return 1;
    }

    std::string timestamp = current_timestamp();
    fs::path temp_root = fs::temp_directory_path() / ("tracewrap_" + timestamp);
    fs::create_directories(temp_root);

    // --- Save metadata ---
    std::ofstream meta(temp_root / "runmeta.txt");
    meta << "Command:";
    for (int i = 1; i < argc; ++i) {
        meta << " " << argv[i];
    }
    meta << "\n";
    meta.close();

    // --- Pipe for strace ---
    std::array<int, 2> pipefd{};
    if (pipe(pipefd.data()) < 0) {
        perror("pipe");
        return 1;
    }

    pid_t pid = fork();
    if (pid == 0) {
        // child: redirect stderr to pipe
        close(pipefd[0]);
        dup2(pipefd[1], STDERR_FILENO);
        close(pipefd[1]);

        char **cmd = new char *[argc + 4];
        cmd[0] = const_cast<char *>("strace");
        cmd[1] = const_cast<char *>("-f");
        cmd[2] = const_cast<char *>("-e");
        cmd[3] = const_cast<char *>("trace=file");
        for (int i = 1; i < argc; ++i) {
            cmd[i + 3] = argv[i];
        }
        cmd[argc + 3] = nullptr;
        execvp("strace", cmd);
        perror("execvp strace");
        exit(1);
    }

    // parent: read strace output
    close(pipefd[1]);
    FILE *stream = fdopen(pipefd[0], "r");
    if (stream == nullptr) {
        perror("fdopen");
        return 1;
    }

    constexpr size_t LINE_BUF = 4096;
    std::vector<char> line(LINE_BUF);
    while (fgets(line.data(), static_cast<int>(line.size()), stream) != nullptr) {
        parse_line(line.data());
    }
    fclose(stream);
    waitpid(pid, nullptr, 0);

    // --- Copy and hash all files ---
    // We'll compute hashes for all recorded files. Shared libraries and the dynamic linker cache
    // are recorded by hash but NOT archived to keep the ZIP small and avoid unnecessary blobs.
    auto is_shared_lib = [&](const std::string &path) -> bool {
        if (path == "/etc/ld.so.cache") {
            return true;
        }
        // common lib dirs
        if (path.rfind("/lib/", 0) == 0) {
            return true;
        }
        if (path.rfind("/usr/lib/", 0) == 0) {
            return true;
        }
        if (path.rfind("/lib64/", 0) == 0) {
            return true;
        }
        if (path.rfind("/usr/lib64/", 0) == 0) {
            return true;
        }
        // .so files anywhere
        if (path.size() > 3 && path.substr(path.size() - 3) == ".so") {
            return true;
        }
        return false;
    };

    // Prepare JSON manifest for output hashes
    std::ofstream json_meta(temp_root / "outputs_manifest.json");
    json_meta << "{\n  \"files\": [\n";

    bool first = true;
    for (auto &file_entry : files) {
        std::string path = file_entry.path;
        file_entry.skip_archive = is_shared_lib(path);

        std::string hash;
        try {
            hash_file(path, hash);
        } catch (...) {
            hash = "";
        }

        bool archived = false;
        if (!file_entry.skip_archive) {
            try {
                uint64_t file_size_u64 = 0;
                try {
                    file_size_u64 = static_cast<uint64_t>(fs::file_size(path));
                } catch (...) {
                    file_size_u64 = UINT64_MAX;
                }
                if (file_size_u64 <= MAX_ARCHIVE_BYTES) {
                    fs::path copied = copy_file_to_temp(path, temp_root);
                    (void)copied;
                    archived = true;
                } else {
                    // too large, skip archiving but keep the hash
                    archived = false;
                }
            } catch (...) {
                archived = false;
            }
        }

        if (!first) {
            json_meta << ",\n";
        }
        first = false;

        // JSON-escape path (minimal)
        std::string esc_path = path;
        size_t pos = 0;
        while ((pos = esc_path.find('\\', pos)) != std::string::npos) {
            esc_path.replace(pos, 1, "\\\\");
            pos += 2;
        }
        pos = 0;
        while ((pos = esc_path.find('"', pos)) != std::string::npos) {
            esc_path.replace(pos, 1, "\\\"");
            pos += 2;
        }

        json_meta << "    {\n";
        json_meta << "      \"path\": \"" << esc_path << "\",\n";
        json_meta << "      \"is_input\": " << (file_entry.is_input ? "true" : "false") << ",\n";
        json_meta << "      \"sha256\": \"" << hash << "\",\n";
        json_meta << "      \"archived\": " << (archived ? "true" : "false") << "\n";
        json_meta << "    }";

        std::cout << (file_entry.is_input ? "[INPUT]" : "[OUTPUT]") << " " << path << " " << hash;
        if (file_entry.skip_archive) {
            std::cout << " [SKIPPED_ARCHIVE]";
        }
        std::cout << "\n";
    }

    json_meta << "\n  ]\n}\n";
    json_meta.close();

    // --- Create ZIP ---
    fs::path zip_name = "run_" + timestamp + ".zip";
    if (create_zip(zip_name, temp_root)) {
        std::cout << "Created archive: " << zip_name << "\n";
    } else {
        std::cerr << "Failed to create ZIP\n";
    }

    // Cleanup temp folder
    fs::remove_all(temp_root);
    return 0;
}
