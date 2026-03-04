import { Request, Response } from 'express';
import { NoticesService } from './notices.service';
import { ApiResponse } from '@shared/utils/api-response';
import { asyncHandler } from '@shared/utils/async-handler';
import { BadRequestError, NotFoundError } from '@shared/utils/api-error';

/**
 * Notices controller — delegates all tenant scoping to NoticesService.
 *
 * Notice how NO controller method filters by societyId.
 * The tenantId comes from `req.tenantId` (set by tenantContext middleware)
 * and is passed to the service, which handles the rest.
 */
export class NoticesController {
    /**
     * GET /notices
     * Returns all notices for the authenticated user's tenant.
     */
    static getAll = asyncHandler(async (req: Request, res: Response): Promise<void> => {
        if (!req.tenantId) {
            throw new BadRequestError('Tenant context is required');
        }

        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;

        const { data, total } = await NoticesService.findAll(req.tenantId, {}, page, limit);
        ApiResponse.paginated(res, data, total, page, limit);
    });

    /**
     * GET /notices/:id
     * Returns a single notice by ID within the tenant.
     */
    static getById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
        if (!req.tenantId) {
            throw new BadRequestError('Tenant context is required');
        }

        const notice = await NoticesService.findById(req.tenantId, req.params.id as string);
        if (!notice) {
            // Return 404, not 403 — prevents ID enumeration
            throw new NotFoundError('Notice');
        }

        ApiResponse.success(res, notice);
    });

    /**
     * POST /notices
     * Creates a new notice within the tenant.
     */
    static create = asyncHandler(async (req: Request, res: Response): Promise<void> => {
        if (!req.tenantId || !req.user) {
            throw new BadRequestError('Tenant context and authentication required');
        }

        const notice = await NoticesService.createNotice(
            req.tenantId,
            req.body,
            req.user.userId,
        );

        ApiResponse.created(res, notice);
    });

    /**
     * PATCH /notices/:id
     * Updates a notice within the tenant.
     */
    static update = asyncHandler(async (req: Request, res: Response): Promise<void> => {
        if (!req.tenantId || !req.user) {
            throw new BadRequestError('Tenant context and authentication required');
        }

        const notice = await NoticesService.updateNotice(
            req.tenantId,
            req.params.id as string,
            req.body,
            req.user.userId,
        );

        if (!notice) {
            throw new NotFoundError('Notice');
        }

        ApiResponse.success(res, notice);
    });

    /**
     * DELETE /notices/:id
     * Deletes a notice within the tenant.
     */
    static delete = asyncHandler(async (req: Request, res: Response): Promise<void> => {
        if (!req.tenantId) {
            throw new BadRequestError('Tenant context is required');
        }

        const notice = await NoticesService.deleteById(req.tenantId, req.params.id as string);
        if (!notice) {
            throw new NotFoundError('Notice');
        }

        ApiResponse.success(res, { message: 'Notice deleted successfully' });
    });
}
