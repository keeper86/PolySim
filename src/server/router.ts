import { initTRPC, TRPCError } from '@trpc/server';
import { getServerSession } from 'next-auth';
import { type OpenApiMeta } from 'trpc-to-openapi';
import { authOptions } from '../app/api/auth/[...nextauth]/authOptions';
import { health } from './endpoints/health';
import { logs } from './endpoints/logs';
import { createProject } from './endpoints/projects';
import { getSkillsAssessment, saveSkillsAssessment } from './endpoints/skills-assessment';
import { testDbConnection } from './endpoints/test-connection';
import { getConversations, getMessages, sendMessage, createConversation } from './endpoints/messages';

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

export const protectedAppRouter = t.router({
    'test-connection': testDbConnection(protectedProcedure, '/test-connection'),
    'projects-create': createProject(protectedProcedure, '/projects-create'),
    'skills-assessment-get': getSkillsAssessment(protectedProcedure, '/skills-assessment-get'),
    'skills-assessment-save': saveSkillsAssessment(protectedProcedure, '/skills-assessment-save'),
    'conversations-get': getConversations(protectedProcedure, '/conversations-get'),
    'messages-get': getMessages(protectedProcedure, '/messages-get'),
    'messages-send': sendMessage(protectedProcedure, '/messages-send'),
    'conversations-create': createConversation(protectedProcedure, '/conversations-create'),
});

export const publicAppRouter = t.router({
    logs: logs(procedure, '/logs'),
    health: health(procedure, '/health'),
});

export const appRouter = t.mergeRouters(publicAppRouter, protectedAppRouter);

export type AppRouter = typeof appRouter;
