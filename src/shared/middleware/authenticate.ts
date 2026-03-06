import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../../config';
import { UnauthorizedError } from '../utils/api-error';
import { Role } from '../utils/constants';

interface AccessTokenPayload {
    userId: string;
    societyId?: string;
    role: Role;
    email: string;
}

/**
 * Verifies the JWT access token from the Authorization header.
 * On success, attaches decoded user context to req.user.
 * SUPER_ADMIN users may not have a societyId.
 */
export const authenticate = (req: Request, _res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
        return next(new UnauthorizedError('Missing or malformed authorization header'));
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, config.JWT_ACCESS_SECRET) as AccessTokenPayload;

        req.user = {
            userId: decoded.userId,
            societyId: decoded.societyId,
            role: decoded.role,
            email: decoded.email,
        };

        next();
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            return next(new UnauthorizedError('Access token expired'));
        }
        return next(new UnauthorizedError('Invalid access token'));
    }
};

/**
 * Authorizes a request based on the user's role.
 * Must run AFTER authenticate middleware.
 */
export const authorize = (allowedRoles: Role[]) => {
    return (req: Request, _res: Response, next: NextFunction): void => {
        if (!req.user) {
            return next(new UnauthorizedError('Authentication required before authorization'));
        }

        if (!allowedRoles.includes(req.user.role)) {
            return next(new UnauthorizedError(`Role ${req.user.role} is not authorized to access this resource`));
        }

        next();
    };
};
