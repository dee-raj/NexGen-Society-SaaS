import { Request, Response } from 'express';
import { FlatService } from './flat.service';
import { ApiResponse } from '@shared/utils/api-response';
import { asyncHandler } from '@shared/utils/async-handler';
import { BadRequestError, NotFoundError } from '@shared/utils/api-error';

export class FlatController {
    static getAll = asyncHandler(async (req: Request, res: Response): Promise<void> => {
        if (!req.tenantId) throw new BadRequestError('Tenant context is required');
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const buildingId = req.query.buildingId as string | undefined;

        const filter: Record<string, unknown> = {};
        if (buildingId) filter.buildingId = buildingId;

        const { data, total } = await FlatService.findAll(req.tenantId, filter, page, limit);
        ApiResponse.paginated(res, data, total, page, limit);
    });

    static getById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
        if (!req.tenantId) throw new BadRequestError('Tenant context is required');
        const flat = await FlatService.findById(req.tenantId, req.params.id as string);
        if (!flat) throw new NotFoundError('Flat');
        ApiResponse.success(res, flat);
    });

    static create = asyncHandler(async (req: Request, res: Response): Promise<void> => {
        if (!req.tenantId || !req.user) throw new BadRequestError('Tenant context and authentication required');
        const flat = await FlatService.createFlat(req.tenantId, req.body, req.user.userId);
        ApiResponse.created(res, flat);
    });

    static update = asyncHandler(async (req: Request, res: Response): Promise<void> => {
        if (!req.tenantId || !req.user) throw new BadRequestError('Tenant context and authentication required');
        const flat = await FlatService.updateFlat(req.tenantId, req.params.id as string, req.body, req.user.userId);
        if (!flat) throw new NotFoundError('Flat');
        ApiResponse.success(res, flat);
    });

    static delete = asyncHandler(async (req: Request, res: Response): Promise<void> => {
        if (!req.tenantId) throw new BadRequestError('Tenant context is required');
        const flat = await FlatService.deleteById(req.tenantId, req.params.id as string);
        if (!flat) throw new NotFoundError('Flat');
        ApiResponse.success(res, { message: 'Flat deleted successfully' });
    });
}
