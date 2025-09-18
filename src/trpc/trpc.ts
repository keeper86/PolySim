import { initTRPC } from '@trpc/server';
import { logs } from './endpoints/logs';

const t = initTRPC.create();

const endpoints = { logs };

const endpointsWithProcedures = Object.fromEntries(
    Object.entries(endpoints).map(([key, route]) => [
        key,
        t.procedure.input(route.zodType).mutation(async ({ input }) => route.handler(input)),
    ]),
);

export const appRouter = t.router(endpointsWithProcedures);

export type AppRouter = typeof appRouter;
