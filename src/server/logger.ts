import type { Logger } from 'pino';
import pino from 'pino';

const getLoggerConfig = () => {
    const isProduction = process.env.NODE_ENV === 'production';

    return {
        level: process.env.LOG_LEVEL || (isProduction ? 'warn' : 'debug'),
        transport: !isProduction
            ? {
                  target: 'pino-pretty',
                  options: {
                      colorize: true,
                  },
              }
            : undefined,
    };
};

export const logger: Logger = pino(getLoggerConfig());
