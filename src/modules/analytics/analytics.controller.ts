import { Request, Response } from 'express';
import { AnalyticsService } from './analytics.service';
import { ApiResponse } from '@shared/utils/api-response';
import { asyncHandler } from '@shared/utils/async-handler';
import { BadRequestError } from '@shared/utils/api-error';

/**
 * Analytics controller for platform/society metrics.
 */
export class AnalyticsController {
    /**
     * GET /analytics/platform-dashboard
     * Super Admin cross-tenant platform dashboard.
     */
    static getPlatformDashboard = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
        const dashboard = await AnalyticsService.getPlatformDashboard();
        ApiResponse.success(res, dashboard);
    });

    /**
     * GET /analytics/society-dashboard
     * Society Admin tenant-scoped dashboard.
     */
    static getSocietyDashboard = asyncHandler(async (req: Request, res: Response): Promise<void> => {
        if (!req.user?.societyId) {
            throw new BadRequestError('Society context required');
        }
        const dashboard = await AnalyticsService.getSocietyDashboard(req.user.societyId);
        ApiResponse.success(res, dashboard);
    });

    /**
     * GET /analytics/societies
     * Society counts broken down by status.
     */
    static getSocieties = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
        const data = await AnalyticsService.getSocietySummary();
        ApiResponse.success(res, data);
    });

    /**
     * GET /analytics/residents
     * Active resident count across all societies.
     */
    static getResidents = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
        const data = await AnalyticsService.getResidentSummary();
        ApiResponse.success(res, data);
    });

    /**
     * GET /analytics/outstanding-dues
     * Total unpaid/overdue invoice amounts platform-wide.
     */
    static getOutstandingDues = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
        const data = await AnalyticsService.getOutstandingDues();
        ApiResponse.success(res, data);
    });

    /**
     * GET /analytics/commission
     * Total commission revenue and procurement volume.
     */
    static getCommission = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
        const data = await AnalyticsService.getCommissionSummary();
        ApiResponse.success(res, data);
    });

    /**
     * GET /analytics/monthly-earnings
     * Commission revenue broken down by month.
     * Query param: ?months=12 (default 12)
     */
    static getMonthlyEarnings = asyncHandler(async (req: Request, res: Response): Promise<void> => {
        const months = parseInt(req.query.months as string) || 12;
        const data = await AnalyticsService.getMonthlyEarnings(months);
        ApiResponse.success(res, data);
    });

    /**
     * GET /analytics/vendor-performance
     * Top vendors by commission revenue.
     * Query param: ?limit=10 (default 10)
     */
    static getVendorPerformance = asyncHandler(async (req: Request, res: Response): Promise<void> => {
        const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);
        const data = await AnalyticsService.getVendorPerformance(limit);
        ApiResponse.success(res, data);
    });
}
