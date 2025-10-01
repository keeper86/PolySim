// A simple client-side logger that sends them to the server
import { trpcClient } from './clientTrpc';
import type { LogEntry } from '../server/endpoints/logs';

const createLogger = (component?: string) => {
    const logger = (level: LogEntry['level']) => (message: string, data?: unknown) => {
        trpcClient.logs
            .mutate({
                logs: [{ level, message, component, data, timestamp: new Date().toISOString() }],
            })
            .catch(() => {});
    };

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
