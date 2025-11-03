import { z } from 'zod';
import { logger } from '../logger';
import { procedure } from '../trpcRoot';

const logEntry = z.object({
    level: z.literal('debug').or(z.literal('info')).or(z.literal('warn')).or(z.literal('error')),
    message: z.string(),
    data: z.any().optional(),
    component: z.string().optional(),
    timestamp: z.string().optional(),
});
export type LogEntry = z.infer<typeof logEntry>;

export const logs = () => {
    return procedure
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

        .mutation(({ input }) => {
            for (const entry of input.logs) {
                const { level, message, data, component, timestamp } = entry;
                const logData = {
                    data,
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
