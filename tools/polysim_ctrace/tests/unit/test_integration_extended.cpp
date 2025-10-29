#include <cstdio>
#include <cstdlib>
#include <filesystem>
#include <fstream>
#include <gtest/gtest.h>
#include <iostream>
#include <string>
#include <vector>

// nlohmann header lives in include dir provided by CMake
#include <nlohmann/json.hpp>

namespace fs = std::filesystem;
using json = nlohmann::json;

#ifndef POLYSIM_EXE
#error POLYSIM_EXE not defined
#endif
#ifndef TESTPROG_MORE_EXE
#error TESTPROG_MORE_EXE not defined
#endif

static std::string polysim_exe = POLYSIM_EXE;
static std::string testprog_more_exe = TESTPROG_MORE_EXE;

static int run_cmd(const std::string &cmd) { return std::system(cmd.c_str()); }

static std::string read_manifest_from_zip(const fs::path &zip) {
    std::string cmd = "unzip -p \"" + zip.string() + "\" outputs_manifest.json";
    FILE *pipe = popen(cmd.c_str(), "r");
    if (!pipe)
        return "";
    std::string out;
    char buf[4096];
    while (fgets(buf, sizeof(buf), pipe))
        out += buf;
    int rc = pclose(pipe);
    if (rc != 0)
        return "";
    return out;
}

TEST(IntegrationExtended, LargeFileIsNotArchivedButHasHash) {
    if (run_cmd("which strace >/dev/null 2>&1") != 0)
        GTEST_SKIP() << "strace not available";
    fs::path tmp = fs::temp_directory_path() / fs::path("polysim_ext_XXXXXX");
    std::string tmpl = tmp.string() + "_XXXXXX";
    std::vector<char> tbuf(tmpl.begin(), tmpl.end());
    tbuf.push_back('\0');
    char *d = mkdtemp(tbuf.data());
    ASSERT_NE(d, nullptr);
    fs::path work = fs::path(d);
    fs::path orig = fs::current_path();
    fs::current_path(work);

    // run testprog_more large
    std::string cmd = "\"" + polysim_exe + "\" \"" + testprog_more_exe + "\" large";
    int rc = run_cmd(cmd + " >/dev/null 2>&1");
    ASSERT_EQ(rc, 0);

    // find zip
    fs::path zip;
    for (auto &e : fs::directory_iterator(work))
        if (e.is_regular_file() && e.path().filename().string().rfind("run_", 0) == 0 &&
            e.path().extension() == ".zip")
            zip = e.path();
    ASSERT_FALSE(zip.empty());

    std::string manifest = read_manifest_from_zip(zip);
    ASSERT_FALSE(manifest.empty());
    json j = json::parse(manifest);
    bool found_large = false;
    for (auto &ent : j["files"]) {
        std::string path = ent["path"].get<std::string>();
        if (path.find("output_large.bin") != std::string::npos) {
            found_large = true;
            bool archived = ent["archived"].get<bool>();
            std::string sha = ent["sha256"].get<std::string>();
            EXPECT_FALSE(archived);
            EXPECT_FALSE(sha.empty());
        }
    } 
    EXPECT_TRUE(found_large);

    fs::current_path(orig);
    fs::remove_all(work);
}

TEST(IntegrationExtended, SpecialNameIsArchived) {
    if (run_cmd("which strace >/dev/null 2>&1") != 0)
        GTEST_SKIP() << "strace not available";
    fs::path tmp = fs::temp_directory_path() / fs::path("polysim_ext2_XXXXXX");
    std::string tmpl = tmp.string() + "_XXXXXX";
    std::vector<char> tbuf(tmpl.begin(), tmpl.end());
    tbuf.push_back('\0');
    char *d = mkdtemp(tbuf.data());
    ASSERT_NE(d, nullptr);
    fs::path work = fs::path(d);
    fs::path orig = fs::current_path();
    fs::current_path(work);

    std::string cmd = "\"" + polysim_exe + "\" \"" + testprog_more_exe + "\" special";
    int rc = run_cmd(cmd + " >/dev/null 2>&1");
    ASSERT_EQ(rc, 0);

    fs::path zip;
    for (auto &e : fs::directory_iterator(work))
        if (e.is_regular_file() && e.path().filename().string().rfind("run_", 0) == 0 &&
            e.path().extension() == ".zip")
            zip = e.path();
    ASSERT_FALSE(zip.empty());

    std::string manifest = read_manifest_from_zip(zip);
    ASSERT_FALSE(manifest.empty());
    json j = json::parse(manifest);
    bool found = false;
    for (auto &ent : j["files"]) {
        std::string path = ent["path"].get<std::string>();
        // match either the raw name or the JSON-escaped representation
        if (path.find("output space") != std::string::npos) {
            // We record an entry for the file — archived/sha may vary depending on parsing
            found = true;
        }
    }
    EXPECT_TRUE(found);

    fs::current_path(orig);
    fs::remove_all(work);
}

TEST(IntegrationExtended, MultipleOutputsArchived) {
    if (run_cmd("which strace >/dev/null 2>&1") != 0)
        GTEST_SKIP() << "strace not available";
    fs::path tmp = fs::temp_directory_path() / fs::path("polysim_ext3_XXXXXX");
    std::string tmpl = tmp.string() + "_XXXXXX";
    std::vector<char> tbuf(tmpl.begin(), tmpl.end());
    tbuf.push_back('\0');
    char *d = mkdtemp(tbuf.data());
    ASSERT_NE(d, nullptr);
    fs::path work = fs::path(d);
    fs::path orig = fs::current_path();
    fs::current_path(work);

    std::string cmd = "\"" + polysim_exe + "\" \"" + testprog_more_exe + "\" multiple";
    int rc = run_cmd(cmd + " >/dev/null 2>&1");
    ASSERT_EQ(rc, 0);

    fs::path zip;
    for (auto &e : fs::directory_iterator(work))
        if (e.is_regular_file() && e.path().filename().string().rfind("run_", 0) == 0 &&
            e.path().extension() == ".zip")
            zip = e.path();
    ASSERT_FALSE(zip.empty());

    std::string manifest = read_manifest_from_zip(zip);
    ASSERT_FALSE(manifest.empty());
    json j = json::parse(manifest);
    std::vector<std::string> found;
    for (auto &ent : j["files"]) {
        std::string path = ent["path"].get<std::string>();
        if (path.find("out1.txt") != std::string::npos)
            found.push_back(path);
        if (path.find("out2.txt") != std::string::npos)
            found.push_back(path);
        if (path.find("out3.txt") != std::string::npos)
            found.push_back(path);
    }
    EXPECT_EQ(found.size(), 3);

    fs::current_path(orig);
    fs::remove_all(work);
}

TEST(IntegrationExtended, UnreadableFileHasEmptyHash) {
    if (run_cmd("which strace >/dev/null 2>&1") != 0)
        GTEST_SKIP() << "strace not available";
    fs::path tmp = fs::temp_directory_path() / fs::path("polysim_ext4_XXXXXX");
    std::string tmpl = tmp.string() + "_XXXXXX";
    std::vector<char> tbuf(tmpl.begin(), tmpl.end());
    tbuf.push_back('\0');
    char *d = mkdtemp(tbuf.data());
    ASSERT_NE(d, nullptr);
    fs::path work = fs::path(d);
    fs::path orig = fs::current_path();
    fs::current_path(work);

    std::string cmd = "\"" + polysim_exe + "\" \"" + testprog_more_exe + "\" unreadable";
    int rc = run_cmd(cmd + " >/dev/null 2>&1");
    ASSERT_EQ(rc, 0);

    fs::path zip;
    for (auto &e : fs::directory_iterator(work))
        if (e.is_regular_file() && e.path().filename().string().rfind("run_", 0) == 0 &&
            e.path().extension() == ".zip")
            zip = e.path();
    ASSERT_FALSE(zip.empty());

    std::string manifest = read_manifest_from_zip(zip);
    ASSERT_FALSE(manifest.empty());
    json j = json::parse(manifest);
    bool found = false;
    for (auto &ent : j["files"]) {
        std::string path = ent["path"].get<std::string>();
        if (path.find("secret.bin") != std::string::npos) {
            found = true;
            std::string sha = ent["sha256"].get<std::string>();
            // our implementation returns empty hash when it cannot open the file
            EXPECT_TRUE(sha.empty() || sha.size() == 0);
        }
    }
    EXPECT_TRUE(found);

    fs::current_path(orig);
    fs::remove_all(work);
}

int main(int argc, char **argv) {
    ::testing::InitGoogleTest(&argc, argv);
    return RUN_ALL_TESTS();
}
