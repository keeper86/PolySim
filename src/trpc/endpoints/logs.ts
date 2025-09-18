import { z } from 'zod';
import { logger } from '../../util/logger';
import { TrpcEndpoint } from '../TrcpEndpoint';

const logEntry = z.object({
    level: z.literal('debug').or(z.literal('info')).or(z.literal('warn')).or(z.literal('error')),
    message: z.string(),
    data: z.any().optional(),
    component: z.string().optional(),
    timestamp: z.string().optional(),
});
export type LogEntry = z.infer<typeof logEntry>;

const zodType = z.object({
    logs: z.array(logEntry),
});
export type LogsParameter = z.infer<typeof zodType>;

const handler = (input: LogsParameter) => {
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
};
type HandlerReturn = ReturnType<typeof handler>;

export const logs: TrpcEndpoint<typeof zodType, HandlerReturn> = {
    handler,
    zodType,
};
