#!/usr/bin/env python3
"""CPU-only tracing overhead vs runtime (1/x scaling analysis)."""

import matplotlib.pyplot as plt
import numpy as np
from pathlib import Path
import csv

COLOR_EMERALD = '#10b981'

def _fit_loglog(x: np.ndarray, y: np.ndarray):
    """Fit y ~ x^m in log10 space."""
    logx = np.log10(x)
    logy = np.log10(y)
    m, b = np.polyfit(logx, logy, 1)
    return m, b

def _plot_inv_x(ax, x: np.ndarray, anchor_y: float):
    """Plot 1/x reference line."""
    k = anchor_y * np.median(x)
    x_line = np.linspace(x.min(), x.max(), 200)
    y_line = k / x_line
    ax.plot(x_line, y_line, 'k--', linewidth=1.5, label='1/x reference')

def main():
    script_dir = Path(__file__).parent
    results_csv = script_dir / 'results.csv'
    output_dir = script_dir.parent.parent.parent.parent / 'public' / 'benchmarks'
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # Read CPU-only data from results.csv
    runtimes, overheads = [], []
    
    with results_csv.open('r') as f:
        for row in csv.DictReader(f):
            if 'run_06_pure_cpu' not in row['run_id']:
                continue
            try:
                wall_untraced = float(row['wall_ms_untraced'])
                wall_traced = float(row['wall_ms_traced'] or 0)
                if wall_untraced > 0 and wall_traced > 0:
                    overhead_pct = ((wall_traced - wall_untraced) / wall_untraced) * 100
                    runtimes.append(wall_untraced)
                    overheads.append(overhead_pct)
            except (ValueError, KeyError):
                continue
    
    if not runtimes:
        print("No CPU-only benchmarks found")
        return 1
    
    runtimes = np.array(runtimes)
    overheads = np.array(overheads)
    
    # Plot
    fig, ax = plt.subplots(figsize=(12, 6))
    fig.suptitle('Tracing overhead vs runtime (CPU-only)', fontsize=16, fontweight='bold')
    
    ax.scatter(runtimes, overheads, c=COLOR_EMERALD, marker='o', s=60, label='tracing')
    
    if len(runtimes) >= 2:
        m, b = _fit_loglog(runtimes, overheads)
        x_line = np.linspace(runtimes.min(), runtimes.max(), 200)
        y_line = 10**(m * np.log10(x_line) + b)
        ax.plot(x_line, y_line, color=COLOR_EMERALD, linewidth=2, label=rf'fit: $x^{{{m:.2f}}}$')
    
    _plot_inv_x(ax, runtimes, np.median(overheads))
    
    ax.set_xscale('log')
    ax.set_yscale('log')
    ax.set_xlabel('Runtime (ms)')
    ax.set_ylabel('Overhead (%)')
    ax.grid(True, which='both', alpha=0.3)
    ax.legend(loc='upper right', framealpha=0.9, fontsize=12)
    plt.tight_layout()
    
    output_file = output_dir / 'scaling_tracing_vs_runtime_cpu_only.png'
    plt.savefig(output_file, dpi=100, bbox_inches='tight', facecolor='white', 
                format='png', pil_kwargs={'optimize': True})
    print(f"✓ {output_file}")
    
    # Stats
    product = runtimes * overheads
    cv = 100 * product.std() / product.mean()
    print(f"\n{len(runtimes)} runs | runtime: {runtimes.min():.0f}-{runtimes.max():.0f}ms | "
          f"overhead: {overheads.min():.2f}-{overheads.max():.2f}% | CV: {cv:.1f}%")
    
    return 0

if __name__ == '__main__':
    exit(main())
