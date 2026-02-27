import { Request, Response } from 'express';
import { ResidentService } from './resident.service';
import { ApiResponse } from '../../shared/utils/api-response';
import { asyncHandler } from '../../shared/utils/async-handler';
import { BadRequestError, NotFoundError } from '../../shared/utils/api-error';

export class ResidentController {
    static getAll = asyncHandler(async (req: Request, res: Response): Promise<void> => {
        if (!req.tenantId) throw new BadRequestError('Tenant context is required');
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const flatId = req.query.flatId as string | undefined;
        const status = req.query.status as string | undefined;

        const filter: Record<string, unknown> = {};
        if (flatId) filter.flatId = flatId;
        if (status) filter.status = status;

        const { data, total } = await ResidentService.findAll(req.tenantId, filter, page, limit);
        ApiResponse.paginated(res, data, total, page, limit);
    });

    static getById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
        if (!req.tenantId) throw new BadRequestError('Tenant context is required');
        const resident = await ResidentService.findById(req.tenantId, req.params.id as string);
        if (!resident) throw new NotFoundError('Resident');
        ApiResponse.success(res, resident);
    });

    static create = asyncHandler(async (req: Request, res: Response): Promise<void> => {
        if (!req.tenantId || !req.user) throw new BadRequestError('Tenant context and authentication required');
        const resident = await ResidentService.createResident(req.tenantId, req.body, req.user.userId);
        ApiResponse.created(res, resident);
    });

    static update = asyncHandler(async (req: Request, res: Response): Promise<void> => {
        if (!req.tenantId || !req.user) throw new BadRequestError('Tenant context and authentication required');
        const resident = await ResidentService.updateResident(req.tenantId, req.params.id as string, req.body, req.user.userId);
        if (!resident) throw new NotFoundError('Resident');
        ApiResponse.success(res, resident);
    });

    static delete = asyncHandler(async (req: Request, res: Response): Promise<void> => {
        if (!req.tenantId) throw new BadRequestError('Tenant context is required');
        const resident = await ResidentService.deleteById(req.tenantId, req.params.id as string);
        if (!resident) throw new NotFoundError('Resident');
        ApiResponse.success(res, { message: 'Resident deleted successfully' });
    });
}
