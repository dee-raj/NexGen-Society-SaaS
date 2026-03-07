import { Router } from 'express';
import { AnalyticsController } from './analytics.controller';
import { authenticate } from '@shared/middleware/authenticate';
import { authorize } from '@shared/middleware/authorize';
import { Role } from '@shared/utils/constants';

const router = Router();

/**
 * Super Admin dashboard — cross-tenant metrics.
 */
router.get(
    '/platform-dashboard',
    authenticate,
    authorize(Role.SUPER_ADMIN),
    AnalyticsController.getPlatformDashboard
);

/**
 * Society Admin dashboard — tenant-scoped metrics.
 */
router.get(
    '/society-dashboard',
    authenticate,
    authorize(Role.SOCIETY_ADMIN),
    AnalyticsController.getSocietyDashboard
);

// ── Individual Super Admin metrics ───────────────────────────
router.get('/societies', authenticate, authorize(Role.SUPER_ADMIN), AnalyticsController.getSocieties);
router.get('/residents', authenticate, authorize(Role.SUPER_ADMIN), AnalyticsController.getResidents);
router.get('/outstanding-dues', authenticate, authorize(Role.SUPER_ADMIN), AnalyticsController.getOutstandingDues);
router.get('/commission', authenticate, authorize(Role.SUPER_ADMIN), AnalyticsController.getCommission);
router.get('/monthly-earnings', authenticate, authorize(Role.SUPER_ADMIN), AnalyticsController.getMonthlyEarnings);
router.get('/vendor-performance', authenticate, authorize(Role.SUPER_ADMIN), AnalyticsController.getVendorPerformance);

export default router;
