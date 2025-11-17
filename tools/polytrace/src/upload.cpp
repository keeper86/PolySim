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

static int64_t now_ms() {
    using namespace std::chrono;
    return (int64_t)duration_cast<milliseconds>(system_clock::now().time_since_epoch()).count();
}

static ProvUploadInput create_example_payload() {
    // Build the same example payload as before and delegate to the reusable uploader.
    ProvUploadInput payload;

    // Example entities: input, process, output; !!use real sha256 for input validation!!
    Entity inputEnt;
    inputEnt.id = make_sha256("example-input-file-content");
    inputEnt.label = "input-file";
    inputEnt.role = "input";
    inputEnt.metadata = {{"path", "./data/in.txt"}};
    inputEnt.createdAt = now_ms();

    Entity processEnt;
    processEnt.id = make_sha256("process-sha256-example");
    processEnt.label = "example-process";
    processEnt.role = "process";
    processEnt.metadata = {{"cmd", "simulate"}};

    Entity outputEnt;
    outputEnt.id = make_sha256("output-sha256-example");
    outputEnt.label = "out-file";
    outputEnt.role = "output";
    outputEnt.metadata = {{"path", "./data/out.txt"}};

    payload.entities = {inputEnt, processEnt, outputEnt};

    Activity activity;
    activity.id = make_sha256("activity-sha256-example");
    activity.label = "Example run";
    activity.startedAt = now_ms();
    activity.endedAt = now_ms();
    activity.metadata = {{"notes", "example upload"}};

    payload.activity = activity;

    return payload;
}

int main(int argc, char **argv) {
    try {
        std::string host = "127.0.0.1";
        int port = DEFAULT_PROV_PORT;
        std::string basePath = "/api/public";
        std::string PAT = "put-your-pat-here";
        ProvUploadInput payload = create_example_payload();

        std::cout << "Default upload parameters:\n";
        std::cout << "  host: " << host << '\n';
        std::cout << "  port: " << port << '\n';
        std::cout << "  basePath: " << basePath << '\n';
        std::cout << "  argc: " << argc << '\n';
        std::cout << "  argv[0]: " << argv[0] << '\n';
        std::cout << "  argv[1]: " << argv[1] << '\n';

        if (argc >= 2) {
            std::string arg = argv[1];
            std::cout << "Using payload argument: " << arg << '\n';
            // If argument points to an existing file, try to load it.
            try {
                namespace fs = std::filesystem;
                if (fs::exists(arg) && fs::is_regular_file(arg)) {
                    auto ext = fs::path(arg).extension().string();
                    if (ext == ".zip") {
                        std::cout << "Loading payload from ZIP file: " << arg << '\n';
                        // Use miniz helper to extract a single file to heap
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
                        // Unknown extension but file exists: try to parse it as JSON text
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
                    // Not a file: try to parse argument as inline JSON (existing behavior)
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
