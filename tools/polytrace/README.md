
# polytrace 

CLI Tool for Tracing File Accesses via strace. Commands are assumed executed from the root of this README.md.

## 1. Important
PLEASE NOTE: For systems running Linux or Windows Subsystem for Linux (WSL), the following steps, steps 2.a and 2.b maybe skipped.
`polytrace` relies on `strace`, that is built-in with linux but does not run natively on Windows and macOS devices. For development purposes, you can use a Docker container defined by the provided `Dockerfile`. 
The performance impact of using containers has not yet been measured or reported.

### 2.a To Build the Container
```sh
docker build -t polytrace-dev-env .
docker run --name polytrace-dev-env -it polytrace-dev-env
```

### 2.b To Run the Container
```sh
docker start polytrace-dev-env
docker exec -it polytrace-dev-env bash
```
This gives the user command-line (shell) access to build, test and use the `polytrace` as described below. Default working directory is set to `/PolySim/tools/polytrace`.

## 3. Overview

This tool uses make to configure, build, and run tests. We use clang-format for code formatting and clang-tidy for linting.

```sh
make configure
make format
make build
make lint
make test
```

The command build will create two binaries in `/build/bin/`:
- `trace`: The main tracing tool.
- `upload`: Tool to upload trace results to our server.

## Prerequisites

Install required packages for building on Debian/Ubuntu:

```bash
sudo apt-get update
sudo apt-get install -y build-essential cmake libssl-dev strace clang-tidy
```

On Fedora/RHEL:

```bash
sudo dnf install -y gcc-c++ make cmake openssl-devel strace clang-tools-extra
```

- `build-essential`/`gcc-c++`: Provides C/C++ compilers and `make`.
- `cmake`: Generates build files.
- `libssl-dev`/`openssl-devel`: OpenSSL headers required by the SHA256 implementation.
- `strace`: Runtime dependency for tracing.
- `clang-tidy`: Optional static analysis; build will warn if missing.

### Common Build Issues

- `fatal error: openssl/types.h: No such file or directory` → Install `libssl-dev` (Debian/Ubuntu) or `openssl-devel` (Fedora/RHEL).
- `No CMAKE_CXX_COMPILER could be found` → Install `build-essential` (Debian/Ubuntu) or `gcc-c++` (Fedora/RHEL).

## 4. Usage

To trace a program, use the `trace` binary followed by the command you want to trace. For example:

```sh
./build/bin/trace ./your_program
```

It produces a zipped trace file in the current directory.

To upload a trace file, use the `upload` binary (just for local tests yet). The uploader accepts either a `.zip` produced by `trace` (containing `prov_upload_input.json`) or a standalone `.json` file with the same payload shape. Inline JSON via command line arguments is not supported:

```sh
# Upload a zip created by the trace tool
./build/bin/upload path/to/trace.zip

# Or upload a JSON file directly
./build/bin/upload path/to/prov_upload_input.json
```


