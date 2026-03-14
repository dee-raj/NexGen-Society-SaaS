import { Router } from 'express';
import { SocietyRequestController } from './society-request.controller';
import {
    createSocietyRequestSchema,
    approveSocietyRequestSchema,
    rejectSocietyRequestSchema,
    getLogsSchema
} from './society-request.validator';
import { validate } from '@shared/middleware/validate';
import { authenticate, authorize } from '@shared/middleware/authenticate';
import { Role } from '@shared/utils/constants';

const router = Router();

/**
 * @route   POST /api/v1/society-requests
 * @desc    Submit a new society registration request
 * @access  Public
 */
router.post(
    '/',
    validate(createSocietyRequestSchema),
    SocietyRequestController.create,
);

/**
 * @route   GET /api/v1/society-requests
 * @desc    List all society requests
 * @access  Private (Super Admin)
 */
router.get(
    '/',
    authenticate,
    authorize([Role.SUPER_ADMIN]),
    SocietyRequestController.getAll,
);

/**
 * @route   GET /api/v1/society-requests/logs
 * @desc    List all approved society requests
 * @access  Private (Super Admin)
 */
router.get(
    '/logs',
    authenticate,
    authorize([Role.SUPER_ADMIN]),
    validate(getLogsSchema),
    SocietyRequestController.getLogs,
);

/**
 * @route   GET /api/v1/society-requests/:id
 * @desc    Get request by ID
 * @access  Private (Super Admin)
 */
router.get(
    '/:id',
    authenticate,
    authorize([Role.SUPER_ADMIN]),
    SocietyRequestController.getById,
);

/**
 * @route   POST /api/v1/society-requests/:id/approve
 * @desc    Approve a society request
 * @access  Private (Super Admin)
 */
router.post(
    '/:id/approve',
    authenticate,
    authorize([Role.SUPER_ADMIN]),
    validate(approveSocietyRequestSchema),
    SocietyRequestController.approve,
);

/**
 * @route   POST /api/v1/society-requests/:id/reject
 * @desc    Reject a society request
 * @access  Private (Super Admin)
 */
router.post(
    '/:id/reject',
    authenticate,
    authorize([Role.SUPER_ADMIN]),
    validate(rejectSocietyRequestSchema),
    SocietyRequestController.reject,
);

export const societyRequestRoutes = router;
