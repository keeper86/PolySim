// A simple client-side logger that sends them to the server and shows toasts
import { trpcClient } from './clientTrpc';
import type { LogEntry } from '../server/endpoints/logs';

import { toast } from 'sonner';

type ToastType = 'error' | 'success' | 'info' | 'warning' | 'none';
type ToastOptions = {
    show: boolean;
    description?: string;
    duration?: number;
    action?: { label: string; onClick: () => void };
};

const createLogger = (component?: string) => {
    const logger =
        (level: LogEntry['level'], type: ToastType) =>
        (message: string, data?: unknown, toastOptions?: ToastOptions) => {
            if (toastOptions?.show ?? true) {
                const messageOfData =
                    data && typeof data === 'object' && 'message' in data && typeof data.message === 'string'
                        ? data.message
                        : undefined;

                if (type !== 'none') {
                    toast[type](message, {
                        description: toastOptions?.description || messageOfData,
                        duration: toastOptions?.duration,
                        action: toastOptions?.action,
                    });
                }
            }
            if (process.env.NODE_ENV === 'production' && level !== 'error') {
                return;
            }
            trpcClient.logs
                .mutate({
                    logs: [{ level, message, component, data, timestamp: new Date().toISOString() }],
                })
                .catch((error) => {
                    toast.error('Failed to send log to server', { description: error.message });
                });
        };

    return {
        debug: logger('debug', 'none'),
        info: logger('info', 'info'),
        warn: logger('warn', 'warning'),
        error: logger('error', 'error'),
        success: logger('info', 'success'),
    };
};

export const clientLogger = {
    ...createLogger(),
    child: (component: string) => createLogger(component),
};
