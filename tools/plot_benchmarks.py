#!/usr/bin/env python3
"""
Benchmark Visualization Tool for PolySim
Generates publication-quality plots for web display (1200x600px)
"""

import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
import numpy as np
from pathlib import Path
import csv
import json

# Configure matplotlib for web-optimized output
plt.style.use('seaborn-v0_8-darkgrid')
plt.rcParams['figure.figsize'] = (12, 6)
plt.rcParams['figure.dpi'] = 100
plt.rcParams['font.size'] = 11
plt.rcParams['axes.labelsize'] = 12
plt.rcParams['axes.titlesize'] = 14
plt.rcParams['legend.fontsize'] = 10
plt.rcParams['xtick.labelsize'] = 10
plt.rcParams['ytick.labelsize'] = 10

def load_benchmarks(project_root: Path):
    """Load benchmark dataset from public JSON so page and plots share one source."""
    data_path = project_root / 'public' / 'benchmarks' / 'benchmarks.json'
    with data_path.open('r', encoding='utf-8') as f:
        return json.load(f)

# Color scheme (professional, web-friendly)
COLOR_POSTPROC = '#3b82f6'  # blue-500
COLOR_TRACING = '#ef4444'   # red-500
COLOR_GRID = '#e2e8f0'      # slate-200


def create_individual_plot(benchmark, output_dir):
    """Create a plot for a single benchmark (bar chart only)."""
    stats = benchmark['stats']

    fig, ax1 = plt.subplots(1, 1, figsize=(12, 6))
    fig.suptitle(benchmark['title'], fontsize=16, fontweight='bold', y=0.98)

    # Bar chart with error bars
    categories = ['Post-Processing\nOverhead', 'Incremental\nTracing Overhead']
    means = [stats['postprocMean'], stats['incrTracingMean']]
    stds = [stats['postprocStdev'], stats['incrTracingStdev']]
    colors = [COLOR_POSTPROC, COLOR_TRACING]

    x_pos = np.arange(len(categories))
    bars = ax1.bar(
        x_pos,
        means,
        yerr=stds,
        capsize=8,
        color=colors,
        alpha=0.8,
        edgecolor='black',
        linewidth=1.2,
    )

    ax1.set_ylabel('Overhead (%)', fontweight='bold')
    ax1.set_xticks(x_pos)
    ax1.set_xticklabels(categories)
    ax1.set_title('Performance Overhead Comparison', fontsize=13, pad=10)
    ax1.grid(True, alpha=0.3, axis='y')
    ax1.set_axisbelow(True)

    # Add value labels on bars
    for i, (bar, mean, std) in enumerate(zip(bars, means, stds)):
        height = bar.get_height()
        ax1.text(bar.get_x() + bar.get_width()/2., height + std,
                f'{mean:.2f}%\n±{std:.2f}%',
                ha='center', va='bottom', fontsize=10, fontweight='bold')

    plt.tight_layout()
    
    # Save to public/benchmarks/
    output_path = output_dir / f"benchmark_{benchmark['id']}.png"
    plt.savefig(output_path, dpi=100, bbox_inches='tight', 
                facecolor='white', edgecolor='none', format='png', pil_kwargs={'optimize': True})
    print(f"✓ Created: {output_path}")
    plt.close()


def create_overview_plot(benchmarks, output_dir):
    """Create an overview comparison plot of all benchmarks"""
    fig, (ax1, ax2) = plt.subplots(2, 1, figsize=(12, 10))
    fig.suptitle('Benchmark Overview: Performance Overhead Across Workloads', 
                 fontsize=16, fontweight='bold', y=0.995)
    
    # Extract data
    labels = [b['id'].replace('_', ' ').title() for b in benchmarks]
    postproc_means = [b['stats']['postprocMean'] for b in benchmarks]
    postproc_stds = [b['stats']['postprocStdev'] for b in benchmarks]
    tracing_means = [b['stats']['incrTracingMean'] for b in benchmarks]
    tracing_stds = [b['stats']['incrTracingStdev'] for b in benchmarks]
    
    x = np.arange(len(labels))
    width = 0.35
    
    # Top plot: Post-processing overhead
    bars1 = ax1.bar(x, postproc_means, width, yerr=postproc_stds, 
                    capsize=5, label='Post-Processing',
                    color=COLOR_POSTPROC, alpha=0.8, edgecolor='black', linewidth=0.8)
    
    ax1.set_ylabel('Overhead (%)', fontweight='bold')
    ax1.set_title('Post-Processing Overhead (Low across all workloads)', fontsize=13)
    ax1.set_xticks(x)
    ax1.set_xticklabels(labels, rotation=15, ha='right')
    ax1.legend(loc='upper left')
    ax1.grid(True, alpha=0.3, axis='y')
    ax1.set_axisbelow(True)
    ax1.set_ylim(bottom=0)
    
    # Add value labels
    for i, (bar, mean) in enumerate(zip(bars1, postproc_means)):
        height = bar.get_height()
        ax1.text(bar.get_x() + bar.get_width()/2., height,
                f'{mean:.1f}%',
                ha='center', va='bottom', fontsize=9)
    
    # Bottom plot: Tracing overhead (log scale due to wide range)
    bars2 = ax2.bar(x, tracing_means, width, yerr=tracing_stds,
                    capsize=5, label='Incremental Tracing',
                    color=COLOR_TRACING, alpha=0.8, edgecolor='black', linewidth=0.8)
    
    ax2.set_ylabel('Overhead (%) - Log Scale', fontweight='bold')
    ax2.set_title('Incremental Tracing Overhead (Scales with metadata operations)', fontsize=13)
    ax2.set_xticks(x)
    ax2.set_xticklabels(labels, rotation=15, ha='right')
    ax2.legend(loc='upper left')
    ax2.grid(True, alpha=0.3, axis='y', which='both')
    ax2.set_axisbelow(True)
    ax2.set_yscale('log')
    ax2.set_ylim(bottom=1)
    
    # Add value labels
    for i, (bar, mean) in enumerate(zip(bars2, tracing_means)):
        height = bar.get_height()
        ax2.text(bar.get_x() + bar.get_width()/2., height,
                f'{mean:.1f}%',
                ha='center', va='bottom', fontsize=9)
    
    plt.tight_layout()
    
    output_path = output_dir / 'benchmark_overview.png'
    plt.savefig(output_path, dpi=100, bbox_inches='tight',
                facecolor='white', edgecolor='none', format='png', pil_kwargs={'optimize': True})
    print(f"✓ Created: {output_path}")
    plt.close()


def create_comparison_plot(benchmarks, output_dir):
    """Create a side-by-side comparison plot"""
    fig, ax = plt.subplots(figsize=(14, 7))
    fig.suptitle('Overhead Comparison: Post-Processing vs Tracing', 
                 fontsize=16, fontweight='bold')
    
    labels = [b['id'].replace('_', '\n') for b in benchmarks]
    postproc_means = [b['stats']['postprocMean'] for b in benchmarks]
    tracing_means = [b['stats']['incrTracingMean'] for b in benchmarks]
    
    x = np.arange(len(labels))
    width = 0.35
    
    bars1 = ax.bar(x - width/2, postproc_means, width, 
                   label='Post-Processing', color=COLOR_POSTPROC, 
                   alpha=0.8, edgecolor='black', linewidth=0.8)
    bars2 = ax.bar(x + width/2, tracing_means, width,
                   label='Incremental Tracing', color=COLOR_TRACING,
                   alpha=0.8, edgecolor='black', linewidth=0.8)
    
    ax.set_ylabel('Overhead (%)', fontweight='bold')
    ax.set_xlabel('Benchmark', fontweight='bold')
    ax.set_xticks(x)
    ax.set_xticklabels(labels, fontsize=9)
    ax.legend(loc='upper left', framealpha=0.9)
    ax.grid(True, alpha=0.3, axis='y')
    ax.set_axisbelow(True)
    ax.set_yscale('log')
    ax.set_ylim(bottom=0.5)
    
    plt.tight_layout()
    
    output_path = output_dir / 'benchmark_comparison.png'
    plt.savefig(output_path, dpi=100, bbox_inches='tight',
                facecolor='white', edgecolor='none', format='png', pil_kwargs={'optimize': True})
    print(f"✓ Created: {output_path}")
    plt.close()


def main():
    """Generate all benchmark visualizations"""
    # Determine output directory (public/benchmarks/)
    script_dir = Path(__file__).parent
    project_root = script_dir.parent
    output_dir = project_root / 'public' / 'benchmarks'
    output_dir.mkdir(parents=True, exist_ok=True)
    
    print(f"\n📊 Generating benchmark plots...")
    print(f"Output directory: {output_dir}\n")
    
    # Load dataset once
    benchmarks = load_benchmarks(project_root)

    # Generate individual plots
    print("Creating individual benchmark plots:")
    for benchmark in benchmarks:
        create_individual_plot(benchmark, output_dir)
    
    print("\nCreating overview plots:")
    create_overview_plot(benchmarks, output_dir)
    create_comparison_plot(benchmarks, output_dir)

    # Optional: runtime vs overhead scatter plot (like PoC example)
    # Reads tools/runtime_overhead.csv when available
    try:
        create_runtime_overhead_scatter(output_dir)
    except Exception as e:
        print(f"\n⚠ Skipped runtime-overhead scatter: {e}")
    
    print(f"\n✨ Done! Generated {len(benchmarks) + 2} plots")
    print(f"   Individual plots: {len(benchmarks)}")
    print(f"   Overview plots: 2")
    print(f"\n💡 Plots are optimized for web display (1200x600px @ 100dpi)")


def create_runtime_overhead_scatter(output_dir: Path):
    """Create a log-log scatter plot of overhead vs runtime similar to the PoC example.

    Input CSV (tools/runtime_overhead.csv) format (no header lines starting with '#'):

    runtime_ms,postproc_pct,tracing_pct,writing_level
    500,2.1,15.0,little
    12000,0.8,3.5,much

    - runtime_ms: Untraced runtime in milliseconds (x-axis)
    - postproc_pct: (postproc / total - 1) * 100 (%)
    - tracing_pct: (traced / untraced - 1) * 100 (%)
    - writing_level: either 'little' or 'much' (used for trend lines)
    """

    script_dir = Path(__file__).parent
    csv_path = script_dir / 'runtime_overhead.csv'
    if not csv_path.exists():
        print(f"\nℹ runtime_overhead.csv not found at {csv_path}. Create it to enable the PoC-style plot.")
        return

    runtimes = []
    postproc = []
    tracing = []
    levels = []

    with csv_path.open('r', newline='') as f:
        reader = csv.reader(f)
        for row in reader:
            if not row or len(row) == 0:
                continue
            line = ','.join(row).strip()
            if line.startswith('#'):
                continue
            if len(row) < 4:
                continue
            try:
                rt = float(row[0])
                pp = float(row[1])
                tr = float(row[2])
                lvl = row[3].strip().lower()
                if rt <= 0 or pp <= 0 or tr <= 0:
                    # log-log requires positive values
                    continue
                runtimes.append(rt)
                postproc.append(pp)
                tracing.append(tr)
                levels.append('little' if lvl.startswith('little') else 'much')
            except ValueError:
                continue

    if len(runtimes) < 2:
        print("\nℹ Not enough rows in runtime_overhead.csv to produce scatter plot (need >= 2).")
        return

    # Prepare figure
    fig, ax = plt.subplots(figsize=(12, 6))
    fig.suptitle('Overhead versus runtime', fontsize=14, fontweight='bold')

    # Colors and markers (approximate to example)
    COLOR_POST = '#a855f7'   # violet-500
    COLOR_TRACE = '#10b981'  # emerald-500
    COLOR_LINE_LITTLE = '#60a5fa'  # blue-400
    COLOR_LINE_MUCH = '#f59e0b'    # amber-500

    # Scatter points
    runtimes_np = np.array(runtimes)
    postproc_np = np.array(postproc)
    tracing_np = np.array(tracing)
    levels_np = np.array(levels)

    ax.scatter(runtimes_np, postproc_np, c=COLOR_POST, marker='o', label='postproc/total')
    ax.scatter(runtimes_np, tracing_np, c=COLOR_TRACE, marker='s', label='with tracing / untraced')

    # Trend lines per writing level for tracing overhead (more indicative)
    for lvl, color, label in [
        ('little', COLOR_LINE_LITTLE, 'little writing'),
        ('much', COLOR_LINE_MUCH, 'much writing'),
    ]:
        mask = levels_np == lvl
        if mask.sum() >= 2:
            x = runtimes_np[mask]
            y = tracing_np[mask]
            # Linear fit in log-log space: log10(y) = m*log10(x) + b
            logx = np.log10(x)
            logy = np.log10(y)
            m, b = np.polyfit(logx, logy, 1)
            # line across observed x-range
            x_line = np.linspace(x.min(), x.max(), 100)
            y_line = 10 ** (m * np.log10(x_line) + b)
            ax.plot(x_line, y_line, color=color, linewidth=2, label=label)

    # Axes settings (log-log)
    ax.set_xscale('log')
    ax.set_yscale('log')
    ax.set_xlabel('CPU_ms')
    ax.set_ylabel('per cent overhead (%)')
    ax.grid(True, which='both', axis='both', alpha=0.3)

    ax.legend(loc='upper right', framealpha=0.9)
    plt.tight_layout()

    output_path = output_dir / 'benchmark_runtime_overhead.png'
    plt.savefig(output_path, dpi=100, bbox_inches='tight', facecolor='white', edgecolor='none',
                format='png', pil_kwargs={'optimize': True})
    print(f"✓ Created: {output_path}")
    plt.close()


if __name__ == '__main__':
    main()
