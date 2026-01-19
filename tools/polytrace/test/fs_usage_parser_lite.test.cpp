#include "fs_usage_parser_lite.hpp"
#include "gtest/gtest.h"
#include <filesystem>
#include <fstream>
#include <string>
#include <vector>
#include <unistd.h>

// Unit tests for FsUsageParserLite, focused on option parsing, helpers, and filtering logic.
// End-to-end test that requires macOS fs_usage will be conditionally skipped if unavailable.

static bool has_fs_usage() {
#ifdef __APPLE__
    return system("which fs_usage > /dev/null 2>&1") == 0;
#else
    return false;
#endif
}

TEST(FsUsageParserLite, ParseOptionsValidation) {
    FsUsageParserLite parser;

    // Missing required args -> should print usage and return false
    const char *argv1[] = {"tracer_lite", "--prestart"};
    EXPECT_FALSE(parser.run_and_capture(2, (char **)argv1));

    // Unknown flag -> false
    const char *argv2[] = {"tracer_lite", "--unknown", "/tmp/out.txt", "/bin/echo", "ok"};
    EXPECT_FALSE(parser.run_and_capture(5, (char **)argv2));
}

TEST(FsUsageParserLite, Helper_ExtractPidFromProcessToken) {
    // token forms like: "Code Helper (Plugin).1415538"
    EXPECT_EQ(FsUsageParserLite::extract_pid_from_process_token("proc.1234"), 1234);
    EXPECT_EQ(FsUsageParserLite::extract_pid_from_process_token("foo.bar"), -1);
    EXPECT_EQ(FsUsageParserLite::extract_pid_from_process_token(".999"), -1);
    EXPECT_EQ(FsUsageParserLite::extract_pid_from_process_token("no_pid"), -1);
}

TEST(FsUsageParserLite, Helper_ExtractProcessColumn) {
    // A representative fs_usage line: columns separated by at least two spaces.
    std::string line =
        "17:43:09.341576  lstat64                                /some/path                          0.000005   Code Helper (Plugin).1415537";

    std::string col = FsUsageParserLite::extract_process_column(line);
    EXPECT_EQ(col, "Code Helper (Plugin).1415537");

    // Single token at end
    std::string line2 = "x y z Single.42";
    EXPECT_EQ(FsUsageParserLite::extract_process_column(line2), "Single.42");
}

TEST(FsUsageParserLite, Helper_ExtractProcessName) {
    EXPECT_EQ(FsUsageParserLite::extract_process_name("MyApp.123"), "MyApp");
    EXPECT_EQ(FsUsageParserLite::extract_process_name("MyApp"), "MyApp");
    EXPECT_EQ(FsUsageParserLite::extract_process_name(".123"), ".123");
}

TEST(FsUsageParserLite, Helper_StripWaitPrefix) {
    // Format like: "123.4 W MyApp.999"
    EXPECT_EQ(FsUsageParserLite::strip_wait_prefix("123.4 W MyApp.999"), "MyApp.999");
    // Non-number prefix should be retained
    EXPECT_EQ(FsUsageParserLite::strip_wait_prefix("abc W MyApp.1"), "abc W MyApp.1");
}

TEST(FsUsageParserLite, Helper_ProcessNameMatches) {
    EXPECT_TRUE(FsUsageParserLite::process_name_matches("MyApp", "MyApp"));
    EXPECT_TRUE(FsUsageParserLite::process_name_matches("MyAppHelper", "MyApp"));
    EXPECT_TRUE(FsUsageParserLite::process_name_matches("MyApp", "MyAppHelper"));
    EXPECT_FALSE(FsUsageParserLite::process_name_matches("", "MyApp"));
    EXPECT_FALSE(FsUsageParserLite::process_name_matches("Other", "MyApp"));
}

TEST(FsUsageParserLite, FilterByProcess_MatchesNameAndThreadIds) {
    FsUsageParserLite parser;
    parser.debug = true;

    // Build a small synthetic fs_usage raw file containing lines for various processes.
    std::filesystem::path tmpdir = std::filesystem::temp_directory_path();
    std::filesystem::path in = tmpdir / "fsu_raw.txt";
    std::filesystem::path out = tmpdir / "fsu_out.txt";

    // Two name matches for MyApp, second one introduces a thread id 4242.
    // Later a line with only the id should also be accepted.
    std::vector<std::string> lines = {
        "ts1  op1   /a/b  0.1   Other.111",
        "ts2  op2   /a/c  0.1   MyApp.4242",
        "ts3  op3   /a/d  0.1   MyApp", // matches by name, no id
        "ts4  op3   /a/e  0.1   Foo.999",
        "ts5  op3   /a/f  0.1   12.3 W MyApp.4242", // wait prefix should be stripped
        "ts6  op3   /a/g  0.1   Bar.4242" // id-only match via cached thread id
    };

    {
        std::ofstream ofs(in);
        for (auto &l : lines)
            ofs << l << "\n";
    }

    int total = 0, kept = 0;
    bool ok = parser.filter_output_by_process(in.string(), out.string(), "MyApp", 4242, total, kept);
    ASSERT_TRUE(ok);

    std::vector<std::string> kept_lines;
    {
        std::ifstream ifs(out);
        std::string l;
        while (std::getline(ifs, l))
            kept_lines.push_back(l);
    }

    // Expected: lines 2,3,5,6 are kept (4 lines)
    EXPECT_EQ(total, static_cast<int>(lines.size()));
    EXPECT_EQ(kept, 4);
    ASSERT_EQ(kept_lines.size(), 4u);
    EXPECT_EQ(kept_lines[0], lines[1]);
    EXPECT_EQ(kept_lines[1], lines[2]);
    EXPECT_EQ(kept_lines[2], lines[4]);
    EXPECT_EQ(kept_lines[3], lines[5]);
}

TEST(FsUsageParserLite, EndToEnd_RunAndCapture_Echo) {
#ifndef __APPLE__
    GTEST_SKIP() << "fs_usage only available on macOS";
#endif
    if (!has_fs_usage()) {
        GTEST_SKIP() << "fs_usage not available in PATH";
    }

    FsUsageParserLite parser;
    parser.debug = true;

    std::filesystem::path tmpdir = std::filesystem::temp_directory_path();
    std::filesystem::path out = tmpdir / "fsu_capture.txt";

    // Run a trivial program that should exit quickly and produce no filesys lines for MyApp
    std::string outPath = out.string();
    const char *argv[] = {"tracer_lite", outPath.c_str(), "/bin/echo", "hello", nullptr};

    bool ok = parser.run_and_capture(4, (char **)argv);
    EXPECT_TRUE(ok);

    // File should exist (possibly empty after filter)
    EXPECT_TRUE(std::filesystem::exists(out));
}
