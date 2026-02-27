import { Request, Response } from 'express';
import { SocietyService } from './society.service';
import { ApiResponse } from '../../shared/utils/api-response';
import { asyncHandler } from '../../shared/utils/async-handler';
import { BadRequestError, NotFoundError } from '../../shared/utils/api-error';

/**
 * Society controller — SUPER_ADMIN only.
 * Society is the tenant entity itself, so no tenant scoping needed.
 */
export class SocietyController {
    /** GET /societies */
    static getAll = asyncHandler(async (req: Request, res: Response): Promise<void> => {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const status = req.query.status as string | undefined;

        const filter: Record<string, unknown> = {};
        if (status) filter.status = status;

        const { data, total } = await SocietyService.findAll(filter, page, limit);
        ApiResponse.paginated(res, data, total, page, limit);
    });

    /** GET /societies/:id */
    static getById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
        const society = await SocietyService.findById(req.params.id as string);
        if (!society) {
            throw new NotFoundError('Society');
        }
        ApiResponse.success(res, society);
    });

    /** POST /societies */
    static create = asyncHandler(async (req: Request, res: Response): Promise<void> => {
        if (!req.user) {
            throw new BadRequestError('Authentication required');
        }
        const society = await SocietyService.create(req.body, req.user.userId);
        ApiResponse.created(res, society);
    });

    /** PATCH /societies/:id */
    static update = asyncHandler(async (req: Request, res: Response): Promise<void> => {
        if (!req.user) {
            throw new BadRequestError('Authentication required');
        }
        const society = await SocietyService.updateById(
            req.params.id as string,
            req.body,
            req.user.userId,
        );
        if (!society) {
            throw new NotFoundError('Society');
        }
        ApiResponse.success(res, society);
    });

    /** DELETE /societies/:id */
    static delete = asyncHandler(async (req: Request, res: Response): Promise<void> => {
        const society = await SocietyService.deleteById(req.params.id as string);
        if (!society) {
            throw new NotFoundError('Society');
        }
        ApiResponse.success(res, { message: 'Society deleted successfully' });
    });
}
