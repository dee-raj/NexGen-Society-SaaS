import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

/**
 * Assigns a unique correlation ID to every request.
 * Carried through logs, error responses, and downstream services
 * for end-to-end request tracing.
 */
export const requestId = (req: Request, _res: Response, next: NextFunction): void => {
    req.requestId = (req.headers['x-request-id'] as string) || uuidv4();
    next();
};
