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
                    Log–log scaling plots for I/O datasize overhead and CPU-only tracing overhead versus runtime.
                </div>
                <div className='text-sm text-slate-600 max-w-3xl'>
                    Both plots demonstrate negative scaling exponents, meaning overhead decreases as total data size
                    increases. Smaller file sizes exhibit stronger scaling (steeper negative slopes), while larger file
                    configurations show weaker but still negative trends. The high variability in overhead percentages
                    reflects the inherent costs of syscall tracing across diverse I/O patterns.
                </div>

                <div className='bg-white rounded-lg shadow-lg overflow-hidden'>
                    <div className='p-6 bg-gradient-to-r from-slate-50 to-slate-50'>
                        <h2 className='text-2xl font-bold text-slate-900 mb-1'>I/O datasize vs overhead</h2>
                        <p className='text-slate-600 text-sm'>Log–log scatter with fit</p>
                    </div>
                    <div className='p-4'>
                        <Image
                            src='/benchmarks/scaling_io_datasize_vs_overhead_loglog.png'
                            alt='I/O datasize versus overhead (log-log)'
                            width={1400}
                            height={700}
                            className='w-full h-auto'
                            priority
                            unoptimized
                        />
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
                </div>

                <div className='text-center text-xs text-slate-500'>
                    <p>Generated: {generatedDate || '—'} | Data: tools/polytrace/test/benchmarks/results.csv</p>
                </div>
            </div>
        </Page>
    );
}
