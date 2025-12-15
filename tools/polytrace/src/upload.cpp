#include "config.hpp"
#include "miniz.h"
#include "prov_client.hpp"
#include "upload_activity.hpp"
#include <filesystem>
#include <fstream>
#include <iostream>
#include <sstream>

bool load_payload_from_path(const std::string &path, ProvUploadInput &payload) {
    namespace fs = std::filesystem;
    try {
        if (!fs::exists(path) || !fs::is_regular_file(path)) {
            std::cerr << "File not found: " << path << '\n';
            return false;
        }
        auto ext = fs::path(path).extension().string();
        if (ext == ".zip") {
            std::cout << "Loading payload from ZIP file: " << path << '\n';
            size_t out_size = 0;
            void *archive_heap_pointer = mz_zip_extract_archive_file_to_heap(
                path.c_str(), "prov_upload_input.json", &out_size, 0);
            if ((archive_heap_pointer == nullptr) || out_size == 0) {
                std::cerr << "prov_upload_input.json not found in ZIP or extraction failed\n";
                return false;
            }
            std::string string_content(static_cast<char *>(archive_heap_pointer), out_size);
            mz_free(archive_heap_pointer);
            try {
                payload = json::parse(string_content);
                return true;
            } catch (const std::exception &e) {
                std::cerr << "Failed to parse JSON from prov_upload_input.json: " << e.what()
                          << '\n';
                return false;
            }
        } else if (ext == ".json") {
            std::ifstream input_stream(path);
            if (!input_stream) {
                std::cerr << "Failed to open JSON file: " << path << '\n';
                return false;
            }
            std::ostringstream outputStream;
            outputStream << input_stream.rdbuf();
            payload = json::parse(outputStream.str());
            return true;
        } else {
            std::cerr << "Unsupported file type: " << ext << ". Expected .zip or .json\n";
            return false;
        }
    } catch (const std::exception &e) {
        std::cerr << "Failed to parse payload argument: " << e.what() << '\n';
        return false;
    } catch (...) {
        std::cerr << "Unknown error while parsing payload argument\n";
        return false;
    }
}

static constexpr int DEFAULT_PROV_PORT = 3000;
static constexpr int DEFAULT_HTTP_PORT = 80;
static constexpr int DEFAULT_HTTPS_PORT = 443;

int main(int argc, char **argv) {
    try {
        bool interactiveInput = false;
        std::string interactiveArg;

        polytrace::ConfigManager configMgr;
        auto configOpt = configMgr.loadConfig();
        polytrace::ConfigManager::Config config;

        std::cout << "PolySim Upload Tool\n\n";
        if (!configOpt.has_value()) {
            std::cout << "No valid config file found.\n";
            config = polytrace::ConfigManager::interactiveSetup();
            configMgr.saveConfig(config);
            std::cout << "\nConfiguration saved to: " << configMgr.getConfigFilePath() << "\n\n";
        } else {
            config = configOpt.value();
        }

        if (argc == 1) {
            std::cout << "No arguments provided.\n\n";
            std::cout << "Please either:\n";
            std::cout << "  1) Run:   " << argv[0] << " --setup  to update config file\n";
            std::cout << "  2) Provide: <path-to-file.zip> or <path-to-file.json>\n\n";
            std::cout << "Examples:\n";
            std::cout << "  " << argv[0] << " --setup\n";
            std::cout << "  " << argv[0] << " activity.zip\n";
            std::cout << "Waiting for input. Press Ctrl+D to exit.\n> ";
            while (true) {
                std::string line;
                if (!std::getline(std::cin, line)) {
                    std::cout << "\nNo input provided. Exiting.\n";
                    return 0;
                }

                auto first = line.find_first_not_of(" \t\r\n");
                if (first == std::string::npos) {
                    std::cout << "> ";
                    continue;
                }
                auto last = line.find_last_not_of(" \t\r\n");
                interactiveArg = line.substr(first, last - first + 1);
                interactiveInput = true;
                break;
            }
        }

        std::string host;
        int port = DEFAULT_PROV_PORT;
        bool use_ssl = false;
        std::string basePath = "/api/public";
        std::string PAT;

        bool setupMode = false;
        if (interactiveInput) {
            setupMode = (interactiveArg == "--setup");
        } else {
            for (int i = 1; i < argc; ++i) {
                if (std::string(argv[i]) == "--setup") {
                    setupMode = true;
                    break;
                }
            }
        }

        if (setupMode) {
            std::cout << "=== Configuring PolySim Upload ===\n";
            auto config = polytrace::ConfigManager::interactiveSetup();
            configMgr.saveConfig(config);
            std::cout << "\nConfiguration saved to: " << configMgr.getConfigFilePath()
                      << " (user read/write only)\n";
            return 0;
        }

        PAT = config.personalAccessToken;

        try {
            std::string url = config.uploadUrl;
            size_t protocolEnd = url.find("://");
            if (protocolEnd != std::string::npos) {
                std::string scheme = url.substr(0, protocolEnd);
                if (scheme == "https") {
                    use_ssl = true;
                    port = DEFAULT_HTTPS_PORT;
                } else if (scheme == "http") {
                    use_ssl = false;
                    port = DEFAULT_HTTP_PORT;
                }
                url = url.substr(protocolEnd + 3);
            }

            size_t portStart = url.find_last_of(':');
            if (portStart != std::string::npos) {
                host = url.substr(0, portStart);
                try {
                    port = std::stoi(url.substr(portStart + 1));
                } catch (...) {
                    std::cerr << "Warning: Could not parse port from URL, using default\n";
                }
            } else {
                host = url;
            }
        } catch (const std::exception &e) {
            std::cerr << "Error parsing uploadUrl: " << e.what() << '\n';
            return 1;
        }

        std::cout << "Using configuration:\n";
        std::cout << "  host: " << host << '\n';
        std::cout << "  port: " << port << '\n';
        std::cout << "  basePath: " << basePath << '\n';
        std::cout << "  use_ssl: " << (use_ssl ? "true" : "false") << '\n';

        ProvUploadInput payload;
        bool payloadReady = false;

        int payloadArgIndex = -1;
        for (int i = 1; i < argc; ++i) {
            if (std::string(argv[i]) != "--setup") {
                payloadArgIndex = i;
                break;
            }
        }

        if (interactiveInput && !setupMode) {
            std::cout << "Using payload argument: " << interactiveArg << '\n';
            payloadReady = load_payload_from_path(interactiveArg, payload);
        } else if (payloadArgIndex != -1) {
            std::string arg = argv[payloadArgIndex];
            std::cout << "Using payload argument: " << arg << '\n';
            payloadReady = load_payload_from_path(arg, payload);
        }

        if (!payloadReady) {
            std::cerr << "No valid payload to upload. Aborting before network call.\n";
            return 1;
        }

        std::cout << "Uploading activity to server...\n";

        upload_activity(host, port, basePath, PAT, payload, use_ssl);
        return 0;
    } catch (const std::exception &e) {
        std::cerr << "Unhandled exception: " << e.what() << "\n";
        return 1;
    } catch (...) {
        std::cerr << "Unhandled unknown exception\n";
        return 1;
    }
}
