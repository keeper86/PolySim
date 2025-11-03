'use client';

import { TRPCProvider } from '@/lib/trpc';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { Session } from 'next-auth';
import { SessionProvider } from 'next-auth/react';
import { useEffect } from 'react';
import { useLogger } from '../hooks/useLogger';
import type { AppRouter } from '@/server/router';
import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import { toast } from 'sonner';
import { observable } from '@trpc/server/observable';

const trpcClient = createTRPCProxyClient<AppRouter>({
    links: [
        () =>
            ({ next, op }) => {
                return observable((observer) => {
                    const subscription = next(op).subscribe({
                        next: (value) => observer.next?.(value),
                        error: (err) => {
                            const message =
                                err && typeof err === 'object' && 'message' in err
                                    ? (err as { message?: string }).message
                                    : 'An unknown error occurred';
                            toast.error('Network Error', { description: message });
                            observer.error?.(err);
                        },
                        complete: () => observer.complete?.(),
                    });
                    return () => subscription.unsubscribe();
                });
            },
        httpBatchLink({
            url: '/api/trpc',
        }),
    ],
});

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
