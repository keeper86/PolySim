# PolySim Benchmarks – Overhead vs. Wall-Time

This document describes how scaling of overheads relative to wall-time is analyzed and visualized. Goal: Post-processing should scale approximately as 1/x with runtime; tracing depends heavily on I/O and metadata intensity (with fixed I/O volume, also approximately 1/x).

## Overview
- Data source: Polytrace benchmark measurements in CSV format.
- Preparation: Extraction into a compact CSV for plots.
- Visualization: Log–Log scatter plots including 1/x reference and fits per category.
- Frontend display: The /benchmarks page renders the newly generated plots.

## Requirements
- Python 3.
- Python packages: matplotlib, numpy (install if needed):

```bash
python3 -m pip install matplotlib numpy
```

## File Paths
- Input (Benchmark results): tools/polytrace/test/benchmarks/results.csv
- Derived input for plots: tools/polytrace/test/benchmarks/runtime_overhead.csv
- Output (Plots for web): public/benchmarks/*.png

## CSV Formats
- results.csv (from benchmarks):
  - Columns: `run_id, wall_ms_traced, traced_ms, postproc_ms, wall_ms_untraced`
- runtime_overhead.csv (for plots, generated):
  - Columns: `runtime_ms, postproc_pct, tracing_pct, writing_level, benchmark_id`
  - Definitions:
    - `runtime_ms`: untraced runtime in ms (x-axis)
    - `postproc_pct`: (postproc_ms / wall_ms_untraced) * 100
    - `tracing_pct`: ((wall_ms_traced - wall_ms_untraced) / wall_ms_untraced) * 100
    - `writing_level`: heuristic for I/O intensity: "little" or "much"

## Steps: Run, Extract, Plot
1) Run benchmarks (creates results.csv):

```bash
cd tools/polytrace/test/benchmarks
./run_bench.sh
```

**Note: The benchmarks may take a while ("long" CPU times for better estimation)**

2) Extract compact CSV and scaling check:

```bash
python3 tools/polytrace/test/benchmarks/extract_runtime_overhead.py
```

Result: tools/polytrace/test/benchmarks/runtime_overhead.csv is generated and a brief 1/x analysis (product check) is printed to the console.

3) Generate plots:

```bash
python3 tools/polytrace/test/benchmarks/plot_benchmarks.py
```

Result (in public/benchmarks/):
- scaling_postproc_vs_runtime.png – Post-processing vs. runtime, log–log, fit slope and 1/x reference
- scaling_tracing_vs_runtime.png – Tracing vs. runtime, log–log, colored by writing level with fit slopes and 1/x reference
- benchmark_runtime_overhead.png – Legacy/PoC variant as supplementary

The /benchmarks page displays both scaling plots.

## Plot Interpretation
- 1/x expectation: In log–log representation, 1/x corresponds to a slope of approximately −1.
- Product check: For perfect 1/x, `runtime_ms × overhead%` remains constant. Large deviations indicate non-1/x behavior.
- Post-processing: Expected near 1/x (predominantly fixed proportion relative to wall-time).
- Tracing:
  - "little" writing: may be closer to 1/x if the number of syscalls is fixed.
  - "much" writing: often deviates if I/O volume scales with runtime or many metadata operations occur.

## Heuristic: Writing Level
The classification in tools/extract_runtime_overhead.py is based on benchmark ID:
- much: 02_io_heavy, 03_many_small_files, 04_write_then_read
- little: 01_long_run, 05_mixed_phases (and other unrecognized IDs)

## Tips
- New measurements: Re-run scripts 1) and 2); the /benchmarks page accesses the PNGs in public/benchmarks/.
- Optional: Create a Make or NPM task that runs both steps sequentially.