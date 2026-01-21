cmake_minimum_required(VERSION 3.16)
project(polytrace VERSION 0.1.0 LANGUAGES C CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

include(GNUInstallDirs)

find_package(OpenSSL REQUIRED)
find_package(Threads REQUIRED)

# Project directories (relative to this CMakeLists.txt)
set(PROJECT_INCLUDE_DIR ${CMAKE_CURRENT_SOURCE_DIR}/include)
set(PROJECT_SRC_DIR ${CMAKE_CURRENT_SOURCE_DIR}/src)

# Prefer CMake's FetchContent to retrieve vendor dependencies in a reproducible way
include(FetchContent)

# Default pinned versions (changeable via -D on the cmake command line)
set(NLOHMANN_JSON_GIT_TAG "v3.11.3" CACHE STRING "Pinned git tag for nlohmann/json")
set(CPP_HTTPLIB_GIT_TAG "v0.10.8" CACHE STRING "Pinned git tag for yhirose/cpp-httplib")
set(MINIZ_GIT_TAG "master" CACHE STRING "Pinned git tag or branch for richgel999/miniz (override to a release tag for reproducible builds)")
set(GOOGLETEST_GIT_TAG "v1.15.0" CACHE STRING "Pinned git tag for google/googletest")

# nlohmann/json (header-only)
FetchContent_Declare(
  nlohmann_json
  GIT_REPOSITORY https://github.com/nlohmann/json.git
  GIT_TAG        ${NLOHMANN_JSON_GIT_TAG}
)

# cpp-httplib (single-header)
FetchContent_Declare(
  cpp_httplib
  GIT_REPOSITORY https://github.com/yhirose/cpp-httplib.git
  GIT_TAG        ${CPP_HTTPLIB_GIT_TAG}
)

# miniz (miniz.c / miniz.h)
FetchContent_Declare(
  miniz
  GIT_REPOSITORY https://github.com/richgel999/miniz.git
  GIT_TAG        ${MINIZ_GIT_TAG}
)

# googletest (only needed for tests, but fetch it so includes are available)
FetchContent_Declare(
  googletest
  GIT_REPOSITORY https://github.com/google/googletest.git
  GIT_TAG        ${GOOGLETEST_GIT_TAG}
)

# PEGTL (taocpp/PEGTL) for grammar-based parsing
set(PEPTL_GIT_TAG "3.2.8" CACHE STRING "Pinned git tag for taocpp/PEGTL (use a tag for reproducible builds)")
FetchContent_Declare(
  pegtl
  GIT_REPOSITORY https://github.com/taocpp/PEGTL.git
  GIT_TAG        ${PEPTL_GIT_TAG}
)

FetchContent_MakeAvailable(nlohmann_json cpp_httplib miniz googletest pegtl)

# Expose convenient include paths (do not copy files; use upstream layout)
set(NLOHMANN_INCLUDE_DIR ${nlohmann_json_SOURCE_DIR}/single_include)
set(HTTPLIB_INCLUDE_DIR ${cpp_httplib_SOURCE_DIR})
set(MINIZ_SOURCE_DIR ${miniz_SOURCE_DIR})
set(MINIZ_BINARY_DIR ${miniz_BINARY_DIR})


if(NOT EXISTS ${PROJECT_SRC_DIR})
  message(FATAL_ERROR "Expected source directory: ${PROJECT_SRC_DIR} (create src/upload.cpp or update paths)")
endif()

file(GLOB_RECURSE POLYTRACE_SOURCES
  "${PROJECT_SRC_DIR}/*.c"
  "${PROJECT_SRC_DIR}/*.cpp"
  "${PROJECT_SRC_DIR}/*.cc"
  "${PROJECT_SRC_DIR}/*.cxx"
  "${PROJECT_INCLUDE_DIR}/*.h"
  "${PROJECT_INCLUDE_DIR}/*.hpp"
)

add_executable(upload ${PROJECT_SRC_DIR}/upload.cpp )
add_executable(trace ${PROJECT_SRC_DIR}/trace.cpp )

option(POLYTRACE_ENABLE_SSL "Enable SSL for polytrace tools" ON)

if(POLYTRACE_ENABLE_SSL)
  target_compile_definitions(upload PRIVATE CPPHTTPLIB_OPENSSL_SUPPORT) 
endif()

# Place main runtime binaries (upload, trace) into a dedicated bin directory
# so only those two end up in bin/ while tests are placed elsewhere.
set(MAIN_RUNTIME_DIR ${CMAKE_BINARY_DIR}/bin CACHE PATH "Directory for main runtime binaries")
set_target_properties(upload PROPERTIES
  RUNTIME_OUTPUT_DIRECTORY ${MAIN_RUNTIME_DIR}
)

set_target_properties(trace PROPERTIES
  RUNTIME_OUTPUT_DIRECTORY ${MAIN_RUNTIME_DIR}
)

enable_testing()

target_include_directories(upload PRIVATE 
  ${PROJECT_INCLUDE_DIR}
  ${NLOHMANN_INCLUDE_DIR}
  ${HTTPLIB_INCLUDE_DIR}
  ${MINIZ_SOURCE_DIR}
  ${MINIZ_BINARY_DIR}
)

target_link_libraries(upload PRIVATE
  OpenSSL::SSL
  OpenSSL::Crypto
  Threads::Threads
  miniz
)

target_include_directories(trace PRIVATE 
  ${PROJECT_INCLUDE_DIR}
  ${NLOHMANN_INCLUDE_DIR}
  ${HTTPLIB_INCLUDE_DIR}
  ${MINIZ_SOURCE_DIR}
  ${MINIZ_BINARY_DIR}
  ${pegtl_SOURCE_DIR}/include
)

target_link_libraries(trace PRIVATE
  OpenSSL::SSL
  OpenSSL::Crypto
  Threads::Threads
  miniz
)

# End-to-end test that uses real strace (skips at runtime if strace not available)
add_executable(strace_parser_test ${CMAKE_CURRENT_SOURCE_DIR}/test/strace_parser.test.cpp)
target_include_directories(strace_parser_test PRIVATE 
  ${PROJECT_INCLUDE_DIR}
  ${NLOHMANN_INCLUDE_DIR}
  ${HTTPLIB_INCLUDE_DIR}
  ${MINIZ_SOURCE_DIR}
  ${MINIZ_BINARY_DIR}
  ${pegtl_SOURCE_DIR}/include
)

target_link_libraries(strace_parser_test PRIVATE
  gtest_main
  OpenSSL::SSL
  OpenSSL::Crypto
  Threads::Threads
  miniz
)


add_test(NAME strace_parser_test COMMAND $<TARGET_FILE:strace_parser_test>)

set(TEST_FIXTURES_DIR "${CMAKE_CURRENT_SOURCE_DIR}/test/fixtures" CACHE PATH "Directory containing test fixture scripts")
message(STATUS "Test fixtures dir: ${TEST_FIXTURES_DIR}")
target_compile_definitions(strace_parser_test PRIVATE TEST_FIXTURES_DIR=\"${TEST_FIXTURES_DIR}\")

if(NOT MSVC)
  target_compile_options(upload PRIVATE -Wall -Wextra -Wpedantic)
  target_compile_options(trace PRIVATE -Wall -Wextra -Wpedantic)
endif()

if(TARGET miniz)
  if(NOT MSVC)
    target_compile_options(miniz PRIVATE -w)
  else()
    target_compile_options(miniz PRIVATE /W0)
  endif()
endif()

install(TARGETS upload trace
  RUNTIME DESTINATION ${CMAKE_INSTALL_BINDIR}
)

find_program(CLANG_TIDY_EXE NAMES clang-tidy clang-tidy-16 clang-tidy-15)

  if(CLANG_TIDY_EXE)
    message(STATUS "Enabling clang-tidy: ${CLANG_TIDY_EXE}")
    set(CMAKE_EXPORT_COMPILE_COMMANDS ON CACHE BOOL "Export compile commands (compile_commands.json)" FORCE)
    set(CMAKE_CXX_CLANG_TIDY "${CLANG_TIDY_EXE}")
  else()
    message(WARNING "clang-tidy not found in PATH. Install clang-tidy or disable ENABLE_CLANG_TIDY.")
  endif()


find_program(CLANG_FORMAT_EXE NAMES clang-format clang-format-16 clang-format-15)
if(CLANG_FORMAT_EXE)
  add_custom_target(format
    COMMAND ${CLANG_FORMAT_EXE} -n --Werror src/*.cpp include/*.hpp
    WORKING_DIRECTORY ${CMAKE_CURRENT_SOURCE_DIR}
    COMMENT "Running clang-format over source files"
  )
  add_custom_target(format-fix
    COMMAND ${CLANG_FORMAT_EXE} -i src/*.cpp include/*.hpp
    WORKING_DIRECTORY ${CMAKE_CURRENT_SOURCE_DIR}
    COMMENT "Running clang-format over source files"
  )
else()
  message(WARNING "clang-format not found in PATH.")
endif()

if(CLANG_TIDY_EXE)
  add_custom_target(lint-fix
    COMMAND ${CLANG_TIDY_EXE} -p ${CMAKE_BINARY_DIR} -fix ${POLYTRACE_SOURCES}
    WORKING_DIRECTORY ${CMAKE_CURRENT_SOURCE_DIR}
    COMMENT "Running clang-tidy -fix over source files"
  )
endif()

if(CLANG_TIDY_EXE)
  add_custom_target(lint
    COMMAND ${CLANG_TIDY_EXE} -p ${CMAKE_BINARY_DIR} ${POLYTRACE_SOURCES}
    WORKING_DIRECTORY ${CMAKE_CURRENT_SOURCE_DIR}
    COMMENT "Running clang-tidy over source files (requires compile_commands.json)"
  )
endif()
