import { Request, Response } from 'express';
import { SocietyRequestService } from './society-request.service';
import { SocietyRequestStatus } from './society-request.types';
import { ApiResponse } from '@shared/utils/api-response';

class SocietyRequestControllerClass {
    /** Submit a new society registration request (Public) */
    async create(req: Request, res: Response) {
        const result = await SocietyRequestService.createRequest(req.body);
        ApiResponse.created(res, result);
    }

    /** List all requests (Super Admin) */
    async getAll(req: Request, res: Response) {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const status = req.query.status as SocietyRequestStatus;

        const filter: Record<string, any> = {};
        if (status) filter.status = status;

        const { data, total } = await SocietyRequestService.findAll(filter, page, limit);
        ApiResponse.paginated(res, data, total, page, limit);
    }

    /** Get single request details */
    async getById(req: Request, res: Response) {
        const { id } = req.params as { id: string };
        const result = await SocietyRequestService.findById(id);
        ApiResponse.success(res, result);
    }

    /** Approve request */
    async approve(req: Request, res: Response) {
        const { id } = req.params as { id: string };
        const result = await SocietyRequestService.approveRequest(id, req.user!.userId);
        ApiResponse.success(res, result);
    }

    /** Reject request */
    async reject(req: Request, res: Response) {
        const { id } = req.params as { id: string };
        const { reason } = req.body;
        const result = await SocietyRequestService.rejectRequest(id, reason);
        ApiResponse.success(res, result);
    }
}

export const SocietyRequestController = new SocietyRequestControllerClass();
