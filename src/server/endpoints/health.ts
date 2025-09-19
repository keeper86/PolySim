import { z } from 'zod';
import { TType } from '../router';

export const health = (t: TType, path: `/${string}`) => {
    return t.procedure
        .meta({
            openapi: {
                method: 'GET',
                path,
                tags: ['health-check'],
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
