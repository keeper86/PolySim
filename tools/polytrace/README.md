
# polytrace 

CLI Tool for Tracing File Accesses via strace. Commands are assumed executed from the root of this README.md.

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


