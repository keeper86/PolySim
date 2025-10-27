#include <chrono>
#include <cstdlib>
#include <filesystem>
#include <fstream>
#include <gtest/gtest.h>
#include <iostream>
#include <string>
#include <thread>

namespace fs = std::filesystem;

#ifndef POLYSIM_EXE
#error POLYSIM_EXE not defined
#endif
#ifndef TESTPROG_EXE
#error TESTPROG_EXE not defined
#endif

static std::string polysim_exe = POLYSIM_EXE;
static std::string testprog_exe = TESTPROG_EXE;

// Helper: run a command and return exit code
static int run_cmd(const std::string &cmd) { return std::system(cmd.c_str()); }

TEST(Integration, WrapperArchivesOutputAndManifest) {
    // Skip test if strace not available
    if (run_cmd("which strace >/dev/null 2>&1") != 0) {
        GTEST_SKIP() << "strace not available in environment";
    }

    // Ensure executables exist
    ASSERT_TRUE(fs::exists(polysim_exe));
    ASSERT_TRUE(fs::exists(testprog_exe));

    // Create temporary working directory for the run
    fs::path tmp = fs::temp_directory_path() / fs::path("polysim_ctest_XXXXXX");
    // mkdtemp style unique path
    std::string tmp_template = tmp.string();
    tmp_template += "_XXXXXX";
    std::vector<char> tmpl(tmp_template.begin(), tmp_template.end());
    tmpl.push_back('\0');
    char *p = mkdtemp(tmpl.data());
    ASSERT_NE(p, nullptr);
    fs::path workdir = fs::path(p);

    // Prepare input file
    std::ofstream in((workdir / "input.txt").string());
    in << "hello" << std::endl;
    in.close();

    // Change cwd to workdir for the duration of the test
    fs::path orig = fs::current_path();
    fs::current_path(workdir);

    // Run the wrapper: polysim_exe testprog_exe
    std::string cmd = "\"" + polysim_exe + "\" \"" + testprog_exe + "\"";
    int rc = run_cmd(cmd + " 2>&1 >/dev/null");
    // allow non-zero only if something went seriously wrong
    ASSERT_EQ(rc, 0) << "polysim_ctrace failed with rc=" << rc;

    // Find newest run_*.zip in workdir
    fs::path newest;
    fs::file_time_type newest_time;
    for (auto &ent : fs::directory_iterator(workdir)) {
        if (!ent.is_regular_file())
            continue;
        std::string name = ent.path().filename().string();
        if (name.rfind("run_", 0) == 0 && name.find(".zip") != std::string::npos) {
            auto t = fs::last_write_time(ent.path());
            if (newest.empty() || t > newest_time) {
                newest = ent.path();
                newest_time = t;
            }
        }
    }
    ASSERT_FALSE(newest.empty()) << "No run_*.zip found in " << workdir;

    // Check that output.txt is in the zip via unzip -l
    std::string list_cmd = "unzip -l \"" + newest.string() + "\" | grep -q output.txt";
    int found = run_cmd(list_cmd);
    ASSERT_EQ(found, 0) << "output.txt not found inside " << newest;

    // Extract outputs_manifest.json and assert it contains output.txt and a sha256 field (simple
    // check)
    std::string extract_cmd = "unzip -p \"" + newest.string() + "\" outputs_manifest.json";
    FILE *pipe = popen(extract_cmd.c_str(), "r");
    ASSERT_NE(pipe, nullptr);
    std::string manifest;
    char buf[4096];
    while (fgets(buf, sizeof(buf), pipe)) {
        manifest += buf;
    }
    int pclose_rc = pclose(pipe);
    ASSERT_EQ(pclose_rc, 0) << "Failed to extract outputs_manifest.json from " << newest;

    // basic content assertions
    ASSERT_NE(manifest.find("output.txt"), std::string::npos);
    ASSERT_NE(manifest.find("sha256"), std::string::npos);

    // cleanup
    fs::current_path(orig);
    fs::remove_all(workdir);
}

int main(int argc, char **argv) {
    ::testing::InitGoogleTest(&argc, argv);
    return RUN_ALL_TESTS();
}
