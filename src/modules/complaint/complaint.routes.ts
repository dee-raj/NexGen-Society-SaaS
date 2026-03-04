import { Router } from 'express';
import { ComplaintController } from './complaint.controller';
import {
    createComplaintSchema,
    transitionStatusSchema,
    addRatingSchema,
    complaintIdParamSchema,
} from './complaint.validation';
import { validate } from '@shared/middleware/validate';
import { Role } from '@shared/utils/constants';
import { authenticate } from '@shared/middleware/authenticate';
import { authorize } from '@shared/middleware/authorize';

const router = Router();

// All complaint routes require authentication
router.use(authenticate);

// ── Create complaint (Resident or Society Admin) ────────────

router.post(
    '/',
    authorize(Role.RESIDENT, Role.SOCIETY_ADMIN),
    validate(createComplaintSchema),
    ComplaintController.create,
);

// ── List complaints ─────────────────────────────────────────
// Residents see only their own; Admins see all

router.get(
    '/',
    authorize(Role.RESIDENT, Role.SOCIETY_ADMIN, Role.SUPER_ADMIN),
    ComplaintController.getAll,
);

// ── Get single complaint ────────────────────────────────────

router.get(
    '/:id',
    authorize(Role.RESIDENT, Role.SOCIETY_ADMIN, Role.SUPER_ADMIN),
    validate(complaintIdParamSchema),
    ComplaintController.getOne,
);

// ── Transition status ───────────────────────────────────────
// Role validation is handled in the service layer (state machine)

router.patch(
    '/:id/status',
    authorize(Role.RESIDENT, Role.SOCIETY_ADMIN, Role.SUPER_ADMIN),
    validate(transitionStatusSchema),
    ComplaintController.transitionStatus,
);

// ── Add rating (Resident only — reporter) ───────────────────

router.post(
    '/:id/rating',
    authorize(Role.RESIDENT),
    validate(addRatingSchema),
    ComplaintController.addRating,
);

// ── Activity log (Admins only) ──────────────────────────────

router.get(
    '/:id/activity',
    authorize(Role.SOCIETY_ADMIN, Role.SUPER_ADMIN),
    validate(complaintIdParamSchema),
    ComplaintController.getActivityLog,
);

export default router;
