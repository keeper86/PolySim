
'use client';

import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import { Page } from '@/components/client/Page';

interface BenchmarkData {
  id: string;
  title: string;
  description: string;
  imageFile: string;
  stats: {
    postprocMean: number;
    postprocStdev: number;
    incrTracingMean: number;
    incrTracingStdev: number;
    nSamples: number;
  };
}
export default function BenchmarksPage() {
  const [benchmarks, setBenchmarks] = useState<BenchmarkData[]>([]);
  const [generatedDate, setGeneratedDate] = useState('');
  const [hasRuntimePlot, setHasRuntimePlot] = useState(false);

  useEffect(() => {
    // Load data from single source of truth
    fetch('/benchmarks/benchmarks.json')
      .then((r) => r.json())
      .then((data: BenchmarkData[]) => setBenchmarks(data))
      .catch(() => setBenchmarks([]));

    // Client-only date to avoid hydration mismatch
    setGeneratedDate(new Date().toLocaleDateString());
    // Check optional PoC plot presence
    fetch('/benchmarks/benchmark_runtime_overhead.png', { method: 'HEAD' })
      .then((res) => setHasRuntimePlot(res.ok))
      .catch(() => setHasRuntimePlot(false));
  }, []);

  const postprocMeanMin = useMemo(() =>
    benchmarks.length ? Math.min(...benchmarks.map(b => b.stats.postprocMean)) : 0
  , [benchmarks]);
  const postprocMeanMax = useMemo(() =>
    benchmarks.length ? Math.max(...benchmarks.map(b => b.stats.postprocMean)) : 0
  , [benchmarks]);
  const postprocStdevMax = useMemo(() =>
    benchmarks.length ? Math.max(...benchmarks.map(b => b.stats.postprocStdev)) : 0
  , [benchmarks]);
  const tracingMeanMin = useMemo(() =>
    benchmarks.length ? Math.min(...benchmarks.map(b => b.stats.incrTracingMean)) : 0
  , [benchmarks]);
  const tracingMeanMax = useMemo(() =>
    benchmarks.length ? Math.max(...benchmarks.map(b => b.stats.incrTracingMean)) : 0
  , [benchmarks]);

  return (
    <Page title="Performance Analysis: Provenance Tracer Impact">
      <div className="space-y-12">
        <div className="text-lg text-slate-700 max-w-3xl">
          This report evaluates the performance overhead of PolySim's file access tracing mechanism across diverse workloads.
          Key findings: <span className="font-semibold">post-processing overhead remains low (&lt;21%)</span>, but tracing overhead
          scales dramatically with metadata-heavy operations and small file access patterns.
        </div>

        {/* Key Findings (computed from dataset) */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
            <h2 className="text-xl font-bold text-green-900 mb-2">✓ Post-Processing Overhead</h2>
            <p className="text-slate-700">
              The cost of hashing, deduplication, and zipping traced data is consistently low across all scenarios:
              <span className="block font-mono text-sm mt-2">
                Mean: {postprocMeanMin.toFixed(0)}–{postprocMeanMax.toFixed(0)}% • Max: {postprocStdevMax.toFixed(0)}%
              </span>
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-orange-500">
            <h2 className="text-xl font-bold text-orange-900 mb-2">⚠ Tracing Overhead Scaling</h2>
            <p className="text-slate-700">
              Tracing adds runtime cost that scales with syscall volume. Small files trigger high overhead:
              <span className="block font-mono text-sm mt-2">
                Min: {tracingMeanMin.toFixed(0)}% • Max: {tracingMeanMax.toFixed(0)}%
              </span>
            </p>
          </div>
        </div>

        {/* Overview Plots */}
        <div className="space-y-8">
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="p-6 bg-gradient-to-r from-slate-50 to-slate-50">
              <h2 className="text-2xl font-bold text-slate-900 mb-2"> Side-by-Side Comparison</h2>
              <p className="text-slate-600">Direct comparison: Post-Processing vs Tracing overhead</p>
            </div>
            <div className="p-4">
              <Image
                src="/benchmarks/benchmark_comparison.png"
                alt="Benchmark Comparison"
                width={1400}
                height={700}
                className="w-full h-auto"
                priority
                unoptimized
              />
            </div>
          </div>
        </div>

        {/* PoC-Style Comparison (optional) */}
        {hasRuntimePlot && (
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="p-6 bg-gradient-to-r from-slate-50 to-slate-50">
              <h2 className="text-2xl font-bold text-slate-900 mb-2">📉 Overhead vs Runtime (PoC)</h2>
              <p className="text-slate-600">Log–log scatter with trend lines for little/much writing</p>
            </div>
            <div className="p-4">
              <Image
                src="/benchmarks/benchmark_runtime_overhead.png"
                alt="Overhead versus runtime"
                width={1200}
                height={600}
                className="w-full h-auto"
                unoptimized
              />
            </div>
          </div>
        )}

        {/* Benchmark Details */}
        <div className="space-y-12">
          {benchmarks.map((bench) => (
            <div
              key={bench.id}
              id={bench.id}
              className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
            >
              <div className="p-8">
                {/* Title & Description */}
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">{bench.title}</h2>
                  <p className="text-slate-600">{bench.description}</p>
                </div>

                {/* Stats Grid */}
                <div className="grid md:grid-cols-2 gap-4 mb-8 bg-slate-50 rounded-lg p-6">
                  <div>
                    <h3 className="font-semibold text-slate-800 mb-2">Post-Processing Overhead</h3>
                    <div className="text-sm text-slate-700 space-y-1">
                      <p>
                        <span className="font-mono bg-white px-2 py-1 rounded">
                          {bench.stats.postprocMean.toFixed(2)}% ± {bench.stats.postprocStdev.toFixed(2)}%
                        </span>
                      </p>
                      <p className="text-xs text-slate-500">
                        (Cost of dedup, hash, zipping)
                      </p>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-slate-800 mb-2">Tracing Overhead</h3>
                    <div className="text-sm text-slate-700 space-y-1">
                      <p>
                        <span className="font-mono bg-white px-2 py-1 rounded">
                          {bench.stats.incrTracingMean.toFixed(2)}% ± {bench.stats.incrTracingStdev.toFixed(2)}%
                        </span>
                      </p>
                      <p className="text-xs text-slate-500">
                        (Runtime increase: traced / untraced − 1)
                      </p>
                    </div>
                  </div>
                </div>

                {/* Plot */}
                <div className="relative w-full bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
                  <Image
                    src={bench.imageFile}
                    alt={bench.title}
                    width={1200}
                    height={600}
                    className="w-full h-auto"
                    priority={false}
                    unoptimized
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Conclusions */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Conclusions</h2>
          <ul className="space-y-3 text-slate-700">
            <li className="flex items-start">
              <span className="text-green-600 font-bold mr-3">✓</span>
              <span>
                <strong>Sustained I/O workloads</strong> (01, 05) show low overhead (~7–170%), acceptable for development and light production tracing.
              </span>
            </li>
            <li className="flex items-start">
              <span className="text-orange-600 font-bold mr-3">⚠</span>
              <span>
                <strong>Metadata-heavy operations</strong> (03: 1116%) exhibit extreme overhead. The tracer captures every `open`, `stat`, `create`, making syscall-dense workloads cost-prohibitive to trace.
              </span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 font-bold mr-3">ℹ</span>
              <span>
                <strong>Post-processing is not the bottleneck.</strong> The fixed cost of archiving and deduplication (1–21%) is negligible compared to tracing overhead that scales with syscall volume.
              </span>
            </li>
            <li className="flex items-start">
              <span className="text-slate-600 font-bold mr-3">→</span>
              <span>
                <strong>Recommendation:</strong> Use the tracer for development, testing, and selective production use (e.g., critical workflows). For high-frequency, syscall-dense operations, consider sampling or targeted tracing.
              </span>
            </li>
          </ul>
        </div>

        {/* Navigation */}
        <div className="flex flex-wrap gap-4">
          <a
            href="#01_long_run"
            className="px-4 py-2 bg-slate-200 text-slate-800 rounded hover:bg-slate-300 transition-colors text-sm"
          >
            → Long-Running
          </a>
          <a
            href="#02_io_heavy"
            className="px-4 py-2 bg-slate-200 text-slate-800 rounded hover:bg-slate-300 transition-colors text-sm"
          >
            → I/O Heavy
          </a>
          <a
            href="#03_many_small_files"
            className="px-4 py-2 bg-slate-200 text-slate-800 rounded hover:bg-slate-300 transition-colors text-sm"
          >
            → Many Small Files
          </a>
          <a
            href="#04_write_then_read"
            className="px-4 py-2 bg-slate-200 text-slate-800 rounded hover:bg-slate-300 transition-colors text-sm"
          >
            → Read-Write Pipeline
          </a>
          <a
            href="#05_mixed_phases"
            className="px-4 py-2 bg-slate-200 text-slate-800 rounded hover:bg-slate-300 transition-colors text-sm"
          >
            → Mixed Phases
          </a>
        </div>

        {/* Metadata */}
        <div className="text-center text-xs text-slate-500">
          <p>Generated: {generatedDate || '—'} | PolySim Benchmark Suite v1.0</p>
          {/* <p>Plots: Python matplotlib + gnuplot | Data: polytrace CLI</p> */}
        </div>
      </div>
    </Page>
  );
}
