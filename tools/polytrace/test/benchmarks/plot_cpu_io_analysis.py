#!/usr/bin/env python3
"""
CPU vs IO Overhead Analysis for PolySim Benchmarks

Generates specialized plots to analyze:
1. Pure CPU overhead (should be ~0%)
2. IO overhead scaling with file count
3. Combined analysis of typical IO/CPU ratios

Inputs:
- tools/polytrace/test/benchmarks/runtime_overhead.csv
- tools/polytrace/test/benchmarks/results.csv (for file count extraction)

Outputs (written to public/benchmarks/):
- cpu_only_overhead.png - Shows overhead for pure CPU workloads
- io_scaling_by_filecount.png - Shows overhead vs number of files written
- io_cpu_ratio_analysis.png - Analyzes typical IO/CPU ratios
"""

import matplotlib.pyplot as plt
import numpy as np
from pathlib import Path
import csv
import json
import re
from collections import defaultdict

# Configure matplotlib
plt.style.use('seaborn-v0_8-darkgrid')
plt.rcParams['figure.figsize'] = (12, 6)
plt.rcParams['figure.dpi'] = 100
plt.rcParams['font.size'] = 11
plt.rcParams['axes.labelsize'] = 12
plt.rcParams['axes.titlesize'] = 14
plt.rcParams['legend.fontsize'] = 10


def extract_file_count_from_benchmark(benchmark_id: str, benchmark_configs: dict) -> int:
    """Extract the number of files from benchmark configuration."""
    # Map benchmark IDs to their config files
    config_map = {
        '07_io_scaling_small': '07_io_scaling_small.json',
        '08_io_scaling_medium': '08_io_scaling_medium.json',
        '09_io_scaling_large': '09_io_scaling_large.json',
    }
    
    if benchmark_id not in benchmark_configs:
        return 0
    
    return benchmark_configs.get(benchmark_id, {}).get('files', 0)


def load_benchmark_configs(script_dir: Path) -> dict:
    """Load benchmark configuration files to extract file counts."""
    configs = {}
    
    # For IO scaling benchmarks, we need to parse the JSON files
    io_benchmarks = ['07_io_scaling_small', '08_io_scaling_medium', '09_io_scaling_large']
    
    for bench_id in io_benchmarks:
        config_file = script_dir / f"{bench_id}.json"
        if config_file.exists():
            with open(config_file, 'r') as f:
                data = json.load(f)
                base_files = data['bench_program'].get('files', 0)
                
                # Store base config
                configs[f"{bench_id}_step0"] = {'files': base_files, 'benchmark': bench_id}
                
                # Parse plan steps to get file counts for each step
                for idx, step in enumerate(data.get('plan', [])):
                    if not step:  # Empty step means use base config
                        configs[f"{bench_id}_step{idx}"] = {'files': base_files, 'benchmark': bench_id}
                    elif 'bench_program' in step and 'files' in step['bench_program']:
                        configs[f"{bench_id}_step{idx}"] = {
                            'files': step['bench_program']['files'],
                            'benchmark': bench_id
                        }
    
    return configs


def parse_run_id_for_step(run_id: str) -> tuple:
    """Extract benchmark_id and step number from run_id like 'run_07_io_scaling_small_step0_1'."""
    match = re.match(r'run_(\d+_[\w_]+)_step(\d+)_\d+', run_id)
    if match:
        return match.group(1), int(match.group(2))
    return None, None


def read_runtime_csv_with_metadata(csv_path: Path, configs: dict):
    """Read runtime_overhead.csv and enrich with file count data."""
    data = []
    
    with open(csv_path, 'r') as f:
        reader = csv.DictReader(f)
        for row in reader:
            benchmark_id = row['benchmark_id']
            runtime_ms = float(row['runtime_ms'])
            postproc_pct = float(row['postproc_pct'])
            tracing_pct = float(row['tracing_pct'])
            writing_level = row['writing_level']
            
            # Try to get file count from configs
            file_count = 0
            for config_key, config_data in configs.items():
                if config_key.startswith(benchmark_id):
                    file_count = config_data.get('files', 0)
                    break
            
            data.append({
                'benchmark_id': benchmark_id,
                'runtime_ms': runtime_ms,
                'postproc_pct': postproc_pct,
                'tracing_pct': tracing_pct,
                'writing_level': writing_level,
                'file_count': file_count
            })
    
    return data


def plot_cpu_only_overhead(data: list, output_dir: Path):
    """Plot overhead for pure CPU workloads (should be ~0%)."""
    # Filter for CPU-only benchmarks (06_pure_cpu)
    cpu_data = [d for d in data if '06_pure_cpu' in d['benchmark_id']]
    
    if not cpu_data:
        print("Warning: No CPU-only benchmark data found (06_pure_cpu)")
        return
    
    runtimes = np.array([d['runtime_ms'] for d in cpu_data])
    postproc = np.array([d['postproc_pct'] for d in cpu_data])
    tracing = np.array([d['tracing_pct'] for d in cpu_data])
    
    # Single plot matching the scaling style
    fig, ax = plt.subplots(figsize=(12, 6))
    fig.suptitle('Pure CPU overhead (no I/O)', fontsize=16, fontweight='bold')
    
    ax.scatter(runtimes, postproc, c='#8b5cf6', marker='o', s=100, label='postproc / total (%)', alpha=0.7)
    ax.scatter(runtimes, tracing, c='#10b981', marker='s', s=100, label='tracing / untraced (%)', alpha=0.7)
    
    # Add reference line at y=0
    ax.axhline(y=0.01, color='#e2e8f0', linestyle='--', linewidth=1.5, label='0.01% reference')
    
    # Add statistics text
    stats_text = f"Post-processing: μ={postproc.mean():.3f}%, σ={postproc.std():.3f}%\n"
    stats_text += f"Tracing: μ={tracing.mean():.3f}%, σ={tracing.std():.3f}%\n"
    stats_text += f"n={len(cpu_data)} samples"
    ax.text(0.02, 0.98, stats_text, transform=ax.transAxes, 
            verticalalignment='top', bbox=dict(boxstyle='round', facecolor='white', alpha=0.9),
            fontsize=10, family='monospace')
    
    ax.set_xlabel('CPU_ms')
    ax.set_ylabel('overhead (%)')
    ax.set_xscale('log')
    ax.set_yscale('log')
    ax.grid(True, which='both', alpha=0.3)
    ax.legend(loc='upper right', framealpha=0.9)
    plt.tight_layout()
    
    output_path = output_dir / 'scaling_cpu_only.png'
    plt.savefig(output_path, dpi=100, bbox_inches='tight', facecolor='white', edgecolor='none',
                format='png', pil_kwargs={'optimize': True})
    print(f"Created: {output_path}")
    plt.close()


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
                m, b = np.polyfit(logx, logy, 1)
                x_line = np.linspace(file_counts.min(), file_counts.max(), 100)
                y_line = 10 ** (m * np.log10(x_line) + b)
                ax.plot(x_line, y_line, color=colors[bench_id], linewidth=2, 
                       label=f'{labels[bench_id]} fit slope ≈ {m:.2f}')
    
    ax.set_xlabel('file count')
    ax.set_ylabel('overhead (%)')
    ax.set_xscale('log')
    ax.set_yscale('log')
    ax.grid(True, which='both', alpha=0.3)
    ax.legend(loc='upper right', framealpha=0.9)
    plt.tight_layout()
    
    output_path = output_dir / 'scaling_tracing_vs_filecount.png'
    plt.savefig(output_path, dpi=100, bbox_inches='tight', facecolor='white', edgecolor='none',
                format='png', pil_kwargs={'optimize': True})
    print(f"Created: {output_path}")
    plt.close()
    
    # Plot 2: Post-processing Overhead vs File Count (log-log style)
    fig, ax = plt.subplots(figsize=(12, 6))
    fig.suptitle('Post-processing overhead vs file count', fontsize=16, fontweight='bold')
    
    for bench_id in io_benchmarks:
        bench_data = [d for d in data if bench_id in d['benchmark_id'] and d['file_count'] > 0 and d['postproc_pct'] > 0]
        if bench_data:
            file_counts = np.array([d['file_count'] for d in bench_data])
            postproc = np.array([d['postproc_pct'] for d in bench_data])
            ax.scatter(file_counts, postproc, c=colors[bench_id], marker=markers[bench_id], 
                      s=100, label=labels[bench_id], alpha=0.7)
            # Fit line in log-log space
            if len(file_counts) > 1:
                logx = np.log10(file_counts)
                logy = np.log10(postproc)
                m, b = np.polyfit(logx, logy, 1)
                x_line = np.linspace(file_counts.min(), file_counts.max(), 100)
                y_line = 10 ** (m * np.log10(x_line) + b)
                ax.plot(x_line, y_line, color=colors[bench_id], linewidth=2,
                       label=f'{labels[bench_id]} fit slope ≈ {m:.2f}')
    
    ax.set_xlabel('file count')
    ax.set_ylabel('overhead (%)')
    ax.set_xscale('log')
    ax.set_yscale('log')
    ax.grid(True, which='both', alpha=0.3)
    ax.legend(loc='upper right', framealpha=0.9)
    plt.tight_layout()
    
    output_path = output_dir / 'scaling_postproc_vs_filecount.png'
    plt.savefig(output_path, dpi=100, bbox_inches='tight', facecolor='white', edgecolor='none',
                format='png', pil_kwargs={'optimize': True})
    print(f"Created: {output_path}")
    plt.close()


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
    plot_cpu_only_overhead(data, output_dir)
    plot_io_scaling(data, output_dir)
    plot_io_cpu_ratio_analysis(data, output_dir)
    
    print("\nAnalysis complete!")
    return 0


if __name__ == '__main__':
    exit(main())
