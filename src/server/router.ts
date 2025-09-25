import { initTRPC, TRPCError } from '@trpc/server';
import { getServerSession } from 'next-auth';
import { type OpenApiMeta } from 'trpc-to-openapi';
import { authOptions } from '../app/api/auth/[...nextauth]/authOptions';
import { health } from './endpoints/health';
import { logs } from './endpoints/logs';
import { testDbConnection } from './endpoints/test-connection';

export async function createContext() {
    const session = await getServerSession(authOptions);
    return { session };
}
type Context = Awaited<ReturnType<typeof createContext>>;

const t = initTRPC.meta<OpenApiMeta>().context<Context>().create();
const procedure = t.procedure;
const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
    if (!ctx.session || !ctx.session.user) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'You must be logged in to access this resource' });
    }
    return next();
});
export type ProcedureBuilderType = typeof procedure | typeof protectedProcedure;

export const appRouter = t.router({
    'logs': logs(protectedProcedure, '/logs'),
    'test-connection': testDbConnection(protectedProcedure, '/test-connection'),
    'health': health(procedure, '/health'),
});

export type AppRouter = typeof appRouter;
