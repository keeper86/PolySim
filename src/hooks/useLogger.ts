// A simple client-side logger that sends them to the server and shows toasts
import { toast } from 'sonner';
import type { LogEntry } from '../server/controller/logs';

import { useTRPC } from '@/lib/trpc';
import { useMutation } from '@tanstack/react-query';
import { useCallback } from 'react';

type ToastType = 'error' | 'success' | 'info' | 'warning' | 'none';
type ToastOptions = {
    show: boolean;
    description?: string;
    duration?: number;
    action?: { label: string; onClick: () => void };
};

export function useLogger(component?: string) {
    const trpc = useTRPC();
    const logMutation = useMutation(trpc.logs.mutationOptions());

    const logger = useCallback(
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

                logMutation.mutate({
                    logs: [{ level, message, component, data, timestamp: new Date().toISOString() }],
                });
            },
        [component, logMutation],
    );

    return {
        debug: logger('debug', 'none'),
        info: logger('info', 'info'),
        warn: logger('warn', 'warning'),
        error: logger('error', 'error'),
        success: logger('info', 'success'),
    };
}

export type Logger = ReturnType<typeof useLogger>;
