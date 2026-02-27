import { Request, Response } from 'express';
import { BuildingService } from './building.service';
import { ApiResponse } from '../../shared/utils/api-response';
import { asyncHandler } from '../../shared/utils/async-handler';
import { BadRequestError, NotFoundError } from '../../shared/utils/api-error';

export class BuildingController {
    static getAll = asyncHandler(async (req: Request, res: Response): Promise<void> => {
        if (!req.tenantId) throw new BadRequestError('Tenant context is required');
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const { data, total } = await BuildingService.findAll(req.tenantId, {}, page, limit);
        ApiResponse.paginated(res, data, total, page, limit);
    });

    static getById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
        if (!req.tenantId) throw new BadRequestError('Tenant context is required');
        const building = await BuildingService.findById(req.tenantId, req.params.id as string);
        if (!building) throw new NotFoundError('Building');
        ApiResponse.success(res, building);
    });

    static create = asyncHandler(async (req: Request, res: Response): Promise<void> => {
        if (!req.tenantId || !req.user) throw new BadRequestError('Tenant context and authentication required');
        const building = await BuildingService.createBuilding(req.tenantId, req.body, req.user.userId);
        ApiResponse.created(res, building);
    });

    static update = asyncHandler(async (req: Request, res: Response): Promise<void> => {
        if (!req.tenantId || !req.user) throw new BadRequestError('Tenant context and authentication required');
        const building = await BuildingService.updateBuilding(req.tenantId, req.params.id as string, req.body, req.user.userId);
        if (!building) throw new NotFoundError('Building');
        ApiResponse.success(res, building);
    });

    static delete = asyncHandler(async (req: Request, res: Response): Promise<void> => {
        if (!req.tenantId) throw new BadRequestError('Tenant context is required');
        const building = await BuildingService.deleteById(req.tenantId, req.params.id as string);
        if (!building) throw new NotFoundError('Building');
        ApiResponse.success(res, { message: 'Building deleted successfully' });
    });
}
