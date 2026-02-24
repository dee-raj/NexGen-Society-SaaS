import pino from 'pino';
import { config } from './index';

export const logger = pino({
    level: config.LOG_LEVEL,
    transport:
        config.NODE_ENV === 'development'
            ? {
                target: 'pino-pretty',
                options: {
                    colorize: true,
                    translateTime: 'SYS:yyyy-mm-dd HH:MM:ss',
                    ignore: 'pid,hostname',
                },
            }
            : undefined, // Production: raw JSON for log aggregation (ELK, Datadog)
    base: { env: config.NODE_ENV },
    // Redact sensitive fields from logs
    redact: {
        paths: ['req.headers.authorization', 'req.body.password', 'req.body.refreshToken'],
        censor: '[REDACTED]',
    },
});
