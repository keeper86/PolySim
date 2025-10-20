'use client';

import { TRPCProvider } from '@/lib/trpc';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect } from 'react';
import z from 'zod';
import { useLogger } from '../hooks/useLogger';
import { trpcClient } from '../lib/clientTrpc';

function makeQueryClient() {
    return new QueryClient({
        defaultOptions: {
            queries: {
                staleTime: 60 * 1000, // 1 minute
            },
        },
    });
}

let browserQueryClient: QueryClient | undefined;

function getQueryClient() {
    if (typeof window === 'undefined') {
        return makeQueryClient();
    }
    if (!browserQueryClient) {
        browserQueryClient = makeQueryClient();
    }
    return browserQueryClient;
}

const apiUrl =
    process.env.NODE_ENV !== 'test'
        ? z.url().parse(process.env.NEXT_PUBLIC_API_BASE_URL)
        : 'some-url-that-should-not-be-used-in-tests';
if (!apiUrl) {
    throw new Error('NEXT_PUBLIC_API_BASE_URL is not defined');
}

function AttachLogger({ queryClient }: { queryClient: QueryClient }) {
    const logger = useLogger('GlobalQueryErrors');

    useEffect(() => {
        const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
            if (event?.type === 'updated' && event.query.state.status === 'error') {
                logger.error(`Query with key ${JSON.stringify(event.query.queryKey)} failed`, event.query.state.error, {
                    show: true,
                });
            }
        });
        return unsubscribe;
    }, [queryClient, logger]);

    return null;
}

export default function AppProviders({ children }: { children: React.ReactNode }) {
    const queryClient = getQueryClient();

    return (
        <QueryClientProvider client={queryClient}>
            <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
                <AttachLogger queryClient={queryClient} />
                {children}
            </TRPCProvider>
        </QueryClientProvider>
    );
}
