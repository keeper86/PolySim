#!/usr/bin/env python3
"""
CPU vs IO Overhead Analysis for PolySim Benchmarks

Generates plots to analyze IO/CPU ratios.

Inputs:
- tools/polytrace/test/benchmarks/runtime_overhead.csv
- tools/polytrace/test/benchmarks/results.csv (for file count extraction)

Outputs (written to public/benchmarks/):
- scaling_by_io_category.png - Overhead vs wall-time by IO category
"""

import matplotlib.pyplot as plt
import numpy as np
from pathlib import Path
import csv
import json
import re
from collections import defaultdict


def load_benchmark_configs(script_dir: Path):
    """Load benchmark JSON configs present in the benchmarks folder.

    Returns a dict keyed by benchmark base name (e.g., '07_io_scaling_small').
    """
    configs = {}
    for p in sorted(script_dir.glob("*.json")):
        try:
            with p.open('r', encoding='utf-8') as f:
                cfg = json.load(f)
            key = p.stem
            configs[key] = cfg
        except Exception:
            continue
    return configs


def read_runtime_csv_with_metadata(csv_path: Path, configs: dict):
    """Read runtime_overhead.csv and attach minimal metadata.

    Expected columns: runtime_ms,postproc_pct,tracing_pct,writing_level,benchmark_id
    Returns list of dicts for plotting.
    """
    data = []
    with csv_path.open('r', newline='') as f:
        reader = csv.DictReader(f)
        for row in reader:
            try:
                rt = float(row.get('runtime_ms', '0'))
                pp = float(row.get('postproc_pct', '0'))
                tr = float(row.get('tracing_pct', '0'))
                lvl = (row.get('writing_level', '') or '').strip().lower()
                bench = (row.get('benchmark_id', '') or '').strip()
                if rt <= 0 or pp <= 0 or tr <= 0:
                    continue
                data.append({
                    'runtime_ms': rt,
                    'postproc_pct': pp,
                    'tracing_pct': tr,
                    'writing_level': lvl if lvl in {'none', 'little', 'much'} else 'little',
                    'benchmark_id': bench,
                })
            except ValueError:
                continue
    return data


def plot_io_scaling(data: list, output_dir: Path):
    """Plot overhead vs number of files for I/O scaling benchmarks."""
    # Filter for IO scaling benchmarks
    io_benchmarks = ['07_io_scaling_small', '08_io_scaling_medium', '09_io_scaling_large']
    
    colors = {'07_io_scaling_small': '#3b82f6', '08_io_scaling_medium': '#10b981', '09_io_scaling_large': '#f59e0b'}
    markers = {'07_io_scaling_small': 'o', '08_io_scaling_medium': 's', '09_io_scaling_large': '^'}
    labels = {'07_io_scaling_small': 'small (4KB)', '08_io_scaling_medium': 'medium (1MB)', '09_io_scaling_large': 'large (10MB)'}
    
    # Plot 1: Tracing Overhead vs File Count (log-log style)
    fig, ax = plt.subplots(figsize=(12, 6))
    fig.suptitle('Tracing overhead vs file count', fontsize=16, fontweight='bold')
    
    for bench_id in io_benchmarks:
        bench_data = [d for d in data if bench_id in d['benchmark_id'] and d['file_count'] > 0 and d['tracing_pct'] > 0]
        if bench_data:
            file_counts = np.array([d['file_count'] for d in bench_data])
            tracing = np.array([d['tracing_pct'] for d in bench_data])
            ax.scatter(file_counts, tracing, c=colors[bench_id], marker=markers[bench_id], 
                      s=100, label=labels[bench_id], alpha=0.7)
            # Fit line in log-log space
            if len(file_counts) > 1:
                logx = np.log10(file_counts)
                logy = np.log10(tracing)
                finite_mask = np.isfinite(logx) & np.isfinite(logy)
                logx = logx[finite_mask]
                logy = logy[finite_mask]
                if len(logx) > 1 and len(np.unique(logx)) > 1:
                    try:
                        m, b = np.polyfit(logx, logy, 1)
                    except np.linalg.LinAlgError:
                        m = b = None
                    if m is not None and b is not None:
                        x_line = np.linspace(file_counts.min(), file_counts.max(), 100)
                        y_line = 10 ** (m * np.log10(x_line) + b)
                        ax.plot(
                            x_line,
                            y_line,
                            color=colors[bench_id],
                            linewidth=2,
                            label=f"{labels[bench_id]} fit slope ~ {m:.2f}",
                        )
    
def plot_io_cpu_ratio_analysis(data: list, output_dir: Path):
    """Analyze and plot typical IO/CPU ratios in scaling plot style."""
    # Separate data by category
    cpu_only = [d for d in data if d['writing_level'] == 'none']
    little_io = [d for d in data if d['writing_level'] == 'little']
    much_io = [d for d in data if d['writing_level'] == 'much']
    
    # Main plot: All categories in one scatter plot (log-log)
    fig, ax = plt.subplots(figsize=(12, 6))
    fig.suptitle('Overhead vs wall-time by I/O category', fontsize=16, fontweight='bold')
    
    if cpu_only:
        runtimes = np.array([d['runtime_ms'] for d in cpu_only])
        tracing = np.array([d['tracing_pct'] for d in cpu_only])
        ax.scatter(runtimes, tracing, c='#6366f1', marker='o', s=100, label='CPU only', alpha=0.7)
        
    if little_io:
        runtimes = np.array([d['runtime_ms'] for d in little_io])
        tracing = np.array([d['tracing_pct'] for d in little_io])
        ax.scatter(runtimes, tracing, c='#10b981', marker='s', s=100, label='little I/O', alpha=0.7)
        # Fit line
        if len(runtimes) > 1:
            logx = np.log10(runtimes)
            logy = np.log10(tracing)
            m, b = np.polyfit(logx, logy, 1)
            x_line = np.linspace(runtimes.min(), runtimes.max(), 200)
            y_line = 10 ** (m * np.log10(x_line) + b)
            ax.plot(x_line, y_line, color='#10b981', linewidth=2, label=f'little I/O fit slope ≈ {m:.2f}')
        
    if much_io:
        runtimes = np.array([d['runtime_ms'] for d in much_io])
        tracing = np.array([d['tracing_pct'] for d in much_io])
        ax.scatter(runtimes, tracing, c='#f59e0b', marker='^', s=100, label='much I/O', alpha=0.7)
        # Fit line
        if len(runtimes) > 1:
            logx = np.log10(runtimes)
            logy = np.log10(tracing)
            m, b = np.polyfit(logx, logy, 1)
            x_line = np.linspace(runtimes.min(), runtimes.max(), 200)
            y_line = 10 ** (m * np.log10(x_line) + b)
            ax.plot(x_line, y_line, color='#f59e0b', linewidth=2, label=f'much I/O fit slope ≈ {m:.2f}')
    
    # 1/x reference line
    all_runtimes = [d['runtime_ms'] for d in data]
    all_tracing = [d['tracing_pct'] for d in data]
    if all_runtimes and all_tracing:
        rt_arr = np.array(all_runtimes)
        tr_arr = np.array(all_tracing)
        xm = np.median(rt_arr)
        anchor_y = np.median(tr_arr)
        k = anchor_y * xm
        x_line = np.linspace(rt_arr.min(), rt_arr.max(), 200)
        y_line = k / x_line
        ax.plot(x_line, y_line, color='black', linestyle='--', linewidth=1.5, label='1/x reference')
    
    ax.set_xlabel('CPU_ms')
    ax.set_ylabel('overhead (%)')
    ax.set_xscale('log')
    ax.set_yscale('log')
    ax.grid(True, which='both', alpha=0.3)
    ax.legend(loc='upper right', framealpha=0.9)
    plt.tight_layout()
    
    output_path = output_dir / 'scaling_by_io_category.png'
    plt.savefig(output_path, dpi=100, bbox_inches='tight', facecolor='white', edgecolor='none',
                format='png', pil_kwargs={'optimize': True})
    print(f"Created: {output_path}")
    plt.close()


def main():
    script_dir = Path(__file__).parent
    project_root = script_dir.parent.parent.parent.parent
    
    # Input paths
    csv_path = script_dir / 'runtime_overhead.csv'
    output_dir = project_root / 'public' / 'benchmarks'
    
    if not csv_path.exists():
        print(f"Error: runtime_overhead.csv not found at {csv_path}")
        print("   Run: cd tools/polytrace/test/benchmarks && ./run_bench.sh")
        return 1
    
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # Load benchmark configurations to get file counts
    print("\nLoading benchmark configurations...")
    configs = load_benchmark_configs(script_dir)
    print(f"   Loaded {len(configs)} benchmark configurations")
    
    # Load runtime data
    print("\nLoading runtime overhead data...")
    data = read_runtime_csv_with_metadata(csv_path, configs)
    print(f"   Loaded {len(data)} data points")
    
    # Generate plots
    print("\nGenerating analysis plots...")
    plot_io_cpu_ratio_analysis(data, output_dir)
    
    print("\nAnalysis complete!")
    return 0


if __name__ == '__main__':
    exit(main())
