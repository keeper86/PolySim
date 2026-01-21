// End-to-end test for StraceParser using real strace (skips if strace not found).
#include "strace_parser.hpp"
#include "gtest/gtest.h"
#include <cerrno>
#include <cstdlib>
#include <filesystem>
#include <map>
#include <prov_client.hpp>
#include <set>
#include <string>
#include <unistd.h>

std::string fixture_dir = std::string(TEST_FIXTURES_DIR);

// ----------------------------------------------------------------------------
// single rules tests
// ----------------------------------------------------------------------------
std::vector<std::string> source_destination_args_test_cases = {

    "linkat(AT_FDCWD</build>, "
    "\"/source\", "
    "AT_FDCWD</build>, "
    "\"/dest\", 0)",
    "renameat2(AT_FDCWD</build>, "
    "\"/source\", "
    "AT_FDCWD</build>, "
    "\"/dest\", RENAME_NOREPLACE)",

};
TEST(StracePegtl, SourceDestArgsRule) {
    using namespace strace_pegtl;

    for (auto &test_case : source_destination_args_test_cases) {

        syscall_state st;
        tao::pegtl::memory_input in(test_case, "input");
        tao::pegtl::parse<source_destination_args_call, strace_pegtl::action>(in, st);

        EXPECT_TRUE(st.syscall == "renameat2" || st.syscall == "linkat")
            << "Unexpected syscall: " << st.syscall;
        EXPECT_EQ(st.source_path, "/source");
        EXPECT_EQ(st.path, "/dest");
    }
}

TEST(StracePegtl, ExecveRule) {
    using namespace strace_pegtl;

    std::string line = "execve(\"/usr/bin/head\", [\"head\", \"-c\", \"8\", "
                       "\"/etc/bash_completion.d/git-prompt\"], 0x7ffc9eaf5ca8 /* 84 vars */)";

    syscall_state st;
    tao::pegtl::memory_input in(line, "execve_input");
    tao::pegtl::parse<execve_call, strace_pegtl::action>(in, st);

    EXPECT_EQ(st.syscall, "execve");
    EXPECT_EQ(st.path, "/usr/bin/head");
    ASSERT_EQ(st.execve_argv.size(), 4U);
    EXPECT_EQ(st.execve_argv[0], "head");
    EXPECT_EQ(st.execve_argv[1], "-c");
    EXPECT_EQ(st.execve_argv[2], "8");
    EXPECT_EQ(st.execve_argv[3], "/etc/bash_completion.d/git-prompt");
}

// ----------------------------------------------------------------------------
// parse_line tests
// ----------------------------------------------------------------------------
struct ParserTestCase {
    std::string line;
    std::string expected_type; // "input", "output", "process" or "null"
    std::string expected_path;
};

std::vector<ParserTestCase> parser_test_cases = {

    {"[pid 2706402] 1762388620.731716 "
     "openat(AT_FDCWD</build>, "
     "\"/test/fixtures/polytrace_e2e_out\", "
     "O_WRONLY|O_CREAT|O_TRUNC, 0666) = "
     "4</test/fixtures/polytrace_e2e_out>\n",
     "output", "/test/fixtures/polytrace_e2e_out"},

    {"1762468454.223596 openat(AT_FDCWD</build>, "
     "\"/test/fixtures/tmp/simple_run_out\", "
     "O_WRONLY|O_CREAT|O_TRUNC, 0666) = "
     "3</test/fixtures/tmp/simple_run_out>",
     "output", "/test/fixtures/tmp/simple_run_out"},

};
TEST(StraceParser, ParseLines) {

    for (auto &test_case : parser_test_cases) {
        StraceParser parser;
        parser.debug = true;
        parser.parse_line(test_case.line, 123456);
        const auto &records = parser.records();
        if (test_case.expected_type == "null") {
            ASSERT_EQ(records.size(), 0U);
            continue;
        }
        ASSERT_EQ(records.size(), 1U);
        auto it = records.find(test_case.expected_path);
        ASSERT_NE(it, records.end());
        ASSERT_FALSE(it->second.accesses.empty());
        EXPECT_EQ(it->second.accesses[0].role, test_case.expected_type);
    }
}

// ----------------------------------------------------------------------------
// full trace tests
// ----------------------------------------------------------------------------
TEST(StraceParser, E2E_RunAndParse) {

    if (system("which strace > /dev/null 2>&1") != 0) {
        GTEST_SKIP() << "strace not available in PATH";
    }

    std::filesystem::path prov_dir =
        std::filesystem::path(fixture_dir) / "tmp" / "prov_upload_input";
    try {
        if (std::filesystem::exists(prov_dir)) {
            std::filesystem::remove_all(prov_dir);
        }
        std::filesystem::create_directories(prov_dir);
    } catch (const std::filesystem::filesystem_error &e) {
        std::cerr << "Warning: failed to create directory " << prov_dir << ": " << e.what()
                  << '\n';
    }

    std::vector<std::string> args = {
        "/simple_run.sh",        "/pipeline.sh",        "/file_ops.sh",
        "/fork_exec.sh",         "/rename_dirs.sh",     "/hardlink_chmod.sh",
        "/concurrent_append.sh", "/complex_sysread.sh", "/change_exec_dirs.sh",
    };

    // Hardcoded expectations per fixture (paths are relative to the fixture dir
    // for files inside the fixtures' tmp/ subdir, or absolute for system files)
    std::map<std::string, std::vector<std::string>> expectations = {
        {"/simple_run.sh", {"/tmp/simple_run_out"}},
        {"/pipeline.sh", {"/tmp/pipeline_out/2"}},
        {"/file_ops.sh", {"/tmp/file_ops/a", "/tmp/file_ops/b"}},
        {"/fork_exec.sh", {"/tmp/fork_exec_out"}},
        {"/rename_dirs.sh", {"/tmp/rename_dirs/dir2/file"}},
        {"/hardlink_chmod.sh", {"/tmp/hard_link/hard_a", "/tmp/hard_link/hard_b"}},
        {"/concurrent_append.sh", {"/tmp/concurrent_append_file"}},
        {"/change_exec_dirs.sh",
         {"/tmp/change_exec_dirs_out/tmp/copied_script.sh",
          "/tmp/change_exec_dirs_out/tmp/test.txt"}},
    };

    std::cout << "Using fixture directory: " << fixture_dir << '\n';

    for (const auto &script : args) {
        std::cout << "\n----------------------------------------------------\nRunning " << script
                  << " fixture via strace..." << '\n';

        StraceParser parser;
        parser.debug = true;

        std::string resolved_script = fixture_dir + script;
        char *argv[] = {(char *)"trace-e2e", (char *)"/bin/sh", (char *)"-c",
                        (char *)resolved_script.c_str(), nullptr};
        int argc = 4;

        auto start_tp = std::chrono::duration_cast<std::chrono::milliseconds>(
                    std::chrono::system_clock::now().time_since_epoch())
                    .count();
        bool ok = parser.run_and_parse(argc, argv);
        ASSERT_TRUE(ok);
        auto end_tp = std::chrono::duration_cast<std::chrono::milliseconds>(
                  std::chrono::system_clock::now().time_since_epoch())
                  .count();

        prov::json out = parser.get_provenance_data();

        EXPECT_TRUE(out.contains("entities"));
        EXPECT_TRUE(out["entities"].is_array());
        EXPECT_TRUE(out.contains("activity"));
        EXPECT_TRUE(out["activity"].contains("startedAt"));
        EXPECT_TRUE(out["activity"].contains("endedAt"));
        EXPECT_GE(out["activity"]["startedAt"].get<int64_t>(), start_tp);
        EXPECT_LE(out["activity"]["endedAt"].get<int64_t>(), end_tp);
        EXPECT_TRUE(out["entities"].is_array());

        auto it = expectations.find(script);
        if (it != expectations.end()) {
            for (const auto &expected_rel : it->second) {

                bool found = false;
                for (const auto &ent : out["entities"]) {
                    if (ent.contains("metadata") && ent["metadata"].contains("path") &&
                        ent["metadata"]["path"].get<std::string>() == fixture_dir + expected_rel) {
                        found = true;
                        break;
                    }
                }
                EXPECT_TRUE(found)
                    << "Expected file path not found in entities: " << fixture_dir + expected_rel;
            }
        }

        std::ofstream prov_meta((prov_dir / (fs::path(script).stem().string() + ".json")).string());
        prov_meta << out.dump(2) << '\n';
        prov_meta.close();
    }
}
