# Simple Makefile for polysim_ctrace PoC

CXX ?= g++
CXXFLAGS ?= -std=c++17 -O2 -pthread
LDFLAGS ?= -lcrypto
SRC = polysim_ctrace.cpp miniz.c
OUT = polysim_ctrace

.PHONY: all clean
all: $(OUT)

$(OUT): $(SRC)
	$(CXX) $(CXXFLAGS) $(SRC) -o $(OUT) $(LDFLAGS)

clean:
	rm -f $(OUT) *.o

test: all
	@echo "Running simple test..."
	@cd tests && bash run_test.sh
	@echo "Running performance impact tests..."
	@cd tests/performance_impact && bash run_perf.sh

# ---- CMake and tooling targets ----
.PHONY: cmake-config build-cmake format format-check tidy cppcheck

cmake-config:
	mkdir -p build && cmake -S . -B build -DCMAKE_EXPORT_COMPILE_COMMANDS=ON

build-cmake: cmake-config
	cmake --build build --config Release

format:
	# format source files in place
	find . -maxdepth 2 -type f \( -name '*.cpp' -o -name '*.c' -o -name '*.h' -o -name '*.hpp' \) -print0 \
		| xargs -0 -r clang-format -i || true

format-check:
	# run clang-format in check mode; exits non-zero if formatting needed
	find . -maxdepth 2 -type f \( -name '*.cpp' -o -name '*.c' -o -name '*.h' -o -name '*.hpp' \) -print0 \
		| xargs -0 -r clang-format -n --Werror

tidy:
	# run clang-tidy on main sources (requires build/compile_commands.json)
	if [ -d build ]; then \
		clang-tidy -p build polysim_ctrace.cpp || true; \
	else \
		echo "Run 'make cmake-config' first to generate compile_commands.json"; exit 1; \
	fi

cppcheck:
	cppcheck --enable=all --inline-suppr --std=c++17 --force . || true
