import mongoose from 'mongoose';
import { config } from './index';
import { logger } from './logger';

export const connectDatabase = async (): Promise<void> => {
    try {
        await mongoose.connect(config.MONGODB_URI, {
            // Connection pool: one pool shared by all tenants
            maxPoolSize: 50,
            minPoolSize: 5,
            // Timeout configs
            serverSelectionTimeoutMS: 5_000,
            socketTimeoutMS: 45_000,
            // Auto-create indexes in dev, disable in prod (use migration scripts)
            autoIndex: config.NODE_ENV !== 'production',
        });

        logger.info('MongoDB connected');

        mongoose.connection.on('error', (err) => {
            logger.error({ err }, 'MongoDB connection error');
        });

        mongoose.connection.on('disconnected', () => {
            logger.warn('MongoDB disconnected - attempting reconnect');
        });
    } catch (error) {
        logger.fatal({ error }, 'MongoDB initial connection failed');
        process.exit(1);
    }
};

export const disconnectDatabase = async (): Promise<void> => {
    await mongoose.disconnect();
    logger.info('MongoDB disconnected gracefully');
};
