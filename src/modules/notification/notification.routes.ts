import { Router } from 'express';
import { NotificationController } from './notification.controller';
import { validate } from '@shared/middleware/validate';
import { authenticate } from '@shared/middleware/authenticate';
import { tenantContext } from '@shared/middleware/tenant-context';
import { authorize } from '@shared/middleware/authorize';
import { Role } from '@shared/utils/constants';
import {
    sendNotificationSchema,
    broadcastSchema,
    broadcastGlobalSchema,
    notificationIdParamSchema,
} from './notification.validator';

const router = Router();

// ── Authenticated + tenant-scoped routes ──────────────────
router.use(authenticate, tenantContext);

// ── Resident / Admin: read own notifications ──────────────
router.get('/', NotificationController.getMyNotifications);
router.get('/unread-count', NotificationController.getUnreadCount);
router.patch('/read-all', NotificationController.markAllRead);
router.patch(
    '/:id/read',
    validate(notificationIdParamSchema),
    NotificationController.markAsRead,
);

// ── Send to a specific user ───────────────────────────────
router.post(
    '/send',
    authorize(Role.SOCIETY_ADMIN, Role.SUPER_ADMIN),
    validate(sendNotificationSchema),
    NotificationController.send,
);

// ── Broadcast to entire society ───────────────────────────
router.post(
    '/broadcast',
    authorize(Role.SOCIETY_ADMIN),
    validate(broadcastSchema),
    NotificationController.broadcast,
);

// ── Global broadcast (Super Admin only) ──────────────────
// NOTE: tenantContext is still active but SUPER_ADMIN token
// may not carry societyId — the service reads directly from
// Society collection, bypassing tenant scoping.
router.post(
    '/broadcast-global',
    authorize(Role.SUPER_ADMIN),
    validate(broadcastGlobalSchema),
    NotificationController.broadcastGlobal,
);

export default router;
