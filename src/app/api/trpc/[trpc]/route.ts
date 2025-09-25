import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter, createContext } from '../../../../server/router';

const handler = (req: Request) =>
    fetchRequestHandler({
        endpoint: '/api/trpc',
        req,
        router: appRouter,
        createContext,
    });

export { handler as DELETE, handler as GET, handler as POST, handler as PUT };
