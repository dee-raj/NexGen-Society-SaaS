import { Request, Response } from 'express';
import { NotificationService } from './notification.service';
import { ApiResponse } from '@shared/utils/api-response';
import { asyncHandler } from '@shared/utils/async-handler';
import { BadRequestError, NotFoundError } from '@shared/utils/api-error';

export class NotificationController {
    /**
     * GET /notifications
     * Returns paginated notifications for the authenticated user.
     */
    static getMyNotifications = asyncHandler(async (req: Request, res: Response): Promise<void> => {
        if (!req.tenantId || !req.user) {
            throw new BadRequestError('Authentication and tenant context required');
        }

        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;

        const { data, total } = await NotificationService.getForUser(
            req.tenantId,
            req.user.userId,
            page,
            limit,
        );

        ApiResponse.paginated(res, data, total, page, limit);
    });

    /**
     * GET /notifications/unread-count
     * Returns the number of unread notifications for the authenticated user.
     */
    static getUnreadCount = asyncHandler(async (req: Request, res: Response): Promise<void> => {
        if (!req.tenantId || !req.user) {
            throw new BadRequestError('Authentication and tenant context required');
        }

        const count = await NotificationService.getUnreadCount(req.tenantId, req.user.userId);
        ApiResponse.success(res, { unreadCount: count });
    });

    /**
     * PATCH /notifications/:id/read
     * Marks a single notification as read (must belong to the authenticated user).
     */
    static markAsRead = asyncHandler(async (req: Request, res: Response): Promise<void> => {
        if (!req.tenantId || !req.user) {
            throw new BadRequestError('Authentication and tenant context required');
        }

        const notification = await NotificationService.markAsRead(
            req.tenantId,
            req.user.userId,
            req.params.id as string,
        );

        if (!notification) {
            throw new NotFoundError('Notification');
        }

        ApiResponse.success(res, notification);
    });

    /**
     * PATCH /notifications/read-all
     * Marks all notifications as read for the authenticated user.
     */
    static markAllRead = asyncHandler(async (req: Request, res: Response): Promise<void> => {
        if (!req.tenantId || !req.user) {
            throw new BadRequestError('Authentication and tenant context required');
        }

        const result = await NotificationService.markAllRead(req.tenantId, req.user.userId);
        ApiResponse.success(res, result);
    });

    /**
     * POST /notifications/send
     * Send a notification to a specific user. SOCIETY_ADMIN / SUPER_ADMIN only.
     */
    static send = asyncHandler(async (req: Request, res: Response): Promise<void> => {
        if (!req.tenantId) {
            throw new BadRequestError('Tenant context required');
        }

        const notification = await NotificationService.sendToUser(req.tenantId, req.body);
        ApiResponse.created(res, notification);
    });

    /**
     * POST /notifications/broadcast
     * Fan-out to all active residents of the authenticated tenant.
     * SOCIETY_ADMIN only.
     */
    static broadcast = asyncHandler(async (req: Request, res: Response): Promise<void> => {
        if (!req.tenantId) {
            throw new BadRequestError('Tenant context required');
        }

        const result = await NotificationService.broadcastToSociety(req.tenantId, req.body);
        ApiResponse.created(res, result);
    });

    /**
     * POST /notifications/broadcast-global
     * Fan-out to ALL active residents across ALL active societies.
     * SUPER_ADMIN only — no tenant context required.
     */
    static broadcastGlobal = asyncHandler(async (req: Request, res: Response): Promise<void> => {
        const result = await NotificationService.broadcastGlobal(req.body);
        ApiResponse.created(res, result);
    });
}
