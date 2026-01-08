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
        <Page title='Overhead Scaling vs Wall-Time'>
            <div className='space-y-10'>
                <div className='text-lg text-slate-700 max-w-3xl'>
                    Investigation of how overhead scales with wall-time. Expect 1/x behavior for post-processing; for
                    tracing, scaling depends on syscall intensity (I/O and metadata operations).
                </div>

                <div className='bg-white rounded-lg shadow-lg overflow-hidden'>
                    <div className='p-6 bg-gradient-to-r from-slate-50 to-slate-50'>
                        <h2 className='text-2xl font-bold text-slate-900 mb-1'>Post-processing vs runtime</h2>
                        <p className='text-slate-600 text-sm'>Log–log scatter with fit slope and 1/x reference</p>
                    </div>
                    <div className='p-4'>
                        <Image
                            src='/benchmarks/scaling_postproc_vs_runtime.png'
                            alt='Post-processing overhead versus runtime'
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
                        <h2 className='text-2xl font-bold text-slate-900 mb-1'>Tracing vs runtime</h2>
                        <p className='text-slate-600 text-sm'>
                            Log–log scatter by writing-level with fits and 1/x reference
                        </p>
                    </div>
                    <div className='p-4'>
                        <Image
                            src='/benchmarks/scaling_tracing_vs_runtime.png'
                            alt='Tracing overhead versus runtime'
                            width={1400}
                            height={700}
                            className='w-full h-auto'
                            priority={false}
                            unoptimized
                        />
                    </div>
                </div>

                <div className='text-center text-xs text-slate-500'>
                    <p>Generated: {generatedDate || '—'} | Data: tools/runtime_overhead.csv</p>
                </div>
            </div>
        </Page>
    );
}
