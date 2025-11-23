'use client';

import { trpcClient, TRPCProvider } from '@/lib/trpc';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { Session } from 'next-auth';
import { SessionProvider } from 'next-auth/react';
import { useEffect } from 'react';
import { useLogger } from '../hooks/useLogger';

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

function AttachLoggerToQueryClient({ queryClient }: { queryClient: QueryClient }) {
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

export default function AppProviders({ children, session }: { children: React.ReactNode; session: Session | null }) {
    const queryClient = getQueryClient();

    return (
        <QueryClientProvider client={queryClient}>
            <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
                <AttachLoggerToQueryClient queryClient={queryClient} />
                <SessionProvider session={session}>{children}</SessionProvider>
            </TRPCProvider>
        </QueryClientProvider>
    );
}
