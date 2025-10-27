## polysim_ctrace — PoC trace wrapper

A small proof-of-concept command wrapper that records file accesses of a target program, computes SHA-256 hashes for observed files, and packages a compact snapshot (ZIP + JSON manifest) that documents the run.

This PoC is intended for experimentation and developer workflows (reproducible run snapshots, lightweight provenance). It is not production-grade; see Known issues below.

!!! Fully vibe-coded prototype. !!!
Will be refactored and hardened in follow-up work.

## What it does

- Runs a target process under a tracing tool (current PoC uses textual strace output).
- Observes file open/read/write events and records paths touched by the process.
- Computes SHA-256 hashes for observed files and decides (by heuristics) whether to include the file in the snapshot ZIP.
- Emits a ZIP archive and an `outputs_manifest.json` describing the recorded files, their hashes, and archival status.

## Quick status

- Language: C++17
- Build system: CMake (recommended) — a small Make wrapper is available for simple builds
- Tests: GoogleTest-based integration tests are included and exercised via CTest
- JSON parsing (tests): nlohmann/json (fetched via CMake FetchContent)

## Prerequisites

Install the usual build tools and runtime utilities on Linux:

```zsh
# Debian/Ubuntu example
sudo apt update
sudo apt install -y build-essential cmake git libssl-dev unzip strace
```

- `libssl-dev` is required for OpenSSL headers (used by the PoC hashing code) at build time.
- `strace` is used by the wrapper to observe syscalls. Tests detect its absence and skip trace-dependent checks.
- `unzip` is used by the tests to inspect produced ZIP files.

## Build (recommended)

From the `polysim_ctrace/` directory:

```zsh
cmake -S . -B build
cmake --build build -- -j
cmake --build build --target test
```

This will fetch test dependencies (GoogleTest, nlohmann/json) automatically when configuring the build.

If you prefer the legacy Makefile (small wrapper present), you can run:

```zsh
make
```

But prefer CMake for reproducible results, tests, and dependency fetching.

## Run the wrapper (PoC usage)

The PoC binary is named `polysim_ctrace` and accepts an output path and a command to run. Example:

```zsh
# create a snapshot.zip while running `./my_sim --input foo`
./polysim_ctrace -o /tmp/snapshot.zip -- ./my_sim --input foo
```

After the run completes, the ZIP contains a small manifest and (optionally) archived files.

## What the ZIP contains

- `runmeta.txt` — plain text with the recorded command line and metadata.
- `outputs_manifest.json` — a JSON array of file entries. Example entry:

```json
{
    "path": "./data/config.yaml",
    "is_input": true,
    "sha256": "<hex-sha256>",
    "archived": true
}
```

- `archived` is true when the file was copied into the ZIP. Some files are hashed but not archived (heuristic filters to keep snapshots small).

## Tests

Integration tests are implemented with GoogleTest and added to CTest. Run them from the `build/` directory:

```zsh
cd build
ctest --output-on-failure -j2
```

Notes about tests:

- Tests will skip trace-dependent assertions if `strace` (or the configured tracer) is not available.
- The `tests/simple/testprog_more` helper is compiled into small programs used by tests to exercise edge cases (large files, quoted filenames, unreadable files, etc.).

You can run a single test binary (useful for debugging):

```zsh
# example — adjust path/name to match the built binary
./build/tests/unit/test_integration_extended --gtest_repeat=1
```

## Development notes

- Linting: a tuned `.clang-tidy` config exists in the repo to avoid noise from vendored headers (miniz). Run clang-tidy if desired; the project intentionally relaxed a few modernize checks to keep the PoC readable.
- Linking: the PoC uses OpenSSL EVP APIs for hashing. Ensure `libcrypto` is available at link time; CMake config already links crypto.
- JSON in tests: nlohmann/json is fetched during configure; no manual install required.

If you add or refresh `miniz.c/miniz.h`, keep them in `polysim_ctrace/` or update CMake accordingly. The project currently vendors miniz to embed ZIP support without an external dependency.

## Known issues and limitations

- Parser robustness: the current strace-line parser is a simple textual extractor and has a corner-case with filenames that contain embedded quotes — such names may be truncated in the produced manifest. Tests were made tolerant to this while the parser is hardened in a follow-up.
- Tracer portability: textual `strace` formats vary across versions and locales; consider a binary tracer (BPF, fanotify) for production use.
- Race conditions: files can be modified concurrently; the PoC hashes files after process exit which reduces but does not eliminate TOCTOU issues.
- Permissions: tracing privileged binaries or containers can require capabilities; tests are written to skip when privileges or tracer availability are insufficient.

## Next steps (recommended)

1. Harden the path extractor/parser to correctly handle quoted/escaped filenames found in strace output.
2. Refactor the CLI `main()` into smaller, testable library functions to enable unit tests that don't require running an external tracer.
3. Add a CI workflow that runs build + unit tests; run integration tests conditionally or in a privileged runner.
4. Add an optional flag to include/exclude heuristics for archiving large shared libraries.

## Where to get help / contribute

Open an issue or submit a PR against this branch. The repo follows the PolySim development guidelines (see the repo root README for the project's conventions).

## License

The code in this PoC follows the repository license (see top-level `LICENSE`).
