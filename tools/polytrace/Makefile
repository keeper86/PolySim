## Makefile for building and testing the polytrace CMake project
# Usage:
#   make -C tools/polytrace configure
#   make -C tools/polytrace build
#   make -C tools/polytrace test
#   make -C tools/polytrace clean

.PHONY: all configure format build test clean rebuild lint lint-fix

BUILD_DIR := $(CURDIR)/build

all: configure build

configure:
	@echo "Configuring polytrace (build dir: $(BUILD_DIR))"
	@mkdir -p $(BUILD_DIR)
	@cd $(BUILD_DIR) && cmake ..

format-check: configure
	@echo "Running format (clang-format) via CMake target"
	@cmake --build $(BUILD_DIR) --target format --parallel	

format: configure
	@echo "Running format-fix (clang-format -i) via CMake target"
	@cmake --build $(BUILD_DIR) --target format-fix --parallel

build: configure
	@echo "Building polytrace"
	@cmake --build $(BUILD_DIR) --parallel

test: build
	@echo "Running tests (ctest)"
	@cd $(BUILD_DIR) && ctest --output-on-failure

lint-check: build
	@echo "Running lint (clang-tidy) via CMake target"
	@cmake --build $(BUILD_DIR) --target lint --parallel

lint: build
	@echo "Running lint-fix (clang-tidy -fix) via CMake target"
	@cmake --build $(BUILD_DIR) --target lint-fix --parallel

clean:
	@echo "Cleaning build dir"
	@rm -rf $(BUILD_DIR)

rebuild: clean all
