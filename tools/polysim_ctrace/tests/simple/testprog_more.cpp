#include <cstring>
#include <fstream>
#include <iostream>
#include <string>
#include <sys/stat.h>

int main(int argc, char **argv) {
    if (argc < 2) {
        std::cerr << "usage: testprog_more <mode>\n";
        return 2;
    }
    std::string mode = argv[1];
    if (mode == "small") {
        std::ofstream out("output_small.txt");
        out << "small content" << std::endl;
        return 0;
    }
    if (mode == "large") {
        std::ofstream out("output_large.bin", std::ios::binary);
        // write ~1.2 MiB
        const size_t SZ = 1.2 * 1024 * 1024;
        for (size_t i = 0; i < SZ; ++i)
            out.put((char)(i & 0xFF));
        return 0;
    }
    if (mode == "special") {
        std::ofstream out("output space \"quotes\".txt");
        out << "weird name" << std::endl;
        return 0;
    }
    if (mode == "multiple") {
        std::ofstream a("out1.txt");
        a << "1" << std::endl;
        std::ofstream b("out2.txt");
        b << "2" << std::endl;
        std::ofstream c("out3.txt");
        c << "3" << std::endl;
        return 0;
    }
    if (mode == "unreadable") {
        std::ofstream out("secret.bin", std::ios::binary);
        out << "topsecret" << std::endl;
        out.close();
        // make unreadable
        chmod("secret.bin", 0000);
        return 0;
    }
    std::cerr << "unknown mode" << std::endl;
    return 3;
}
