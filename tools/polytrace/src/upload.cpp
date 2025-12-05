#include "config.hpp"
#include "miniz.h"
#include "prov_client.hpp"
#include "sha256.hpp"
#include "upload_activity.hpp"
#include <chrono>
#include <filesystem>
#include <fstream>
#include <iostream>
#include <sstream>

using namespace prov;

static constexpr int DEFAULT_PROV_PORT = 3000;

int main(int argc, char **argv) {
    try {
        polytrace::ConfigManager configMgr;
        auto configOpt = configMgr.loadConfig();

        std::string host = "127.0.0.1";
        int port = DEFAULT_PROV_PORT;
        std::string basePath = "/api/public";
        std::string PAT;

        bool setupMode = false;
        for (int i = 1; i < argc; ++i) {
            if (std::string(argv[i]) == "--setup") {
                setupMode = true;
                break;
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

        // Load configuration from file
        if (!configOpt.has_value()) {
            std::cerr << "No configuration found. To create a configuration file please run:\n";
            std::cerr << "  " << argv[0] << " --setup\n";
            return 1;
        }

        const auto &config = configOpt.value();
        PAT = config.personalAccessToken;

        // Parse uploadUrl to extract host and port
        try {
            std::string url = config.uploadUrl;
            size_t protocolEnd = url.find("://");
            if (protocolEnd != std::string::npos) {
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

        ProvUploadInput payload;

        // Process payload argument if provided (skip --setup flag)
        int payloadArgIndex = -1;
        for (int i = 1; i < argc; ++i) {
            if (std::string(argv[i]) != "--setup") {
                payloadArgIndex = i;
                break;
            }
        }

        if (payloadArgIndex != -1) {
            std::string arg = argv[payloadArgIndex];
            std::cout << "Using payload argument: " << arg << '\n';

            try {
                namespace fs = std::filesystem;
                if (fs::exists(arg) && fs::is_regular_file(arg)) {
                    auto ext = fs::path(arg).extension().string();
                    if (ext == ".zip") {
                        std::cout << "Loading payload from ZIP file: " << arg << '\n';
                        size_t out_size = 0;
                        void *archive_heap_pointer = mz_zip_extract_archive_file_to_heap(
                            arg.c_str(), "prov_upload_input.json", &out_size, 0);
                        if (archive_heap_pointer != nullptr && out_size > 0) {
                            std::string string_content(static_cast<char *>(archive_heap_pointer),
                                                       out_size);
                            try {
                                payload = json::parse(string_content);
                            } catch (const std::exception &error) {
                                std::cerr << "Failed to parse JSON from prov_upload_input.json: "
                                          << error.what() << '\n';
                            }
                            mz_free(archive_heap_pointer);
                        } else {
                            std::cerr
                                << "prov_upload_input.json not found in ZIP or extraction failed\n";
                        }
                    } else if (ext == ".json") {
                        std::ifstream input_stream(arg);
                        if (input_stream) {
                            std::ostringstream outputStream;
                            outputStream << input_stream.rdbuf();
                            payload = json::parse(outputStream.str());
                        } else {
                            std::cerr << "Failed to open JSON file: " << arg << '\n';
                        }
                    } else {

                        std::ifstream input_stream(arg);
                        if (input_stream) {
                            std::ostringstream outputStream;
                            outputStream << input_stream.rdbuf();
                            try {
                                payload = json::parse(outputStream.str());
                            } catch (...) {
                                std::cerr << "File present but not valid JSON: " << arg << '\n';
                            }
                        }
                    }
                } else {

                    std::cout << "Parsing payload argument as inline JSON\n";
                    payload = json::parse(arg);
                }
            } catch (const std::exception &error) {
                std::cerr << "Failed to parse payload argument: " << error.what() << '\n';
            } catch (...) {
                std::cerr << "Unknown error while parsing payload argument\n";
            }
        }

        std::cout << "Uploading activity to server...\n";

        upload_activity(host, port, basePath, PAT, payload);
        return 0;
    } catch (const std::exception &e) {
        std::cerr << "Unhandled exception: " << e.what() << "\n";
        return 1;
    } catch (...) {
        std::cerr << "Unhandled unknown exception\n";
        return 1;
    }
}
