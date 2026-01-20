// typescript
// src/app/whatabout/page.tsx
import Link from 'next/link';
import type { Metadata } from 'next';
import { APP_ROUTES } from '@/lib/appRoutes';
import { Button } from '@/components/ui/button';
import { Brain } from 'lucide-react';
export const metadata: Metadata = {
    title: 'Whatabout — PolySim',
    description: 'Erläuterungen, Links und FAQs zum Whatabout‑Konzept im PolySim‑Projekt',
};

export default function WhatAboutPage() {
    return (
        <main className='prose mx-auto py-8 px-4'>
            <>
                <h1>
                    <strong>What we want to achieve:</strong>
                </h1>

                <p>
                    A (published) research artefact can be assigned a chain of metadata that clarifies how this artefact
                    came about. In the best case we have full information to easily reproduce results (even if that
                    would be unreasonable in case of too much compute involved). We want to encourage to make simulation
                    code that produced published results to be accessible.
                </p>

                <section>
                    <p>
                        As a researcher, I want to have a system that make it easy to organize simulation code and data
                        in a convenient way such that all data can be traced back to the version of code that produced
                        the result. It should be easier than managing some arbitrary folder structure.
                    </p>
                </section>

                <div className='w-full max-w-md space-y-4'>
                    <Link href={APP_ROUTES.whatabout.test.path}>
                        <Button className='w-full justify-start' variant='outline'>
                            <Brain className='w-4 h-4' />
                            Test
                        </Button>
                    </Link>
                </div>

                <footer>
                    <p className='text-sm text-muted-foreground'></p>
                </footer>
            </>
        </main>
    );
}
