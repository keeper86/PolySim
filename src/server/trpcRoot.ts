import { initTRPC, TRPCError } from '@trpc/server';
import type { OpenApiMeta } from 'trpc-to-openapi';
import type { Context } from './trpcContext';

export const trpcRoot = initTRPC.meta<OpenApiMeta>().context<Context>().create();

// Basic procedure (no auth)
// Be careful when using this - prefer protectedProcedure where possible
export const procedure = trpcRoot.procedure;

const unauthorizedError = new TRPCError({
    code: 'UNAUTHORIZED',
    message: 'You must be logged in to access this resource or provide a valid PAT.',
});

// Protected procedure (requires user login)
// Ensures that the user is logged in via next-auth (not PAT)
export const protectedProcedure = trpcRoot.procedure.use(async ({ ctx, next }) => {
    const session = ctx.session;

    if (session?.type === 'next-auth' && session.user?.id) {
        return next();
    }

    if (session?.type === 'pat-auth') {
        throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'You must be personally logged in to access this resource. A PAT is not sufficient.',
        });
    }

    throw unauthorizedError;
});

// PAT-accessible procedure (requires either user login or PAT)
export const patAccessibleProcedure = trpcRoot.procedure.use(async ({ ctx, next }) => {
    if (ctx.session.user?.id) {
        return next();
    }

    throw unauthorizedError;
});

export type ProcedureBuilderType = typeof procedure | typeof protectedProcedure | typeof patAccessibleProcedure;

// Helper to get user ID from context
// throws if no user is logged in
export const getUserIdFromContext = (ctx: Context): string => {
    const session = ctx.session;
    if (session.user?.id) {
        return session.user.id;
    }
    throw unauthorizedError;
};
