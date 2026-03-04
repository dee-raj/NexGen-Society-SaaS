import { Router } from 'express';
import { NoticesController } from './notices.controller';
import { validate } from '@shared/middleware/validate';
import { authenticate } from '@shared/middleware/authenticate';
import { tenantContext } from '@shared/middleware/tenant-context';
import { authorize } from '@shared/middleware/authorize';
import { Role } from '@shared/utils/constants';
import {
    createNoticeSchema,
    updateNoticeSchema,
    noticeIdParamSchema,
} from './notices.validator';

const router = Router();

/**
 * All notice routes require: authenticate → tenantContext
 * This ensures every request has a verified tenantId before
 * hitting the controller/service layer.
 */
router.use(authenticate, tenantContext);

// ── Read routes (all authenticated tenant users) ─────────
router.get('/', NoticesController.getAll);
router.get('/:id', validate(noticeIdParamSchema), NoticesController.getById);

// ── Write routes (SOCIETY_ADMIN and SUPER_ADMIN only) ────
router.post(
    '/',
    authorize(Role.SOCIETY_ADMIN, Role.SUPER_ADMIN),
    validate(createNoticeSchema),
    NoticesController.create,
);

router.patch(
    '/:id',
    authorize(Role.SOCIETY_ADMIN, Role.SUPER_ADMIN),
    validate(updateNoticeSchema),
    NoticesController.update,
);

router.delete(
    '/:id',
    authorize(Role.SOCIETY_ADMIN, Role.SUPER_ADMIN),
    validate(noticeIdParamSchema),
    NoticesController.delete,
);

// ── Super Admin global broadcast ──────────────────────────
// Note: authenticate is already applied via router.use above.
// tenantContext is present but SUPER_ADMIN may have no societyId —
// the service queries Society directly using globalOptions.
router.post(
    '/broadcast',
    authorize(Role.SUPER_ADMIN),
    validate(createNoticeSchema),
    NoticesController.broadcastGlobal,
);

export default router;

