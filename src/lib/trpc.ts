import { createTRPCContext } from '@trpc/tanstack-react-query';
import type { AppRouter } from '@/server/router';

import type { TRPCClientError } from '@trpc/client';
import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import { toast } from 'sonner';
import { observable } from '@trpc/server/observable';

function getErrorMessage(err: unknown): string {
    if (typeof err === 'string') {
        return err;
    }
    if (
        err &&
        typeof err === 'object' &&
        'message' in err &&
        typeof (err as { message?: unknown }).message === 'string'
    ) {
        try {
            const messageObject = JSON.parse(err.message as string);
            return getErrorMessage(messageObject);
        } catch {
            // ignore
        }

        return (err as { message?: unknown }).message as string;
    }
    if (Array.isArray(err)) {
        return err.map((e) => getErrorMessage(e)).join('; ');
    }
    try {
        return JSON.stringify(err);
    } catch {
        return String(err ?? 'Unknown error');
    }
}

const prettifyHTTPStatus = (code: string | undefined) => {
    if (!code) {
        return 'Unknown Error';
    }
    const codeStr = code;
    return `${codeStr
        .split(/[_\s]+/)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ')}`;
};

export const trpcClient = createTRPCProxyClient<AppRouter>({
    links: [
        () =>
            ({ next, op }) => {
                return observable((observer) => {
                    const subscription = next(op).subscribe({
                        next: (value) => observer.next?.(value),
                        error: (err: TRPCClientError<AppRouter>) => {
                            const message = getErrorMessage(err);
                            const status = err.data?.httpStatus ?? 'Unknown';
                            const title = `Network Error (${status}: ${prettifyHTTPStatus(err.data?.code)})`;
                            toast.error(title, {
                                description: message,
                            });
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

export const { TRPCProvider, useTRPC } = createTRPCContext<AppRouter>();
