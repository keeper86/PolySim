import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from './trpc';

export const trpc = createTRPCProxyClient<AppRouter>({
    links: [
        httpBatchLink({
            url: '/api/trpc',
        }),
    ],
});
