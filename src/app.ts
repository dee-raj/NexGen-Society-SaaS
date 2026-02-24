import express, { Application, Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import pinoHttp from 'pino-http';
import { config } from './config';
import { logger } from './config/logger';
import { requestId } from './shared/middleware/request-id';
import { globalRateLimiter } from './shared/middleware/rate-limit';
import { errorHandler } from './shared/middleware/error-handler';
import { StatusCodes } from 'http-status-codes';

const app: Application = express();

// ─── Security Middleware ──────────────────────────────────
app.use(helmet());
app.use(
    cors({
        origin: config.CORS_ORIGIN.split(',').map((o) => o.trim()),
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id', 'X-Tenant-Id'],
    }),
);

// ─── Body Parsing ─────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// ─── Request Tracing ──────────────────────────────────────
app.use(requestId);

// ─── HTTP Logging ─────────────────────────────────────────
app.use(
    pinoHttp({
        logger,
        customProps: (req: Request) => ({
            requestId: req.requestId,
        }),
        // Don't log health check noise
        autoLogging: {
            ignore: (req) => req.url === '/health',
        },
    }),
);

// ─── Rate Limiting ────────────────────────────────────────
app.use(globalRateLimiter);

// ─── Health Check (pre-auth, pre-routes) ──────────────────
app.get('/health', (_req: Request, res: Response) => {
    res.status(StatusCodes.OK).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
    });
});

// ─── API Routes ───────────────────────────────────────────
// Module routes will be registered here in subsequent phases:
// app.use(`${config.API_PREFIX}/auth`, authRoutes);
// app.use(`${config.API_PREFIX}/societies`, societyRoutes);
// etc.

// ─── 404 Catch-All ────────────────────────────────────────
app.use((_req: Request, res: Response) => {
    res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        error: {
            code: 'NOT_FOUND',
            message: 'The requested endpoint does not exist',
        },
    });
});

// ─── Global Error Handler (must be last) ──────────────────
app.use(errorHandler);

export default app;
