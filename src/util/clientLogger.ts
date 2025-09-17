// A simple client-side logger that queues logs and sends them to the server
// periodically or on critical errors. Uses fetch with keepalive for reliability.
type LogLevel = 'debug' | 'log' | 'warn' | 'error' | 'info';
type LogEntry = {
    level: LogLevel;
    message: string;
    data?: unknown;
    component?: string;
    timestamp: number;
};

const config = {
    maxQueueSize: 100,
    flushInterval: 10000,
};

let queue: LogEntry[] = [];
let isSending = false;

if (typeof window !== 'undefined') {
    setInterval(flush, config.flushInterval);
    window.addEventListener('beforeunload', flushSync);
}

const log = (level: LogEntry['level'], message: string, data?: unknown, component?: string) => {
    const entry: LogEntry = {
        level,
        message,
        data,
        component,
        timestamp: Date.now(),
    };

    if (process.env.NODE_ENV !== 'production') {
        const consoleFn = console[level] || console.log;
        const prefix = component ? `[${component}]` : '[client]';
        console.log(`%c${prefix} %c${message}`);
        consoleFn(`${prefix} ${message}`, data || '');
    }

    queue.push(entry);

    if (queue.length > config.maxQueueSize) {
        queue.shift();
    }

    if (level === 'error') {
        flush();
    }
};

async function flush() {
    if (isSending || queue.length === 0) return;

    isSending = true;
    const entries = [...queue];
    queue = [];

    try {
        await fetch('/api/logs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ logs: entries }),
            keepalive: true,
        });
    } catch (error) {
        console.error('Failed to send logs:', error);
        queue = [...entries, ...queue].slice(0, config.maxQueueSize);
    } finally {
        isSending = false;
    }
}

function flushSync() {
    if (queue.length === 0) return;

    const entries = [...queue];
    try {
        const blob = new Blob([JSON.stringify({ logs: entries })], {
            type: 'application/json',
        });
        navigator.sendBeacon('/api/logs', blob);
    } catch (error) {
        console.error('Failed to send logs:', error);
    }
}

const createLogger = (component?: string) => {
    const logger = (level: LogLevel) => (message: string, data?: unknown) => log(level, message, data, component);

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
