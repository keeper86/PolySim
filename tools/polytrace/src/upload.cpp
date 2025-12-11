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
        bool interactiveInput = false;
        std::string interactiveArg;

        if (argc == 1) {
            std::cout << "PolySim upload tool\n";
            std::cout << "No arguments provided.\n\n";
            std::cout << "Please either:\n";
            std::cout << "  1) Run:   " << argv[0] << " --setup   (create/update config)\n";
            std::cout << "  2) Provide: <path-to-file.zip|path-to-file.json>\n\n";
            std::cout << "Examples:\n";
            std::cout << "  " << argv[0] << " --setup\n";
            std::cout << "  " << argv[0] << " activity.zip\n";
            std::cout << "Waiting for input (type --setup or a path to a .zip or .json file). Press Ctrl+D to exit.\n> ";
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

        polytrace::ConfigManager configMgr;
        auto configOpt = configMgr.loadConfig();

        std::string host = "https://polysim.work";
        int port = DEFAULT_PROV_PORT;
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

        if (!configOpt.has_value()) {
            std::cerr << "No configuration found. To create a configuration file please run:\n";
            std::cerr << "  " << argv[0] << " --setup\n";
            return 1;
        }

        const auto &config = configOpt.value();
        PAT = config.personalAccessToken;

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
        bool payloadReady = false; // set to true only once we have a valid payload

        int payloadArgIndex = -1;
        for (int i = 1; i < argc; ++i) {
            if (std::string(argv[i]) != "--setup") {
                payloadArgIndex = i;
                break;
            }
        }

        if (interactiveInput && !setupMode) {
            std::string arg = interactiveArg;
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
                                payloadReady = true;
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
                            payloadReady = true;
                        } else {
                            std::cerr << "Failed to open JSON file: " << arg << '\n';
                        }
                    } else {
                        std::cerr << "Unsupported file type: " << ext
                                  << ". Expected .zip or .json\n";
                    }
                } else {
                    std::cerr << "File not found: " << arg << '\n';
                }
            } catch (const std::exception &error) {
                std::cerr << "Failed to parse payload argument: " << error.what() << '\n';
            } catch (...) {
                std::cerr << "Unknown error while parsing payload argument\n";
            }
        } else if (payloadArgIndex != -1) {
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
                                payloadReady = true;
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
                            payloadReady = true;
                        } else {
                            std::cerr << "Failed to open JSON file: " << arg << '\n';
                        }
                    } else {
                        std::cerr << "Unsupported file type: " << ext
                                  << ". Expected .zip or .json\n";
                    }
                } else {
                    std::cerr << "File not found: " << arg << '\n';
                }
            } catch (const std::exception &error) {
                std::cerr << "Failed to parse payload argument: " << error.what() << '\n';
            } catch (...) {
                std::cerr << "Unknown error while parsing payload argument\n";
            }
        }

        if (!payloadReady) {
            std::cerr << "No valid payload to upload. Aborting before network call.\n";
            // In interactive mode, exit gracefully with 0 to match previous no-input behavior.
            // However, since a concrete invalid input was provided, return 1 to indicate error.
            return 1;
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
