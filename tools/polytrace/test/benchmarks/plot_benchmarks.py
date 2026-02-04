#!/usr/bin/env python3
"""
Benchmark Visualization Tool for PolySim

This version focuses on investigating how overhead scales with wall-time.
It generates log-log scatter plots of overhead (%) versus untraced runtime (ms)
and overlays 1/x reference lines and category trend lines.

Inputs:
- tools/polytrace/test/benchmarks/runtime_overhead.csv with rows:
        runtime_ms,postproc_pct,tracing_pct,writing_level
    where writing_level is a categorical indicator like 'little' or 'much'.

Outputs (written to public/benchmarks/):
- scaling_postproc_vs_runtime.png
- scaling_tracing_vs_runtime.png
"""

import matplotlib.pyplot as plt
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
    """Legacy helper retained for compatibility; not used in scaling plots."""
    data_path = project_root / 'public' / 'benchmarks' / 'benchmarks.json'
    if not data_path.exists():
        return []
    with data_path.open('r', encoding='utf-8') as f:
        return json.load(f)

# Color scheme (professional, web-friendly)
COLOR_POSTPROC = '#3b82f6'  # blue-500
COLOR_TRACING = '#ef4444'   # red-500
COLOR_GRID = '#e2e8f0'      # slate-200
COLOR_VIOLET = '#8b5cf6'    # violet-500 for postproc scatter
COLOR_EMERALD = '#10b981'   # emerald-500 for tracing scatter
COLOR_BLUE = '#60a5fa'      # blue-400 for little writing trend
COLOR_AMBER = '#f59e0b'     # amber-500 for much writing trend


def _fit_loglog(x: np.ndarray, y: np.ndarray):
    """Fit y ~ x^m in log10 space, return slope m and intercept b (log10).

    Model: log10(y) = m * log10(x) + b
    """
    logx = np.log10(x)
    logy = np.log10(y)
    m, b = np.polyfit(logx, logy, 1)
    return m, b


def _plot_reference_inv_x(ax, x: np.ndarray, anchor_y: float, label: str, color: str, linewidth: float = 1.5):
    """Plot a 1/x reference line in log-log space passing through (median(x), anchor_y)."""
    xm = np.median(x)
    # 1/x line: y = k / x; choose k = anchor_y * xm
    k = anchor_y * xm
    x_line = np.linspace(x.min(), x.max(), 200)
    y_line = k / x_line
    ax.plot(x_line, y_line, color='black', linestyle='--', linewidth=linewidth, label=label)


def _read_runtime_csv(csv_path: Path):
    """Read tools/runtime_overhead.csv and return arrays."""
    runtimes = []
    postproc = []
    tracing = []
    levels = []

    with csv_path.open('r', newline='') as f:
        reader = csv.reader(f)
        for row in reader:
            if not row:
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
                    # need positive for log-log
                    continue
                runtimes.append(rt)
                postproc.append(pp)
                tracing.append(tr)
                levels.append('little' if lvl.startswith('little') else 'much')
            except ValueError:
                continue

    return np.array(runtimes), np.array(postproc), np.array(tracing), np.array(levels)


def create_scaling_plots_from_csv(output_dir: Path):
    """Create scaling plots for post-processing and tracing overhead versus runtime.

    Requires tools/runtime_overhead.csv. Produces two PNGs.
    """
    script_dir = Path(__file__).parent
    project_root = script_dir.parent.parent.parent.parent
    csv_path = script_dir / 'runtime_overhead.csv'
    if not csv_path.exists():
        print(f"\nℹ runtime_overhead.csv not found at {csv_path}. Add data to enable scaling plots.")
        return 0

    runtimes, postproc, tracing, levels = _read_runtime_csv(csv_path)

    if runtimes.size < 2:
        print("\nℹ Not enough rows in runtime_overhead.csv to produce scaling plots (need >= 2).")
        return 0

    created = 0

    # 1) Post-processing vs runtime
    fig, ax = plt.subplots(figsize=(12, 6))
    fig.suptitle('Post-processing overhead vs wall-time', fontsize=16, fontweight='bold')

    ax.scatter(runtimes, postproc, c=COLOR_VIOLET, marker='o', label='postproc / total (%)')

    # Fit slope and show in legend
    try:
        m, b = _fit_loglog(runtimes, postproc)
        x_line = np.linspace(runtimes.min(), runtimes.max(), 200)
        y_line = 10 ** (m * np.log10(x_line) + b)
        ax.plot(x_line, y_line, color=COLOR_VIOLET, linewidth=2, label=f'fit slope ≈ {m:.2f}')
    except Exception:
        pass

    # 1/x reference line anchored at median
    _plot_reference_inv_x(ax, runtimes, anchor_y=np.median(postproc), label='1/x reference', color=COLOR_BLUE)

    ax.set_xscale('log')
    ax.set_yscale('log')
    ax.set_xlabel('CPU_ms')
    ax.set_ylabel('overhead (%)')
    ax.grid(True, which='both', axis='both', alpha=0.3)
    ax.legend(loc='upper right', framealpha=0.9)
    plt.tight_layout()

    out1 = output_dir / 'scaling_postproc_vs_runtime.png'
    plt.savefig(out1, dpi=100, bbox_inches='tight', facecolor='white', edgecolor='none',
                format='png', pil_kwargs={'optimize': True})
    print(f"✓ Created: {out1}")
    plt.close()
    created += 1

    # 2) Tracing vs runtime (colored by writing level)
    fig, ax = plt.subplots(figsize=(12, 6))
    fig.suptitle('Tracing overhead vs wall-time', fontsize=16, fontweight='bold')

    mask_little = levels == 'little'
    mask_much = levels == 'much'

    if mask_little.any():
        ax.scatter(runtimes[mask_little], tracing[mask_little], c=COLOR_EMERALD, marker='s', label='tracing (little writing)')
        try:
            m_l, b_l = _fit_loglog(runtimes[mask_little], tracing[mask_little])
            x_line = np.linspace(runtimes[mask_little].min(), runtimes[mask_little].max(), 200)
            y_line = 10 ** (m_l * np.log10(x_line) + b_l)
            ax.plot(x_line, y_line, color=COLOR_BLUE, linewidth=2, label=f'little writing fit slope ≈ {m_l:.2f}')
        except Exception:
            pass

    if mask_much.any():
        ax.scatter(runtimes[mask_much], tracing[mask_much], c=COLOR_TRACING, marker='^', label='tracing (much writing)')
        try:
            m_m, b_m = _fit_loglog(runtimes[mask_much], tracing[mask_much])
            x_line = np.linspace(runtimes[mask_much].min(), runtimes[mask_much].max(), 200)
            y_line = 10 ** (m_m * np.log10(x_line) + b_m)
            ax.plot(x_line, y_line, color=COLOR_AMBER, linewidth=2, label=f'much writing fit slope ≈ {m_m:.2f}')
        except Exception:
            pass

    # 1/x reference line using overall median anchor
    _plot_reference_inv_x(ax, runtimes, anchor_y=np.median(tracing), label='1/x reference', color=COLOR_GRID)

    ax.set_xscale('log')
    ax.set_yscale('log')
    ax.set_xlabel('CPU_ms')
    ax.set_ylabel('overhead (%)')
    ax.grid(True, which='both', axis='both', alpha=0.3)
    ax.legend(loc='upper right', framealpha=0.9)
    plt.tight_layout()

    out2 = output_dir / 'scaling_tracing_vs_runtime.png'
    plt.savefig(out2, dpi=100, bbox_inches='tight', facecolor='white', edgecolor='none',
                format='png', pil_kwargs={'optimize': True})
    print(f"✓ Created: {out2}")
    plt.close()
    created += 1

    return created


def main():
    """Generate scaling plots only (discard legacy bar charts)."""
    # Determine output directory (public/benchmarks/)
    script_dir = Path(__file__).parent
    project_root = script_dir.parent.parent.parent.parent
    output_dir = project_root / 'public' / 'benchmarks'
    output_dir.mkdir(parents=True, exist_ok=True)

    print(f"\n Generating scaling plots (overhead vs wall-time)...")
    print(f"Output directory: {output_dir}\n")

    total_created = 0

    # New scaling plots from runtime_overhead.csv
    try:
        total_created += create_scaling_plots_from_csv(output_dir)
    except Exception as e:
        print(f"\n⚠ Skipped scaling plots: {e}")

    if total_created == 0:
        print("\n No plots were generated. Ensure tools/runtime_overhead.csv has data.")
    else:
        print(f"\n Done! Generated {total_created} plot(s)")
        print(f"\n Plots are optimized for web display (1200x600px @ 100dpi)")


if __name__ == '__main__':
    main()
