import { z } from 'zod';
import { db } from '../db';
import { ProcedureBuilderType } from '../router';
import { TRPCError } from '@trpc/server';

export const testDbConnection = (procedure: ProcedureBuilderType, path: `/${string}`) => {
    return procedure
        .meta({
            openapi: {
                method: 'GET',
                path,
                tags: ['Technical'],
                summary: 'Test Database Connection',
                description: 'Tests the connection to the PostgreSQL database and returns the status.',
                protect: true,
            },
        })
        .input(z.void())
        .output(
            z.object({
                message: z.string(),
                time: z.number().optional(),
                version: z.string().optional(),
            }),
        )
        .query(async () => {
            const start = Date.now();
            try {
                const result = await db.raw('SELECT version()');
                const end = Date.now();
                const time = end - start;
                const version = result.rows[0].version;
                return { time, version, message: 'Database connection successful' };
            } catch (error) {
                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: error instanceof Error ? error.message : String(error),
                });
            }
        });
};
