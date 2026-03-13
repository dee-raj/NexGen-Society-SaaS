import pino from 'pino';
import { config } from './index';

const transport =
    config.NODE_ENV === "development"
        ? {
            target: "pino-pretty",
            options: {
                colorize: true,
                translateTime: "SYS:yyyy-mm-dd HH:MM:ss",
                ignore: "pid,hostname"
            }
        }
        : undefined;

export const logger = pino({
    level: config.LOG_LEVEL,
    timestamp: pino.stdTimeFunctions.isoTime,
    base: {
        env: config.NODE_ENV,
        service: 'nexgen-saas'
    },
    transport,
    redact: {
        paths: ['req.headers.authorization', 'req.body.password', 'req.body.refreshToken'],
        censor: '[REDACTED]',
    },
});
