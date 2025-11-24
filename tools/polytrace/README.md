
# polytrace 

CLI Tool for Tracing File Accesses via strace. Commands are assumed executed from the root of this README.md.

## Important
`polytrace` relies on `strace` which does not run natively on Windows and macOS devices. For development purposes, you can use a Docker container defined by the provided `Dockerfile`.
The performance impact of using containers has not yet been measured or reported.

### To Build and Run the Container
```sh
docker build -t polytrace-dev-env .
docker run --name polytrace-dev-env -it polytrace-dev-env
```
This gives the user command-line (shell) access to build, test and use the `polytrace` as described below. Default working directors is set to `/PolySim/tools/polytrace`.

## Overview

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

## Usage

To trace a program, use the `trace` binary followed by the command you want to trace. For example:

```sh
./build/bin/trace ./your_program
```

It produces a zipped trace file in the current directory.

To upload a trace file, use the `upload` binary (just for local tests yet):

```sh
./build/bin/upload path/to/trace.zip
```


