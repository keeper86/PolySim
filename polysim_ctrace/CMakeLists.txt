cmake_minimum_required(VERSION 3.14)
project(polysim_ctrace VERSION 0.1 LANGUAGES C CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_EXPORT_COMPILE_COMMANDS ON)

option(BUILD_TOOLS "Build extra helper tools" ON)

# Main executable
set(POLYSIM_SRCS polysim_ctrace.cpp)

# Prefer a local miniz.c/miniz.h if present in the source tree. Otherwise
# optionally fetch the single-file miniz implementation from upstream and
# place it into the build directory under third_party/miniz/. This keeps the
# repository small while still allowing an embedded miniz when desired.
# Fetch dependencies with pinned versions/tags using FetchContent.
# We fetch miniz and expose it as a small static library, then link it
# into the main executable. This project uses network fetches at configure
# time and pins tags for reproducible builds.
include(FetchContent)

# Which miniz tag/commit to fetch. Default to 'master' so configure will succeed
# in case a specific pinned tag isn't available in the environment. For
# reproducible builds, override this on the cmake command line:
#   -D MINIZ_GIT_TAG=<tag-or-commit>
set(MINIZ_GIT_TAG "master" CACHE STRING "miniz git tag or commit to fetch (pin to specific tag/commit for reproducible builds)")

FetchContent_Declare(
    miniz
    GIT_REPOSITORY https://github.com/richgel999/miniz.git
    GIT_TAG ${MINIZ_GIT_TAG}
)
FetchContent_MakeAvailable(miniz)

# The fetched miniz project defines a target named `miniz` and configures
# its build (including generating miniz_export.h). Link against that
# target so we inherit its include directories and compile settings.

add_executable(polysim_ctrace ${POLYSIM_SRCS})
target_compile_options(polysim_ctrace PRIVATE -Wall -Wextra -Wpedantic)
find_package(OpenSSL REQUIRED)
target_link_libraries(polysim_ctrace PRIVATE OpenSSL::Crypto miniz)

if(BUILD_TOOLS)
    add_executable(generate_report tests/performance_impact/generate_report.cpp)
    target_compile_options(generate_report PRIVATE -Wall -Wextra -Wpedantic)
endif()

enable_testing()

# --- Test program used by unit tests ---
add_executable(testprog tests/simple/testprog.cpp)
target_compile_options(testprog PRIVATE -Wall -Wextra -Wpedantic)

# Additional helper program for extended integration tests
add_executable(testprog_more tests/simple/testprog_more.cpp)
target_compile_options(testprog_more PRIVATE -Wall -Wextra -Wpedantic)

# --- GoogleTest integration (FetchContent) ---
FetchContent_Declare(
    googletest
    GIT_REPOSITORY https://github.com/google/googletest.git
    GIT_TAG v1.14.0
)
FetchContent_MakeAvailable(googletest)

add_executable(test_integration tests/unit/test_integration.cpp)
target_compile_options(test_integration PRIVATE -Wall -Wextra -Wpedantic)
target_link_libraries(test_integration PRIVATE gtest_main)

# Provide executable paths to the test binary via compile definitions
target_compile_definitions(test_integration PRIVATE
        POLYSIM_EXE="$<TARGET_FILE:polysim_ctrace>"
        TESTPROG_EXE="$<TARGET_FILE:testprog>"
)

add_test(NAME integration_test COMMAND test_integration)

# Add extended integration tests
add_executable(test_integration_extended tests/unit/test_integration_extended.cpp)
target_compile_options(test_integration_extended PRIVATE -Wall -Wextra -Wpedantic)
target_link_libraries(test_integration_extended PRIVATE gtest_main)
target_compile_definitions(test_integration_extended PRIVATE
        POLYSIM_EXE="$<TARGET_FILE:polysim_ctrace>"
        TESTPROG_MORE_EXE="$<TARGET_FILE:testprog_more>"
)
add_test(NAME integration_extended_test COMMAND test_integration_extended)

# Fetch nlohmann/json for manifest parsing in tests
FetchContent_Declare(
    nlohmann_json
    GIT_REPOSITORY https://github.com/nlohmann/json.git
    GIT_TAG v3.11.2
)
FetchContent_MakeAvailable(nlohmann_json)
target_include_directories(test_integration_extended PRIVATE ${nlohmann_json_SOURCE_DIR}/include)
target_include_directories(test_integration PRIVATE ${nlohmann_json_SOURCE_DIR}/include)
