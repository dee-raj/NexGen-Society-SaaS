import { Router } from 'express';
import { AnalyticsController } from './analytics.controller';
import { authenticate } from '@shared/middleware/authenticate';
import { authorize } from '@shared/middleware/authorize';
import { Role } from '@shared/utils/constants';

const router = Router();

/**
 * All analytics routes: authenticate → authorize(SUPER_ADMIN).
 * No tenantContext middleware — these are cross-tenant queries.
 */
router.use(authenticate, authorize(Role.SUPER_ADMIN));

// ── Full dashboard (all metrics in one round-trip) ────────
router.get('/dashboard', AnalyticsController.getDashboard);

// ── Individual metric endpoints ───────────────────────────
router.get('/societies', AnalyticsController.getSocieties);
router.get('/residents', AnalyticsController.getResidents);
router.get('/outstanding-dues', AnalyticsController.getOutstandingDues);
router.get('/commission', AnalyticsController.getCommission);
router.get('/monthly-earnings', AnalyticsController.getMonthlyEarnings);
router.get('/vendor-performance', AnalyticsController.getVendorPerformance);

export default router;
