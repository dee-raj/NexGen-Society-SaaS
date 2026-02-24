import { Request, Response, NextFunction } from 'express';
import { TenantMismatchError, UnauthorizedError } from '../utils/api-error';
import { Role } from '../utils/constants';

/**
 * Extracts and enforces tenant context from the authenticated user's JWT claims.
 * Must run AFTER authenticate middleware.
 *
 * Rules:
 * - SUPER_ADMIN can optionally scope to a tenant (via query/header) or operate globally
 * - SOCIETY_ADMIN and RESIDENT must have a societyId in their token
 * - If the request includes a societyId param, it must match the token's societyId
 */
export const tenantContext = (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
        return next(new UnauthorizedError('Authentication required before tenant resolution'));
    }

    // SUPER_ADMIN can operate cross-tenant
    if (req.user.role === Role.SUPER_ADMIN) {
        // Allow optional scoping via header or query param
        const requestedTenant =
            (req.headers['x-tenant-id'] as string) ||
            (req.query.societyId as string) ||
            req.user.societyId;

        req.tenantId = requestedTenant;
        return next();
    }

    // Non-super users MUST have a societyId in their token
    if (!req.user.societyId) {
        return next(new TenantMismatchError());
    }

    // If the route has a societyId param, it must match the user's tenant
    const paramSocietyId = req.params.societyId;
    if (paramSocietyId && paramSocietyId !== req.user.societyId) {
        return next(new TenantMismatchError());
    }

    req.tenantId = req.user.societyId;
    next();
};
