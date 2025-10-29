#include <iostream>
#include <fstream>

int main()
{
    // Read input file if exists
    std::ifstream in("input.txt");
    std::string content = "default";
    if (in)
    {
        std::getline(in, content);
        in.close();
    }

    // Write an output file that the wrapper should detect
    std::ofstream out("output.txt");
    out << "processed:" << content << "\n";
    out.close();

    std::cout << "done\n";
    return 0;
}
