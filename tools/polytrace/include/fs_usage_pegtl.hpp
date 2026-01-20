#pragma once

#include <cctype>
#include <cstdlib>
#include <sstream>
#include <string>
#include <tao/pegtl.hpp>

namespace fs_usage_pegtl {
using namespace tao::pegtl;

static constexpr int DECIMAL_BASE = 10;

struct fs_usage_state {
    std::string timestamp;
    std::string operation;
    std::string fields;
    std::string duration;
    std::string process;
};

struct parsed_line {
    std::string operation;
    std::string path;
    int pid = -1;
};

inline std::string trim_whitespace(const std::string &input) {
    size_t start = input.find_first_not_of(" \t\r\n");
    if (start == std::string::npos) {
        return {};
    }
    size_t end = input.find_last_not_of(" \t\r\n");
    return input.substr(start, end - start + 1);
}

inline std::string strip_wrappers(const std::string &input) {
    std::string trimmed = trim_whitespace(input);
    if (trimmed.size() >= 2) {
        const char front = trimmed.front();
        const char back = trimmed.back();
        const bool is_wrapped = (front == '"' && back == '"') || (front == '<' && back == '>') ||
                                (front == '(' && back == ')');
        if (is_wrapped) {
            trimmed = trimmed.substr(1, trimmed.size() - 2);
        }
    }
    return trim_whitespace(trimmed);
}

inline std::string normalize_path_token(const std::string &token) {
    std::string trimmed = strip_wrappers(token);
    if (trimmed.empty()) {
        return {};
    }

    if (trimmed.front() == '[') {
        size_t close = trimmed.find(']');
        if (close != std::string::npos && close + 1 < trimmed.size() && trimmed[close + 1] == '/') {
            trimmed = trimmed.substr(close + 1);
        } else {
            return {};
        }
    }

    return trimmed;
}

inline bool is_number_like(const std::string &text) {
    if (text.empty()) {
        return false;
    }
    return std::all_of(text.begin(), text.end(),
                       [](char ch) { return ((ch >= '0' && ch <= '9') || ch == '.'); });
}

inline bool looks_like_path_token(const std::string &token) {
    if (token.empty()) {
        return false;
    }
    if (is_number_like(token)) {
        return false;
    }
    if (token[0] == '/' || token[0] == '.' || token[0] == '[') {
        return true;
    }
    if (token.find('/') != std::string::npos) {
        return true;
    }
    if (token.find('.') != std::string::npos) {
        return true;
    }
    return false;
}

inline std::string to_lower_ascii(std::string input) {
    for (char &ch : input) {
        if (ch >= 'A' && ch <= 'Z') {
            ch = static_cast<char>(ch - 'A' + 'a');
        }
    }
    return input;
}

inline bool operation_expects_path(const std::string &operation) {
    std::string op = to_lower_ascii(operation);
    if (op == "open" || op == "openat" || op == "creat" || op == "execve" || op == "posix_spawn") {
        return true;
    }
    if (op == "access" || op == "unlink" || op == "rename" || op == "renameat" ||
        op == "renameat2") {
        return true;
    }
    if (op == "link" || op == "linkat" || op == "symlink" || op == "readlink") {
        return true;
    }
    if (op == "mkdir" || op == "rmdir") {
        return true;
    }
    if (op == "stat" || op == "stat64" || op == "lstat" || op == "lstat64") {
        return true;
    }
    if (op == "fsgetpath" || op == "getattrlist" || op == "listxattr" || op == "setxattr" ||
        op == "removexattr") {
        return true;
    }
    return false;
}

inline bool is_flag_like(const std::string &token) {
    if (token.empty()) {
        return true;
    }
    bool has_underscore = false;
    bool has_lower = false;
    for (char ch : token) {
        if (ch == '_') {
            has_underscore = true;
        } else if (ch >= 'a' && ch <= 'z') {
            has_lower = true;
        }
    }
    return has_underscore && !has_lower;
}

inline std::string extract_path_from_fields(const std::string &fields,
                                            const std::string &operation) {
    std::istringstream iss(fields);
    std::string token;
    std::string path_candidate;
    std::string fallback_candidate;
    while (iss >> token) {
        if (token.find('=') != std::string::npos) {
            continue;
        }
        std::string normalized = normalize_path_token(token);
        if (normalized.empty()) {
            continue;
        }
        if (!looks_like_path_token(normalized)) {
            if (!is_number_like(normalized) && !is_flag_like(normalized)) {
                fallback_candidate = normalized;
            }
            continue;
        }
        path_candidate = normalized;
    }
    if (!path_candidate.empty()) {
        return path_candidate;
    }
    if (!fallback_candidate.empty() && operation_expects_path(operation)) {
        return fallback_candidate;
    }
    return {};
}

inline int extract_pid_from_process_token(const std::string &token) {
    std::string trimmed = trim_whitespace(token);
    size_t dot_pos = trimmed.rfind('.');
    if (dot_pos == std::string::npos || dot_pos + 1 >= trimmed.size()) {
        return -1;
    }
    const char *pid_str = trimmed.c_str() + dot_pos + 1;
    char *end_ptr = nullptr;
    long pid = std::strtol(pid_str, &end_ptr, DECIMAL_BASE);
    if (end_ptr == pid_str || *end_ptr != '\0' || pid <= 0) {
        return -1;
    }
    return static_cast<int>(pid);
}

// ───────────────────────────────────────────────────────────────
// Grammar
// ───────────────────────────────────────────────────────────────
struct ws : plus<space> {};
struct timestamp
    : seq<plus<digit>, one<':'>, plus<digit>, one<':'>, plus<digit>, one<'.'>, plus<digit>> {};
struct operation : plus<not_one<' ', '\t'>> {};
struct duration : seq<plus<digit>, one<'.'>, plus<digit>> {};
struct wait_flag : one<'W'> {};
struct process_text : plus<print> {};

struct tail;
struct fields : until<at<tail>, any> {};
struct tail : seq<duration, ws, opt<seq<wait_flag, ws>>, process_text> {};
struct line : seq<timestamp, ws, operation, ws, fields, tail, eof> {};
struct grammar : must<line> {};

template <typename Rule> struct action : nothing<Rule> {};

template <> struct action<timestamp> {
    template <typename Input> static void apply(const Input &input, fs_usage_state &state) {
        state.timestamp = input.string();
    }
};

template <> struct action<operation> {
    template <typename Input> static void apply(const Input &input, fs_usage_state &state) {
        state.operation = input.string();
    }
};

template <> struct action<fields> {
    template <typename Input> static void apply(const Input &input, fs_usage_state &state) {
        state.fields = input.string();
    }
};

template <> struct action<duration> {
    template <typename Input> static void apply(const Input &input, fs_usage_state &state) {
        state.duration = input.string();
    }
};

template <> struct action<process_text> {
    template <typename Input> static void apply(const Input &input, fs_usage_state &state) {
        state.process = trim_whitespace(input.string());
    }
};

inline bool parse_line(const std::string &line, parsed_line &out) {
    fs_usage_state state;
    try {
        tao::pegtl::memory_input mem_input(line, "fs_usage_line");
        tao::pegtl::parse<grammar, action>(mem_input, state);
    } catch (const tao::pegtl::parse_error &) {
        return false;
    }

    out.operation = state.operation;
    out.pid = extract_pid_from_process_token(state.process);
    out.path = extract_path_from_fields(state.fields, state.operation);
    return !out.operation.empty() && !out.path.empty();
}

} // namespace fs_usage_pegtl
