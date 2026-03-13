import http from 'http';
import app from './app';
import { config } from './config';
import { logger } from './config/logger';
import { connectDatabase, disconnectDatabase } from './config/database';
import { connectRedis, disconnectRedis } from './config/redis';

const server = http.createServer(app);

/**
 * Graceful shutdown sequence:
 * 1. Stop accepting new connections
 * 2. Wait for in-flight requests to complete (10s timeout)
 * 3. Close database and cache connections
 * 4. Exit process
 */
const gracefulShutdown = async (signal: string): Promise<void> => {
    logger.info(`${signal} received - starting graceful shutdown`);

    server.close(async () => {
        logger.info('HTTP server closed - no new connections');

        try {
            await disconnectDatabase();
            await disconnectRedis();
            logger.info('All connections closed - exiting');
            process.exit(0);
        } catch (error) {
            logger.error({ error }, 'Error during shutdown');
            process.exit(1);
        }
    });

    // Force exit if graceful shutdown takes too long
    setTimeout(() => {
        logger.error('Graceful shutdown timed out - forcing exit');
        process.exit(1);
    }, 10_000);
};

const bootstrap = async (): Promise<void> => {
    try {
        // Connect to data stores
        await connectDatabase();
        await connectRedis();

        // Start HTTP server
        server.listen(config.PORT, () => {
            logger.info(
                `Server running on port ${config.PORT} [${config.NODE_ENV}]`,
            );
            logger.info(`API prefix: ${config.API_PREFIX}`);
            logger.info(`Health: http://localhost:${config.PORT}/health`);
        });

        // Shutdown handlers
        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));

        // Catch unhandled errors at process level
        process.on('unhandledRejection', (reason) => {
            logger.fatal({ reason }, 'Unhandled Promise Rejection');
            gracefulShutdown('unhandledRejection');
        });

        process.on('uncaughtException', (error) => {
            logger.fatal({ error }, 'Uncaught Exception');
            gracefulShutdown('uncaughtException');
        });
    } catch (error) {
        logger.fatal({ error }, 'Bootstrap failed');
        process.exit(1);
    }
};

bootstrap();
