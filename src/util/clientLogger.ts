// A simple client-side logger that sends them to the server
import { trpc } from '../trpc/clientTrpc';
import type { LogEntry } from '../trpc/endpoints/logs';

const createLogger = (component?: string) => {
    const logger = (level: LogEntry['level']) => (message: string, data?: unknown) =>
        trpc.logs.mutate({
            logs: [{ level, message, component, data, timestamp: new Date().toISOString() }],
        });

    return {
        debug: logger('debug'),
        info: logger('info'),
        warn: logger('warn'),
        error: logger('error'),
    };
};

export const clientLogger = {
    ...createLogger(),
    child: (component: string) => createLogger(component),
};
