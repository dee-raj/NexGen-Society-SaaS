import { Society } from '@modules/society/society.model';
import { Resident } from '@modules/resident/resident.model';
import { Invoice } from '@modules/finance/finance.model';
import { CommissionRecord, Vendor } from '@modules/procurement/procurement.model';
import { SocietyRequest } from '@modules/society-request/society-request.model';
import { SocietyRequestStatus } from '@modules/society-request/society-request.types';
import { Staff } from '@modules/staff/staff.model';
import { Building } from '@modules/building/building.model';
import { Flat } from '@modules/flat/flat.model';
import { InvoiceStatus, ResidentStatus } from '@shared/utils/constants';
import {
    SocietySummary,
    RequestSummary,
    ResidentSummary,
    OutstandingDues,
    CommissionSummary,
    MonthlyEarning,
    SocietyGrowth,
    VendorPerformance,
    PlatformDashboard,
    SocietyDashboard,
} from './analytics.types';
import mongoose from 'mongoose';

/**
 * Analytics service — handles both platform-wide (Super Admin) 
 * and tenant-scoped (Society Admin) metrics.
 */
class AnalyticsServiceClass {

    // ── 1. Society summary ─────────────────────────────────

    async getSocietySummary(): Promise<SocietySummary> {
        const results = await Society.aggregate<{ _id: string; count: number }>([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                },
            },
        ]);

        const byStatus: Record<string, number> = {};
        let total = 0;

        for (const r of results) {
            byStatus[r._id] = r.count;
            total += r.count;
        }

        return { total, byStatus };
    }

    // ── 2. Request summary (Super Admin) ───────────────────

    async getRequestSummary(): Promise<RequestSummary> {
        const total = await SocietyRequest.countDocuments();
        const pending = await SocietyRequest.countDocuments({ status: SocietyRequestStatus.PENDING });
        const approved = await SocietyRequest.countDocuments({ status: SocietyRequestStatus.APPROVED });
        const rejected = await SocietyRequest.countDocuments({ status: SocietyRequestStatus.REJECTED });

        const now = new Date();
        const last7DaysDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const last30DaysDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        const last7Days = await SocietyRequest.countDocuments({ createdAt: { $gte: last7DaysDate } });
        const last30Days = await SocietyRequest.countDocuments({ createdAt: { $gte: last30DaysDate } });

        return { total, pending, approved, rejected, last7Days, last30Days };
    }

    // ── 3. Active residents count ──────────────────────────

    async getResidentSummary(): Promise<ResidentSummary> {
        const activeResidents = await Resident.countDocuments(
            { status: ResidentStatus.ACTIVE },
            { skipTenantCheck: true }
        );

        return { activeResidents };
    }

    // ── 4. Outstanding dues (global) ───────────────────────

    async getOutstandingDues(): Promise<OutstandingDues> {
        const result = await Invoice.aggregate<{
            totalOutstanding: number;
            invoiceCount: number;
        }>([
            {
                $match: {
                    status: {
                        $in: [InvoiceStatus.ISSUED, InvoiceStatus.OVERDUE],
                    },
                },
            },
            {
                $group: {
                    _id: null,
                    totalOutstanding: {
                        $sum: { $subtract: ['$totalAmount', '$amountPaid'] },
                    },
                    invoiceCount: { $sum: 1 },
                },
            },
            {
                $project: { _id: 0 },
            },
        ]).option({ skipTenantCheck: true });

        return result[0] ?? { totalOutstanding: 0, invoiceCount: 0 };
    }

    // ── 5. Commission revenue ──────────────────────────────

    async getCommissionSummary(): Promise<CommissionSummary> {
        const result = await CommissionRecord.aggregate<{
            totalCommissionRevenue: number;
            totalPOAmount: number;
            commissionCount: number;
        }>([
            {
                $group: {
                    _id: null,
                    totalCommissionRevenue: { $sum: '$commissionAmount' },
                    totalPOAmount: { $sum: '$poAmount' },
                    commissionCount: { $sum: 1 },
                },
            },
            {
                $project: { _id: 0 },
            },
        ]).option({ skipTenantCheck: true });

        return result[0] ?? {
            totalCommissionRevenue: 0,
            totalPOAmount: 0,
            commissionCount: 0,
        };
    }

    // ── 6. Monthly platform earnings ───────────────────────

    async getMonthlyEarnings(months = 12): Promise<MonthlyEarning[]> {
        const cutoff = new Date();
        cutoff.setMonth(cutoff.getMonth() - months);

        return CommissionRecord.aggregate<MonthlyEarning>([
            {
                $match: {
                    createdAt: { $gte: cutoff },
                },
            },
            {
                $group: {
                    _id: {
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' },
                    },
                    revenue: { $sum: '$commissionAmount' },
                    commissionCount: { $sum: 1 },
                },
            },
            {
                $project: {
                    _id: 0,
                    year: '$_id.year',
                    month: '$_id.month',
                    revenue: 1,
                    commissionCount: 1,
                },
            },
            {
                $sort: { year: 1, month: 1 },
            },
        ]).option({ skipTenantCheck: true });
    }

    // ── 7. Society growth summary ──────────────────────────

    async getSocietyGrowth(months = 6): Promise<SocietyGrowth[]> {
        const cutoff = new Date();
        cutoff.setMonth(cutoff.getMonth() - months);

        return Society.aggregate<SocietyGrowth>([
            {
                $match: {
                    createdAt: { $gte: cutoff },
                },
            },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
                    count: { $sum: 1 },
                },
            },
            {
                $project: {
                    _id: 0,
                    date: '$_id',
                    count: 1,
                },
            },
            { $sort: { date: 1 } },
        ]);
    }

    // ── 8. Vendor performance ──────────────────────────────

    async getVendorPerformance(limit = 10): Promise<VendorPerformance[]> {
        const commissionStats = await CommissionRecord.aggregate<{
            _id: string;
            totalCommission: number;
            totalPOAmount: number;
            poCount: number;
        }>([
            {
                $group: {
                    _id: '$vendorId',
                    totalCommission: { $sum: '$commissionAmount' },
                    totalPOAmount: { $sum: '$poAmount' },
                    poCount: { $sum: 1 },
                },
            },
            { $sort: { totalCommission: -1 } },
            { $limit: limit },
        ]).option({ skipTenantCheck: true });

        if (commissionStats.length === 0) return [];

        const vendorIds = commissionStats.map((s) => s._id);

        const vendors = await Vendor.find(
            { _id: { $in: vendorIds } },
            { _id: 1, name: 1, rating: 1 },
        ).lean();

        const vendorMap = new Map(
            vendors.map((v) => [(v._id as any).toString(), v]),
        );

        return commissionStats.map((stat) => {
            const vendor = vendorMap.get(stat._id.toString());
            return {
                vendorId: stat._id.toString(),
                vendorName: vendor?.name ?? 'Unknown',
                rating: vendor?.rating ?? 0,
                poCount: stat.poCount,
                totalPOValue: stat.totalPOAmount,
                totalCommission: stat.totalCommission,
            };
        });
    }

    // ── 9. Society Admin Dashboard ─────────────────────────

    /** 
     * Tenant-scoped dashboard data. 
     * tenantScopePlugin handles the { societyId } filtering if query is built correctly,
     * but here we use direct models for multi-faceted data.
     */
    async getSocietyDashboard(societyId: string): Promise<SocietyDashboard> {
        const sId = new mongoose.Types.ObjectId(societyId);

        const [
            totalResidents,
            totalStaff,
            totalBuildings,
            totalFlats,
            buildings,
            staffDistribution,
            occupancy,
        ] = await Promise.all([
            Resident.countDocuments({ status: ResidentStatus.ACTIVE }, { tenantId: sId }),
            Staff.countDocuments({}, { tenantId: sId }),
            Building.countDocuments({}, { tenantId: sId }),
            Flat.countDocuments({}, { tenantId: sId }),
            Building.aggregate([
                {
                    $lookup: {
                        from: 'residents',
                        localField: '_id',
                        foreignField: 'buildingId',
                        as: 'residents',
                    },
                },
                {
                    $lookup: {
                        from: 'flats',
                        localField: '_id',
                        foreignField: 'buildingId',
                        as: 'flats',
                    },
                },
                {
                    $project: {
                        buildingName: '$name',
                        residentCount: { $size: '$residents' },
                        flatCount: { $size: '$flats' },
                    },
                },
            ]).option({ tenantId: sId }),
            Staff.aggregate([
                {
                    $group: {
                        _id: '$department',
                        count: { $sum: 1 },
                    },
                },
                {
                    $project: {
                        _id: 0,
                        category: '$_id',
                        count: 1,
                    },
                },
            ]).option({ tenantId: sId }),
            Flat.aggregate([
                {
                    $group: {
                        _id: null,
                        occupied: { $sum: { $cond: ['$isOccupied', 1, 0] } },
                        vacant: { $sum: { $cond: ['$isOccupied', 0, 1] } },
                        total: { $sum: 1 },
                    },
                },
                { $project: { _id: 0 } },
            ]).option({ tenantId: sId }),
        ]);

        return {
            totalResidents,
            totalStaff,
            totalBuildings,
            totalFlats,
            buildings,
            staffDistribution,
            occupancy: occupancy[0] ?? { occupied: 0, vacant: 0, total: 0 },
        };
    }

    // ── Platform Dashboard (Super Admin) ───────────────────

    async getPlatformDashboard(): Promise<PlatformDashboard> {
        const [
            societies,
            requests,
            residents,
            outstandingDues,
            commission,
            monthlyEarnings,
            societyGrowth,
            topVendors,
        ] = await Promise.all([
            this.getSocietySummary(),
            this.getRequestSummary(),
            this.getResidentSummary(),
            this.getOutstandingDues(),
            this.getCommissionSummary(),
            this.getMonthlyEarnings(),
            this.getSocietyGrowth(),
            this.getVendorPerformance(),
        ]);

        return {
            societies,
            requests,
            residents,
            outstandingDues,
            commission,
            monthlyEarnings,
            societyGrowth,
            topVendors,
        };
    }
}

export const AnalyticsService = new AnalyticsServiceClass();
