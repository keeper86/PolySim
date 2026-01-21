#include <iostream>
#include <string>
#include <termios.h>
#include <unistd.h>

std::string readHiddenInput() {
    termios oldt, newt;
    std::string input;

    tcgetattr(STDIN_FILENO, &oldt);
    newt = oldt;

    newt.c_lflag &= ~ECHO;
    tcsetattr(STDIN_FILENO, TCSANOW, &newt);

    std::getline(std::cin, input);

    tcsetattr(STDIN_FILENO, TCSANOW, &oldt);
    std::cout << std::endl;

    return input;
}
