import { Redis } from 'ioredis';
import { config } from './index';
import { logger } from './logger';

export const redis = new Redis(config.REDIS_URL, {
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
        const delay = Math.min(times * 200, 2_000);
        return delay;
    },
    lazyConnect: true, // Don't connect until first command or explicit .connect()
});

redis.on('connect', () => logger.info('Redis connected'));
redis.on('error', (err) => logger.error({ err }, 'Redis connection error'));
redis.on('close', () => logger.warn('Redis connection closed'));

export const connectRedis = async (): Promise<void> => {
    try {
        await redis.connect();
    } catch (error) {
        logger.error({ error }, 'Redis connection failed - app will run without cache');
        // Non-fatal: app can degrade gracefully without Redis for non-auth flows
    }
};

export const disconnectRedis = async (): Promise<void> => {
    await redis.quit();
    logger.info('Redis disconnected gracefully');
};
