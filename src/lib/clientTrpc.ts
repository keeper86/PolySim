import { type TRPCLink, createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import { observable } from '@trpc/server/observable';

import { toast } from 'sonner';
import type { AppRouter } from '../server/router';

const errorLink: TRPCLink<AppRouter> =
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
    };

export const trpcClient = createTRPCProxyClient<AppRouter>({
    links: [
        errorLink,
        httpBatchLink({
            url: '/api/trpc',
        }),
    ],
});
