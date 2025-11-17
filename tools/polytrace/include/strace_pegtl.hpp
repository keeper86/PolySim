#pragma once
#include <algorithm>
#include <array>
#include <cctype>
#include <iostream>
#include <iterator>
#include <string>
#include <tao/pegtl.hpp>
#include <vector>

namespace strace_pegtl {
using namespace tao::pegtl;

struct syscall_state {
    std::string timestamp;
    int pid;
    std::string syscall;
    std::string args;
    std::string return_value;
    std::string path;
    std::string source_path;
    std::vector<std::string> execve_argv;
};

inline void trim_whitespace_and_brackets(std::string &input) {
    input.erase(input.begin(), std::find_if(input.begin(), input.end(), [](unsigned char ch_char) {
                    return (std::isspace(ch_char) == 0) && ch_char != '"' && ch_char != '<' &&
                           ch_char != '(' && ch_char != '[';
                }));
    input.erase(std::find_if(input.rbegin(), input.rend(),
                             [](unsigned char ch_char) {
                                 return (std::isspace(ch_char) == 0) && ch_char != '"' &&
                                        ch_char != '>' && ch_char != ')' && ch_char != ']';
                             })
                    .base(),
                input.end());
}
inline std::string trim_whitespace_and_brackets(const std::string &s_in) {
    std::string str = s_in;
    trim_whitespace_and_brackets(str);
    return str;
}

static const std::array<const char *, 18> syscalls_that_should_have_paths = {
    "open",    "openat", "creat",  "stat",   "lstat",  "fstat", "access", "readlink", "symlink",
    "mkdirat", "execve", "linkat", "execve", "linkat", "link",  "rename", "renameat", "renameat2"};

// ───────────────────────────────────────────────────────────────
// Basic tokens
// ───────────────────────────────────────────────────────────────
struct ws : star<space> {};
struct eolf : one<'\n'> {};

struct absolute_path_char : not_one<'>', '"'> {};
struct absolute_path : seq<one<'/'>, star<absolute_path_char>> {};
struct quoted_absolute_path : seq<one<'"'>, one<'/'>, star<absolute_path_char>, one<'"'>> {};
struct quoted_relative_path
    : seq<one<'"'>, one<'.'>, one<'/'>, star<absolute_path_char>, one<'"'>> {};

// ───────────────────────────────────────────────────────────────
// PID and timestamp prefixes
// ───────────────────────────────────────────────────────────────

// Optional PID prefix (e.g., "[pid 12345]" or "12345 "). Accept either form.
// Require at least one space after a plain numeric pid so it doesn't
// accidentally consume the integer part of a timestamp (e.g. "12345.678").
struct pid_simple : seq<plus<digit>, plus<space>> {};
struct pid_bracketed_prefix
    : seq<one<'['>, string<'p', 'i', 'd'>, space, plus<digit>, one<']'>, ws> {};
struct pid : sor<pid_bracketed_prefix, pid_simple> {};

struct timestamp : seq<plus<digit>, one<'.'>, plus<digit>, ws> {};

struct syscall_name : identifier {};
struct equal_sign : one<'='> {};

// ───────────────────────────────────────────────────────────────
// Generic syscall
// ───────────────────────────────────────────────────────────────

// Quoted strings: "..." (allow simple backslash-escaping inside)
struct quoted_string : if_must<one<'"'>, star<sor<seq<one<'\\'>, any>, not_one<'"'>>>, one<'"'>> {};
// Exclude backslash so escapes inside parentheses are handled by the quoted_string rule above.
struct paren_plain_char : not_one<'(', ')', '"', '\\'> {};

struct paren_content;
template <char OPEN, char CLOSE>
struct balanced_parens : if_must<one<OPEN>, until<at<one<CLOSE>>, paren_content>, one<CLOSE>> {};
struct paren_content : sor<balanced_parens<'(', ')'>, quoted_string, paren_plain_char> {};

struct generic_arguments : opt<balanced_parens<'(', ')'>> {};
struct generic_syscall : seq<syscall_name, ws, generic_arguments> {};

// ───────────────────────────────────────────────────────────────
// Trace-related sys_call markers, arguments and lines
// ───────────────────────────────────────────────────────────────

struct at_fdcwd
    : seq<string<'A', 'T', '_', 'F', 'D', 'C', 'W', 'D'>, one<'<'>, absolute_path, one<'>'>> {};
struct waitfor_closing_paren : seq<until<at<one<')'>, print>>, one<')'>> {};

struct renamedat2_marker : string<'r', 'e', 'n', 'a', 'm', 'e', 'a', 't', '2'> {};
struct linkat_marker : string<'l', 'i', 'n', 'k', 'a', 't'> {};
struct source_destination_args_marker : sor<linkat_marker, renamedat2_marker> {};
struct source_destination_args_destination : quoted_absolute_path {};
struct source_destination_args_source : quoted_absolute_path {};
struct source_destination_args_arguments
    : seq<one<'('>, at_fdcwd, one<','>, ws, source_destination_args_source, one<','>, ws, at_fdcwd,
          one<','>, ws, source_destination_args_destination, waitfor_closing_paren> {};
struct source_destination_args_call
    : seq<source_destination_args_marker, ws, source_destination_args_arguments> {};

struct execve_marker : string<'e', 'x', 'e', 'c', 'v', 'e'> {};
struct execve_executable_absolute : quoted_absolute_path {};
struct execve_executable_relative : quoted_relative_path {};
struct execve_executable : sor<execve_executable_absolute, execve_executable_relative> {};
struct execve_argv_element : quoted_string {};
struct execve_argv
    : seq<one<'['>, until<at<one<']'>>, seq<execve_argv_element, opt<one<','>, ws>>>, one<']'>> {};
struct execve_arguments
    : seq<one<'('>, execve_executable, one<','>, ws, execve_argv, one<','>, waitfor_closing_paren> {
};
struct execve_call : seq<execve_marker, ws, execve_arguments> {};

// ───────────────────────────────────────────────────────────────
// Return value and fd-path suffix
// ───────────────────────────────────────────────────────────────
struct return_value_char : not_one<'<', '\n'> {};
struct return_value : plus<return_value_char> {};

struct fd_path_suffix : seq<one<'<'>, absolute_path, one<'>'>> {};

// ───────────────────────────────────────────────────────────────
// Signal / unfinished / resumed / exit markers
// Allow optional PID and optional timestamp prefixes before these messages.
// Examples:
//   3002737 1762568619.518370 --- SIGCHLD { ... } ---
//   3002737 1762568619.518623 +++ exited with 0 +++
// ───────────────────────────────────────────────────────────────
struct signal_line : seq<opt<pid>, opt<timestamp>, three<'-'>, space,
                         until<at<seq<space, three<'-'>>>, print>, space, three<'-'>, eolf> {};
struct exited_line : seq<opt<pid>, opt<timestamp>, three<'+'>, space,
                         until<at<seq<space, three<'+'>>>, print>, space, three<'+'>, eolf> {};
struct unfinished_marker
    : seq<space, string<'<', 'u', 'n', 'f', 'i', 'n', 'i', 's', 'h', 'e', 'd'>, space> {};
struct unfinished : seq<opt<pid>, opt<timestamp>, until<at<unfinished_marker>, print>, space,
                        unfinished_marker, three<'.'>, one<'>'>, star<eolf>> {};
struct resumed : seq<opt<pid>, opt<timestamp>, string<'<', '.'>, plus<print>, eolf> {};

// ───────────────────────────────────────────────────────────────
// Main syscall line
// ───────────────────────────────────────────────────────────────
struct syscall : sor<source_destination_args_call, execve_call, generic_syscall> {};

struct syscall_line : seq<opt<pid>, timestamp, syscall, ws, equal_sign, ws, opt<string<'?'>, ws>,
                          opt<return_value>, ws, opt<fd_path_suffix>, star<eolf>> {};

struct line : sor<unfinished, syscall_line, signal_line, exited_line, resumed> {};
struct grammar : must<line, eof> {};

// ───────────────────────────────────────────────────────────────
// Parse state + actions
// ───────────────────────────────────────────────────────────────

template <typename Rule> struct action : nothing<Rule> {};

template <> struct action<timestamp> {
    template <typename Input> static void apply(const Input &input, syscall_state &state) {
        state.timestamp = input.string();
    }
};
template <> struct action<pid> {
    template <typename Input> static void apply(const Input &input, syscall_state &state) {
        auto str = input.string();
        std::string digits;
        for (char ch_c : str) {
            if (std::isdigit(static_cast<unsigned char>(ch_c))) {
                digits.push_back(ch_c);
            }
        }
        state.pid = atoi(digits.c_str());
    }
};

// ───────────────────────────────────────────────────────────────
// Syscall-specific actions
// ───────────────────────────────────────────────────────────────
template <> struct action<syscall_name> {
    template <typename Input> static void apply(const Input &input, syscall_state &state) {
        state.syscall = input.string();
    }
};
template <> struct action<generic_arguments> {
    template <typename Input> static void apply(const Input &input, syscall_state &state) {
        state.args = trim_whitespace_and_brackets(input.string());
    }
};

template <> struct action<source_destination_args_marker> {
    template <typename Input> static void apply(const Input &input, syscall_state &state) {
        state.syscall = input.string();
    }
};
template <> struct action<source_destination_args_source> {
    template <typename Input> static void apply(const Input &input, syscall_state &state) {
        state.source_path = trim_whitespace_and_brackets(input.string());
    }
};
template <> struct action<source_destination_args_destination> {
    template <typename Input> static void apply(const Input &input, syscall_state &state) {
        state.path = trim_whitespace_and_brackets(input.string());
    }
};

template <> struct action<execve_marker> {
    template <typename Input> static void apply(const Input & /*input*/, syscall_state &state) {
        state.syscall = "execve";
    }
};
template <> struct action<execve_executable> {
    template <typename Input> static void apply(const Input &input, syscall_state &state) {
        state.path = trim_whitespace_and_brackets(input.string());
    }
};
template <> struct action<execve_argv_element> {
    template <typename Input> static void apply(const Input &input, syscall_state &state) {
        state.execve_argv.push_back(trim_whitespace_and_brackets(input.string()));
    }
};

// ───────────────────────────────────────────────────────────────
// Suffix actions
// ───────────────────────────────────────────────────────────────
template <> struct action<return_value> {
    template <typename Input> static void apply(const Input &input, syscall_state &state) {
        auto str = input.string();
        std::string::size_type pos = str.find(' ');
        if (pos != std::string::npos) {
            state.return_value = str.substr(0, pos);
        } else {
            state.return_value = str;
        }
    }
};
template <> struct action<fd_path_suffix> {
    template <typename Input> static void apply(const Input &input, syscall_state &state) {
        if (!state.path.empty()) {
            std::cerr << "fd_path_suffix override " << state.path << " -> " << input.string()
                      << "\n";
        }
        state.path = trim_whitespace_and_brackets(input.string());
    }
};

template <> struct action<syscall_line> {
    template <typename Input> static void apply(const Input &input, syscall_state &state) {
        if (state.return_value == "-1") {
            return;
        }

        if (std::find(std::begin(syscalls_that_should_have_paths),
                      std::end(syscalls_that_should_have_paths),
                      state.syscall) != std::end(syscalls_that_should_have_paths)) {
            if (state.path.empty()) {
                std::cerr << "Warning: Expected path for syscall " << state.syscall
                          << " but none found in line: " << input.string() << "\n";
            }
        }
    }
};

// ────────────────────────────────
// Helper
// ────────────────────────────────
std::string classify(const syscall_state &state) {
    if (state.syscall == "execve") {
        return "process";
    }

    // Syscalls that explicitly open/create with write flags are outputs.
    if (state.args.find("O_WRONLY") != std::string::npos ||
        state.args.find("O_RDWR") != std::string::npos ||
        state.args.find("O_CREAT") != std::string::npos ||
        state.args.find("O_TRUNC") != std::string::npos ||
        state.args.find("O_APPEND") != std::string::npos || state.syscall == "creat") {
        return "output";
    }

    // Syscalls that create, move or link files should be considered outputs
    // because they result in new or modified filesystem entries even when
    // no O_* flags are present in the arguments.
    if (state.syscall == "link" || state.syscall == "linkat" || state.syscall == "rename" ||
        state.syscall == "renameat" || state.syscall == "mkdirat" || state.syscall == "renameat2") {
        return "output";
    }

    return "input";
}

} // namespace strace_pegtl
