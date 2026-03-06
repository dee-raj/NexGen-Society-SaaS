import { Request, Response } from 'express';
import { StaffService } from './staff.service';
import { ApiResponse } from '@shared/utils/api-response';
import { asyncHandler } from '@shared/utils/async-handler';
import { BadRequestError, NotFoundError } from '@shared/utils/api-error';

export class StaffController {
    static getAll = asyncHandler(async (req: Request, res: Response): Promise<void> => {
        if (req.tenantId === undefined) throw new BadRequestError('Tenant context is required');
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const department = req.query.department as string | undefined;
        const status = req.query.status as string | undefined;

        const filter: Record<string, unknown> = {};
        if (department) filter.department = department;
        if (status) filter.status = status;

        const { data, total } = await StaffService.findAll(req.tenantId, filter, page, limit);
        ApiResponse.paginated(res, data, total, page, limit);
    });

    static getById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
        if (req.tenantId === undefined) throw new BadRequestError('Tenant context is required');
        const staff = await StaffService.findById(req.tenantId, req.params.id as string);
        if (!staff) throw new NotFoundError('Staff');
        ApiResponse.success(res, staff);
    });

    static create = asyncHandler(async (req: Request, res: Response): Promise<void> => {
        if (req.tenantId === undefined || !req.user) throw new BadRequestError('Tenant context and authentication required');
        const staff = await StaffService.createStaff(req.tenantId, req.body, req.user.userId);
        ApiResponse.created(res, staff);
    });

    static update = asyncHandler(async (req: Request, res: Response): Promise<void> => {
        if (req.tenantId === undefined || !req.user) throw new BadRequestError('Tenant context and authentication required');
        const staff = await StaffService.updateStaff(req.tenantId, req.params.id as string, req.body, req.user.userId);
        if (!staff) throw new NotFoundError('Staff');
        ApiResponse.success(res, staff);
    });

    static delete = asyncHandler(async (req: Request, res: Response): Promise<void> => {
        if (req.tenantId === undefined) throw new BadRequestError('Tenant context is required');
        const staff = await StaffService.deleteById(req.tenantId, req.params.id as string);
        if (!staff) throw new NotFoundError('Staff');
        ApiResponse.success(res, { message: 'Staff deleted successfully' });
    });
}
