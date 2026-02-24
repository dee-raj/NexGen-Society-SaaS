import { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * Wraps async route handlers so thrown errors are
 * automatically forwarded to Express error middleware.
 * Without this, unhandled promise rejections silently hang.
 */
export const asyncHandler = (
    fn: (req: Request, res: Response, next: NextFunction) => Promise<void>,
): RequestHandler => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
