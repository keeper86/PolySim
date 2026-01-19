#include <iostream>

#ifdef __APPLE__
#include "fs_usage_parser_lite.hpp"

int main(int argc, char **argv) {
    FsUsageParserLite parser;
    parser.debug = true;

    if (!parser.run_and_capture(argc, argv)) {
        std::cerr << "[tracer_lite] Failed\n";
        return 1;
    }

    std::cout << "tracer_lite completed successfully\n";
    return 0;
}
#else
int main(int argc, char **argv) {
    (void)argc;
    (void)argv;
    std::cerr << "tracer_lite is only supported on macOS (fs_usage).\n";
    return 1;
}
#endif
