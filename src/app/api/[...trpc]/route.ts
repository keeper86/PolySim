import { createOpenApiFetchHandler } from 'trpc-to-openapi';

import { appRouter, createContext } from '../../../server/router';

const handler = (req: Request) => {
    return createOpenApiFetchHandler({
        endpoint: '/api',
        router: appRouter,
        req,
        createContext,
    });
};

export {
    handler as GET,
    handler as POST,
    handler as PUT,
    handler as PATCH,
    handler as DELETE,
    handler as OPTIONS,
    handler as HEAD,
};
