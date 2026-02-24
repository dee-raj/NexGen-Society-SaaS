import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { ApiError } from '../utils/api-error';
import { logger } from '../../config/logger';

/**
 * Global error boundary — MUST be the last middleware registered.
 *
 * Distinguishes between:
 * - Operational errors (ApiError): known, safe to return details to client
 * - Programming errors: unknown, logged with full stack, generic 500 to client
 */
export const errorHandler = (
    err: Error,
    req: Request,
    res: Response,
    _next: NextFunction,
): void => {
    // Operational error — safe to expose to client
    if (err instanceof ApiError) {
        logger.warn(
            {
                requestId: req.requestId,
                statusCode: err.statusCode,
                code: err.code,
                message: err.message,
                path: req.path,
                method: req.method,
            },
            'Operational error',
        );

        res.status(err.statusCode).json({
            success: false,
            error: {
                code: err.code,
                message: err.message,
                ...(err.details ? { details: err.details } : {}),
            },
            requestId: req.requestId,
        });
        return;
    }

    // Programming error — log full stack, return generic message
    logger.error(
        {
            requestId: req.requestId,
            err,
            path: req.path,
            method: req.method,
        },
        'Unhandled error',
    );

    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: {
            code: 'INTERNAL_ERROR',
            message: 'An unexpected error occurred',
        },
        requestId: req.requestId,
    });
};
