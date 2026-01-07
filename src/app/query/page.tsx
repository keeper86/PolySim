'use client';

import { Page } from '@/components/client/Page';
import { useTRPC } from '@/lib/trpc';

export default function QueryPage() {
    const TRPC = useTRPC;
    return <Page title='Query Page'></Page>;
}
