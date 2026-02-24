declare namespace NodeJS {
    interface ProcessEnv {
        NODE_ENV: 'development' | 'production' | 'test';
        PORT: string;
        API_PREFIX: string;
        MONGODB_URI: string;
        REDIS_URL: string;
        JWT_ACCESS_SECRET: string;
        JWT_REFRESH_SECRET: string;
        JWT_ACCESS_EXPIRY: string;
        JWT_REFRESH_EXPIRY: string;
        RATE_LIMIT_WINDOW_MS: string;
        RATE_LIMIT_MAX: string;
        CORS_ORIGIN: string;
        LOG_LEVEL: string;
    }
}
