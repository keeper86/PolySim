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

#include "prov_client.hpp"
#include <chrono>

namespace fs = std::filesystem;

#ifdef __APPLE__
#include "fs_usage_parser.hpp"
using TraceParser = FsUsageParser;
#else
#include "strace_parser.hpp"
using TraceParser = StraceParser;
#endif

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

int main(int argc, char *argv[]) {
    try {
        if (argc < 2) {
            std::cerr << "Usage: " << argv[0] << " <program> [args...]\n";
            return 1;
        }

        TraceParser parser;
        parser.debug = false; // Enable debug output

        if (!parser.run_and_parse(argc, argv)) {
            std::cerr << "Failed to run trace and parse output\n";
            return 1;
        }

        namespace fs = std::filesystem;
        fs::path temp_root =
            fs::temp_directory_path() / ("polysim_trace_" + std::to_string(rand()));
        fs::create_directories(temp_root);

        prov::json out = parser.get_provenance_data();
        std::ofstream prov_meta(temp_root / "prov_upload_input.json");
        prov_meta << out.dump(2) << '\n';
        prov_meta.close();

        fs::path zip_name =
            "run_" + std::to_string(std::chrono::system_clock::now().time_since_epoch().count()) +
            ".zip";
        if (create_zip(zip_name, temp_root)) {
            std::cout << "Created archive: " << zip_name << "\n";
        } else {
            std::cerr << "Failed to create ZIP\n";
        }

        fs::remove_all(temp_root);
        return 0;
    } catch (const std::exception &e) {
        std::cerr << "Unhandled exception: " << e.what() << "\n";
        return 1;
    } catch (...) {
        std::cerr << "Unhandled unknown exception\n";
        return 1;
    }
}
