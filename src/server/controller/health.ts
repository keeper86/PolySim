import { z } from 'zod';
import { procedure } from '../trpcRoot';

export const health = () => {
    return procedure
        .meta({
            openapi: {
                method: 'GET',
                path: '/health',
                tags: ['PolySim'],
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
