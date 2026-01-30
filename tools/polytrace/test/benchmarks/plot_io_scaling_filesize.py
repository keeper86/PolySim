#!/usr/bin/env python3
"""Plot I/O scaling: mean overhead vs total data size (log-log).

Aggregates multiple iterations per configuration and computes mean and
standard deviation (per total data size and file size category).
Plots the mean values, optionally with error bars to visualize variability.
"""

import matplotlib.pyplot as plt
import numpy as np
from pathlib import Path
import csv

COLOR_SMALL = '#f59e0b'    # amber - 1MB files
COLOR_MEDIUM = '#3b82f6'   # blue - 10MB files
COLOR_LARGE = '#ef4444'    # red - 50MB files

def _fit_loglog(x: np.ndarray, y: np.ndarray):
    """Fit y ~ x^m in log10 space."""
    logx = np.log10(x)
    logy = np.log10(y)
    m, b = np.polyfit(logx, logy, 1)
    return m, b

def main():
    script_dir = Path(__file__).parent
    results_csv = script_dir / 'results.csv'
    output_dir = script_dir.parent.parent.parent.parent / 'public' / 'benchmarks'
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # Parse aggregated overheads per configuration:
    # {(file_size_mb, total_mb): [overhead_pct, ...]}
    data_by_config = {}
    
    with results_csv.open('r') as f:
        for row in csv.DictReader(f):
            run_id = row['run_id']
            if not any(x in run_id for x in ['run_07_io_scaling_small', 'run_08_io_scaling_medium', 'run_09_io_scaling_large']):
                continue
            
            try:
                wall_untraced = float(row['wall_ms_untraced'])
                traced_ms = float(row['traced_ms'] or 0)
                
                if wall_untraced <= 0 or traced_ms <= 0:
                    continue
                
                overhead_pct = ((traced_ms - wall_untraced) / wall_untraced) * 100
                
                # Determine benchmark config
                if 'run_07' in run_id:
                    file_size_mb = 1
                    step = int(run_id.split('_step')[1].split('_')[0])
                    file_counts = [50, 100, 150, 200, 300, 500, 750, 1000, 1500, 2000]
                    file_count = file_counts[step]
                elif 'run_08' in run_id:
                    file_size_mb = 10
                    step = int(run_id.split('_step')[1].split('_')[0])
                    file_counts = [5, 10, 15, 20, 30, 50, 75, 100, 150, 200]
                    file_count = file_counts[step]
                elif 'run_09' in run_id:
                    file_size_mb = 50
                    step = int(run_id.split('_step')[1].split('_')[0])
                    file_counts = [1, 2, 3, 4, 6, 10, 15, 20, 30, 40]
                    file_count = file_counts[step]
                else:
                    continue
                
                total_mb = file_size_mb * file_count
                key = (file_size_mb, total_mb)
                
                if key not in data_by_config:
                    data_by_config[key] = []
                data_by_config[key].append(overhead_pct)
            except (ValueError, KeyError, IndexError):
                continue
    
    if not data_by_config:
        print("No I/O scaling data found")
        return 1
    
    # Aggregate per config with mean and std:
    # {file_size_mb: [(total_mb, mean_overhead, std_overhead, count)]}
    by_file_size = {}
    for (file_size_mb, total_mb), overheads in data_by_config.items():
        if file_size_mb not in by_file_size:
            by_file_size[file_size_mb] = []
        arr = np.array(overheads, dtype=float)
        mean_ovh = float(np.mean(arr))
        std_ovh = float(np.std(arr, ddof=1)) if arr.size > 1 else 0.0
        by_file_size[file_size_mb].append((total_mb, mean_ovh, std_ovh, int(arr.size)))
    
    # Create plot with log x-axis and linear y-axis
    fig, ax = plt.subplots(figsize=(12, 6))
    fig.suptitle('Mean tracing overhead vs total data size', fontsize=16, fontweight='bold')
    
    colors = {1: COLOR_SMALL, 10: COLOR_MEDIUM, 50: COLOR_LARGE}
    
    for file_size_mb in sorted(by_file_size.keys()):
        points = sorted(by_file_size[file_size_mb])
        total_mbs = np.array([p[0] for p in points])
        means = np.array([p[1] for p in points])
        stds = np.array([p[2] for p in points])

        color = colors.get(file_size_mb, '#999999')
        
        ax.scatter(
            total_mbs,
            means,
            color=color,
            s=40,
            label=f'{file_size_mb}MB files',
            zorder=3,
        )
    
    ax.set_xscale('log')
    ax.set_xlabel('Total data size (MB)')
    ax.set_ylabel('Overhead (%)')
    ax.set_ylim(0, 2000)
    ax.grid(True, which='both', alpha=0.3)
    ax.legend(loc='best', framealpha=0.9, fontsize=12)
    plt.tight_layout()
    
    output_file = output_dir / 'scaling_io_datasize_vs_overhead.png'
    plt.savefig(output_file, dpi=100, bbox_inches='tight', facecolor='white', format='png')
    print(f"✓ {output_file}")
    
    # Print summary with mean ± std per file size
    for file_size_mb in sorted(by_file_size.keys()):
        points = by_file_size[file_size_mb]
        sizes = [p[0] for p in points]
        means = [p[1] for p in points]
        stds = [p[2] for p in points]
        counts = [p[3] for p in points]
        sizes_arr = np.array(sizes)
        means_arr = np.array(means)
        stds_arr = np.array(stds)
        m, b = _fit_loglog(sizes_arr, means_arr)
        avg_std = float(np.mean(stds_arr)) if stds_arr.size else 0.0
        print(f"\n{file_size_mb}MB files: scaling exponent = {m:.3f} (y ~ $x^{{{m:.3f}}}$)")
        print(f"  Size range: {sizes[0]}-{sizes[-1]}MB, Mean overhead: {means[0]:.2f}%-{means[-1]:.2f}%, Avg std: {avg_std:.2f}%")
        # Optional: show counts per point for transparency
        counts_str = ', '.join(str(c) for c in counts)
        print(f"  Repeats per point: [{counts_str}]")
    
    return 0

if __name__ == '__main__':
    exit(main())
