import { z } from 'zod';
import { ProcedureBuilderType } from '../router';

export const health = (procedure: ProcedureBuilderType, path: `/${string}`) => {
    return procedure
        .meta({
            openapi: {
                method: 'GET',
                path,
                tags: ['Technical'],
                summary: 'Health Check',
                description: 'Simple health check endpoint to verify the server is running',
            },
        })
        .input(z.void())
        .output(
            z.object({
                status: z.literal('ok'),
            }),
        )
        .query(async () => {
            return { status: 'ok' };
        });
};
