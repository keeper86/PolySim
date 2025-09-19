import { z } from 'zod';
import { db } from '../db';
import { TType } from '../router';

async function testConnection(): Promise<{
    success: boolean;
    time?: number;
    version?: string;
    error?: string;
}> {
    const start = Date.now();
    try {
        const result = await db.raw('SELECT version()');
        const end = Date.now();
        const time = end - start;
        const version = result.rows[0].version;
        return { success: true, time, version };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
}

export const testDbConnection = (t: TType, path: `/${string}`) => {
    return t.procedure
        .meta({
            openapi: {
                method: 'GET',
                path,
                tags: ['Database'],
                summary: 'Test Database Connection',
                description: 'Tests the connection to the PostgreSQL database and returns the status.',
            },
        })
        .input(z.void())
        .output(
            z.union([
                z.object({
                    message: z.string(),
                    time: z.number().optional(),
                    version: z.string().optional(),
                }),
                z.object({
                    error: z.string(),
                    details: z.string().optional(),
                }),
            ]),
        )
        .query(async () => {
            const result = await testConnection();
            if (result.success) {
                return {
                    message: 'Database connection successful',
                    time: result.time,
                    version: result.version,
                };
            } else {
                return {
                    error: 'Database connection failed',
                    details: result.error,
                };
            }
        });
};
