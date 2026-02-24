import { Request, Response, NextFunction } from 'express';
import { ForbiddenError, UnauthorizedError } from '../utils/api-error';
import { Role } from '../utils/constants';

/**
 * Role-based authorization middleware factory.
 * Must be placed AFTER authenticate middleware.
 *
 * Usage: router.get('/admin', authenticate, authorize('SUPER_ADMIN', 'SOCIETY_ADMIN'), handler)
 */
export const authorize = (...allowedRoles: Role[]) => {
    return (req: Request, _res: Response, next: NextFunction): void => {
        if (!req.user) {
            return next(new UnauthorizedError('Authentication required before authorization'));
        }

        if (!allowedRoles.includes(req.user.role)) {
            return next(
                new ForbiddenError(
                    `Role '${req.user.role}' is not authorized for this resource`,
                ),
            );
        }

        next();
    };
};
