import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

/**
 * Zod schema validates ALL environment variables at startup.
 * If any required var is missing or malformed, the process
 * crashes immediately with a clear error — no silent failures.
 */
const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.coerce.number().default(5000),
    API_PREFIX: z.string().default('/api/v1'),

    // MongoDB
    MONGODB_URI: z.string().url('MONGODB_URI must be a valid connection string'),

    // Redis
    REDIS_URL: z.string().default('redis://localhost:6379'),

    // JWT
    JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),
    JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
    JWT_ACCESS_EXPIRY: z.string().default('1d'),
    JWT_REFRESH_EXPIRY: z.string().default('30d'),

    // Rate Limiting
    RATE_LIMIT_WINDOW_MS: z.coerce.number().default(60_000),
    RATE_LIMIT_MAX: z.coerce.number().default(100),

    // CORS
    CORS_ORIGIN: z.string().default('http://localhost:3000'),

    // Frontend URL for links
    FRONTEND_URL: z.string().default('http://localhost:5173'),

    // Email (SMTP)
    SMTP_HOST: z.string().optional(),
    SMTP_PORT: z.coerce.number().optional(),
    SMTP_USER: z.string().optional(),
    SMTP_PASS: z.string().optional(),
    EMAIL_FROM: z.string().default('noreply@nexgensociety.com'),

    // Logging
    LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
    console.error('Invalid environment variables:');
    console.error(parsed.error.flatten().fieldErrors);
    process.exit(1);
}

export const config = Object.freeze(parsed.data);

export type Config = z.infer<typeof envSchema>;
