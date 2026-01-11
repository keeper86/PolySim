#!/usr/bin/env python3
"""
Extract runtime overhead data from benchmark results for scaling analysis.

Reads tools/polytrace/test/benchmarks/results.csv and generates:
1. tools/polytrace/test/benchmarks/runtime_overhead.csv - formatted for plot_benchmarks.py
2. Console output with analysis of 1/x scaling behavior
"""

import csv
from pathlib import Path
from collections import defaultdict
import statistics


def parse_benchmark_id(run_id: str) -> str:
    """Extract benchmark id from run_id (run_<bench>_stepX_Y)."""
    # Expected format: run_<benchmark>_step<idx>_<count>
    if run_id.startswith('run_'):
        tail = run_id[len('run_'):]
    else:
        tail = run_id

    # Split before step marker
    head = tail.split('_step')[0]
    return head if head else 'unknown'


def classify_io_level(benchmark_id: str) -> str:
    """Classify benchmark by I/O intensity based on benchmark ID."""
    # Based on the benchmark descriptions:
    # - 01_long_run: moderate I/O (8 files, 131KB each)
    # - 02_io_heavy: heavy I/O (4 files, 100MB each) 
    # - 03_many_small_files: extreme metadata operations (1000+ files)
    # - 04_write_then_read: moderate I/O (16 files, 2MB each)
    # - 05_mixed_phases: mixed workload (8 files, 4MB each + CPU)
    
    heavy_io = {'02_io_heavy', '03_many_small_files', '04_write_then_read'}
    
    for bench_id in heavy_io:
        if bench_id in benchmark_id:
            return 'much'
    return 'little'


def main():
    script_dir = Path(__file__).parent
    
    # Input: benchmark results
    results_csv = script_dir / 'results.csv'
    
    if not results_csv.exists():
        print(f"Results file not found: {results_csv}")
        print("   Run benchmarks first: cd tools/polytrace/test/benchmarks && ./run_bench.sh")
        return 1
    
    # Output: runtime overhead CSV (kept alongside results for clarity)
    output_csv = script_dir / 'runtime_overhead.csv'
    
    # Parse results
    runs = []
    with results_csv.open('r') as f:
        reader = csv.DictReader(f)
        for row in reader:
            try:
                run_id = row['run_id']
                benchmark_id = parse_benchmark_id(run_id)
                wall_traced = float(row['wall_ms_traced'])
                traced_ms = float(row['traced_ms']) if row['traced_ms'] else 0
                postproc_ms = float(row['postproc_ms']) if row['postproc_ms'] else 0
                wall_untraced = float(row['wall_ms_untraced'])
                
                # Skip invalid runs
                if wall_untraced <= 0 or wall_traced <= 0:
                    continue
                
                # Calculate overhead percentages
                postproc_pct = (postproc_ms / wall_untraced) * 100 if postproc_ms > 0 else 0
                tracing_pct = ((wall_traced - wall_untraced) / wall_untraced) * 100
                
                io_level = classify_io_level(benchmark_id)
                
                runs.append({
                    'run_id': run_id,
                    'benchmark_id': benchmark_id,
                    'runtime_ms': wall_untraced,
                    'postproc_pct': postproc_pct,
                    'tracing_pct': tracing_pct,
                    'io_level': io_level
                })
            except (ValueError, KeyError) as e:
                print(f"Skipping invalid row: {row} ({e})")
                continue
    
    if not runs:
        print("No valid runs found in results.csv")
        return 1
    
    print(f"\n Extracted {len(runs)} benchmark runs")
    
    by_io_level = defaultdict(list)
    for run in runs:
        by_io_level[run['io_level']].append(run)
    
    with output_csv.open('w', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(['runtime_ms', 'postproc_pct', 'tracing_pct', 'writing_level', 'benchmark_id'])
        
        for run in sorted(runs, key=lambda r: r['runtime_ms']):
            writer.writerow([
                f"{run['runtime_ms']:.1f}",
                f"{run['postproc_pct']:.2f}",
                f"{run['tracing_pct']:.2f}",
                run['io_level'],
                run['benchmark_id']
            ])
    
    print(f"Created: {output_csv}")
    
    print("\n" + "="*60)
    print("SCALING ANALYSIS: Overhead vs Runtime")
    print("="*60)
    
    for io_level in sorted(by_io_level.keys()):
        level_runs = by_io_level[io_level]
        if len(level_runs) < 2:
            continue
        
        print(f"\n{io_level.upper()} I/O level ({len(level_runs)} runs):")
        print("-" * 40)
        
        level_runs.sort(key=lambda r: r['runtime_ms'])
        postproc_products = [r['runtime_ms'] * r['postproc_pct'] for r in level_runs]
        tracing_products = [r['runtime_ms'] * r['tracing_pct'] for r in level_runs]
        
        print("\nPost-processing overhead:")
        for run in level_runs:
            product = run['runtime_ms'] * run['postproc_pct']
            print(f"Runtime: {run['runtime_ms']:>8.0f}ms | Overhead: {run['postproc_pct']:>6.2f}% | Product: {product:>10.0f}")
        
        if len(postproc_products) >= 2:
            mean_product = statistics.mean(postproc_products)
            stdev_product = statistics.stdev(postproc_products)
            cv = (stdev_product / mean_product * 100) if mean_product > 0 else 0
            print(f"  → Product CV: {cv:.1f}% (lower = better 1/x scaling)")
        
        print("\nTracing overhead:")
        for run in level_runs:
            product = run['runtime_ms'] * run['tracing_pct']
            print(f"Runtime: {run['runtime_ms']:>8.0f}ms | Overhead: {run['tracing_pct']:>6.2f}% | Product: {product:>10.0f}")
        
        if len(tracing_products) >= 2:
            mean_product = statistics.mean(tracing_products)
            stdev_product = statistics.stdev(tracing_products)
            cv = (stdev_product / mean_product * 100) if mean_product > 0 else 0
            print(f"  → Product CV: {cv:.1f}% (lower = better 1/x scaling)")
    
    print("\n" + "="*60)
    print("INTERPRETATION:")
    print("="*60)
    print("""
For perfect 1/x scaling (overhead = k/runtime):
  - The product (runtime × overhead%) should be constant
  - Lower CV (coefficient of variation) indicates better 1/x scaling
  
Expected behavior:
  - Post-processing: Should show 1/x scaling (overhead independent of runtime)
  - Tracing with little I/O: Should show 1/x scaling (fixed syscall overhead)
  - Tracing with much I/O: May deviate if I/O scales with runtime
""")
    
    return 0


if __name__ == '__main__':
    exit(main())
