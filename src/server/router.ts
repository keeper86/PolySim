import { initTRPC } from '@trpc/server';
import { type OpenApiMeta } from 'trpc-to-openapi';
import { logs } from './endpoints/logs';
import { testDbConnection } from './endpoints/test-connection';
import { health } from './endpoints/health';

const t = initTRPC.meta<OpenApiMeta>().create();
export type TType = typeof t;

export const appRouter = t.router({
    'logs': logs(t, '/logs'),
    'test-connection': testDbConnection(t, '/test-connection'),
    'health': health(t, '/health'),
});

export type AppRouter = typeof appRouter;
