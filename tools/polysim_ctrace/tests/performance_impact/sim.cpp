// small simulation workload: CPU-heavy loop with occasional file IO
#include <chrono>
#include <cmath>
#include <fstream>
#include <iostream>
#include <string>

int main(int argc, char **argv)
{
    double duration_sec = 3.0; // default run length
    std::string mode = "occasional_io";
    if (argc > 1)
        duration_sec = std::stod(argv[1]);
    if (argc > 2)
        mode = argv[2];

    using clock = std::chrono::high_resolution_clock;
    auto start = clock::now();

    volatile double sink = 0.0;

    auto now = clock::now();
    if (mode == "cpu")
    {
        while (std::chrono::duration_cast<std::chrono::duration<double>>(now - start).count() < duration_sec)
        {
            for (int i = 0; i < 400000; ++i)
                sink += std::sin(i) * std::cos(i);
            now = clock::now();
        }
    }
    else if (mode == "occasional_io")
    {
        auto next_io = start + std::chrono::milliseconds(200);
        while (std::chrono::duration_cast<std::chrono::duration<double>>(now - start).count() < duration_sec)
        {
            for (int i = 0; i < 200000; ++i)
                sink += std::sin(i) * std::cos(i);
            now = clock::now();
            if (now >= next_io)
            {
                std::ofstream ofs("perf_tmp.txt", std::ios::trunc);
                ofs << "t=" << std::chrono::duration_cast<std::chrono::milliseconds>(now - start).count() << "\n";
                ofs.close();
                std::ifstream ifs("perf_tmp.txt");
                std::string line;
                std::getline(ifs, line);
                (void)line;
                ifs.close();
                next_io = now + std::chrono::milliseconds(200);
            }
        }
    }
    else if (mode == "frequent_io")
    {
        auto next_io = start + std::chrono::milliseconds(20);
        while (std::chrono::duration_cast<std::chrono::duration<double>>(now - start).count() < duration_sec)
        {
            for (int i = 0; i < 50000; ++i)
                sink += std::sin(i) * std::cos(i);
            now = clock::now();
            if (now >= next_io)
            {
                std::ofstream ofs("perf_tmp.txt", std::ios::trunc);
                ofs << "t=" << std::chrono::duration_cast<std::chrono::milliseconds>(now - start).count() << "\n";
                ofs.close();
                std::ifstream ifs("perf_tmp.txt");
                std::string line;
                std::getline(ifs, line);
                (void)line;
                ifs.close();
                next_io = now + std::chrono::milliseconds(20);
            }
        }
    }
    else if (mode == "open_close")
    {
        // repeatedly open and close a file
        while (std::chrono::duration_cast<std::chrono::duration<double>>(now - start).count() < duration_sec)
        {
            for (int i = 0; i < 1000; ++i)
            {
                std::ifstream ifs("perf_tmp.txt");
                ifs.close();
            }
            for (int i = 0; i < 200000; ++i)
                sink += std::sin(i) * std::cos(i);
            now = clock::now();
        }
    }
    else if (mode == "large_io")
    {
        // write a larger temporary file periodically
        auto next_io = start + std::chrono::milliseconds(500);
        std::string blob(64 * 1024, 'x');
        while (std::chrono::duration_cast<std::chrono::duration<double>>(now - start).count() < duration_sec)
        {
            for (int i = 0; i < 100000; ++i)
                sink += std::sin(i) * std::cos(i);
            now = clock::now();
            if (now >= next_io)
            {
                std::ofstream ofs("perf_tmp_large.bin", std::ios::binary | std::ios::trunc);
                for (int k = 0; k < 8; ++k)
                    ofs.write(blob.data(), blob.size());
                ofs.close();
                std::ifstream ifs("perf_tmp_large.bin", std::ios::binary);
                std::string buf;
                buf.resize(16 * 1024);
                ifs.read(&buf[0], buf.size());
                ifs.close();
                next_io = now + std::chrono::milliseconds(500);
            }
        }
    }

    std::cout << "done: " << sink << "\n";
    return 0;
}
