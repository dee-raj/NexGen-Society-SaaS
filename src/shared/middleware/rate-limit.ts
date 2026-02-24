import rateLimit from 'express-rate-limit';
import { config } from '../../config';

/**
 * Global rate limiter — applied to all routes.
 * Per-route overrides (e.g., stricter on /auth/login) are
 * applied at the route level.
 */
export const globalRateLimiter = rateLimit({
    windowMs: config.RATE_LIMIT_WINDOW_MS,
    max: config.RATE_LIMIT_MAX,
    standardHeaders: true,  // Return RateLimit-* headers
    legacyHeaders: false,   // Disable X-RateLimit-* headers
    message: {
        success: false,
        error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many requests — please try again later',
        },
    },
});

/** Strict limiter for auth endpoints: 5 attempts per minute */
export const authRateLimiter = rateLimit({
    windowMs: 60_000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many login attempts — please try again in a minute',
        },
    },
});
