'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { Page } from '@/components/client/Page';

export default function BenchmarksPage() {
    const [generatedDate, setGeneratedDate] = useState('');

    useEffect(() => {
        // Client-only date to avoid hydration mismatch
        setGeneratedDate(new Date().toLocaleDateString());
    }, []);

    return (
        <Page title='Benchmarks'>
            <div className='space-y-10'>
                <div className='text-lg text-slate-700 max-w-3xl'>
                    Scaling plots for I/O datasize overhead and CPU-only tracing overhead versus runtime.
                </div>

                <div className='bg-white rounded-lg shadow-lg overflow-hidden'>
                    <div className='p-6 bg-gradient-to-r from-slate-50 to-slate-50'>
                        <h2 className='text-2xl font-bold text-slate-900 mb-1'>I/O datasize vs overhead</h2>
                        <p className='text-slate-600 text-sm'>Scatter plot (log x-axis, linear y-axis)</p>
                    </div>
                    <div className='p-4'>
                        <Image
                            src='/benchmarks/scaling_io_datasize_vs_overhead.png'
                            alt='I/O datasize versus overhead'
                            width={1400}
                            height={700}
                            className='w-full h-auto'
                            priority
                            unoptimized
                        />
                    </div>
                    <div className='px-6 pb-6 text-sm text-slate-600'>
                        I/O datasize vs overhead: Shows tracing overhead (%) for different file sizes (1MB, 10MB, 50MB) across
                        varying total data volumes. Overhead patterns vary significantly by workload characteristics and syscall
                        density. Three distinct file-size categories reveal different metadata pressure and I/O handling costs.
                    </div>
                </div>

                <div className='bg-white rounded-lg shadow-lg overflow-hidden'>
                    <div className='p-6 bg-gradient-to-r from-slate-50 to-slate-50'>
                        <h2 className='text-2xl font-bold text-slate-900 mb-1'>CPU-only tracing vs runtime</h2>
                        <p className='text-slate-600 text-sm'>Log–log scatter with fit and 1/x reference</p>
                    </div>
                    <div className='p-4'>
                        <Image
                            src='/benchmarks/scaling_tracing_vs_runtime_cpu_only.png'
                            alt='CPU-only tracing overhead versus runtime'
                            width={1400}
                            height={700}
                            className='w-full h-auto'
                            priority={false}
                            unoptimized
                        />
                    </div>
                    <div className='px-6 pb-6 text-sm text-slate-600'>
                        CPU-only tracing vs runtime: demonstrates <strong>pure amortization</strong>—fixed tracing startup
                        cost (~constant) divided by increasing CPU runtime. During pure computation, no file syscalls occur,
                        so overhead stays constant in absolute terms but shrinks as %. Expected slope ≈ −1 in log-log space
                        (1/x relationship). Variability from scheduler effects and CPU cache behavior.
                    </div>
                </div>

                <div className='text-center text-xs text-slate-500'>
                    <p>Generated: {generatedDate || '—'} | Data: tools/polytrace/test/benchmarks/results.csv</p>
                </div>
            </div>
        </Page>
    );
}
