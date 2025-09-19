import { z } from 'zod';
import { logger } from '../logger';
import { type TType } from '../router';

const logEntry = z
    .object({
        level: z.literal('debug').or(z.literal('info')).or(z.literal('warn')).or(z.literal('error')),
        message: z.string(),
        data: z.any().optional(),
        component: z.string().optional(),
        timestamp: z.string().optional(),
    })
    .meta({
        openapi: {
            // This `openapi` object is specific to the trpc-openapi adapter
            description: 'A single log entry from the client',
            example: {
                // Example can be added here for the entire object
                level: 'error',
                message: 'Failed to fetch user data',
                data: { userId: '123', errorCode: 'NETWORK_ERROR' },
                component: 'UserService',
                timestamp: '2023-11-15T10:30:00.000Z',
            },
        },
    });
export type LogEntry = z.infer<typeof logEntry>;

export const logs = (t: TType, path: `/${string}`) => {
    return t.procedure
        .input(
            z.object({
                logs: z.array(logEntry),
            }),
        )
        .output(
            z.object({
                success: z.boolean(),
            }),
        )
        .meta({
            openapi: {
                method: 'POST',
                path,
                tags: ['Logs'],
                summary: 'Receive client logs',
                description: 'Endpoint to receive and store client-side logs',
            },
        })
        .mutation(({ input }) => {
            for (const entry of input.logs) {
                const { level, message, data, component, timestamp } = entry;
                const logData = {
                    ...data,
                    component: component || 'client',
                    clientTimestamp: timestamp,
                };

                switch (level) {
                    case 'debug':
                        logger.debug(logData, message);
                        break;
                    case 'info':
                        logger.info(logData, message);
                        break;
                    case 'warn':
                        logger.warn(logData, message);
                        break;
                    case 'error':
                        logger.error(logData, message);
                        break;
                    default:
                        logger.info(logData, message);
                }
            }

            return { success: true };
        });
};
