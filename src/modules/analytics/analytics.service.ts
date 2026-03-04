import { Society } from '@modules/society/society.model';
import { Resident } from '@modules/resident/resident.model';
import { Invoice } from '@modules/finance/finance.model';
import { CommissionRecord, PurchaseOrder, Vendor } from '@modules/procurement/procurement.model';
import { InvoiceStatus, ResidentStatus } from '@shared/utils/constants';
import {
    SocietySummary,
    ResidentSummary,
    OutstandingDues,
    CommissionSummary,
    MonthlyEarning,
    VendorPerformance,
    PlatformDashboard,
} from './analytics.types';

/**
 * Super Admin analytics service — all queries are cross-tenant.
 *
 * Every aggregation runs directly on the Mongoose model without
 * the tenantScopePlugin filter (no { tenantId } option is passed).
 * This is intentional — SUPER_ADMIN has platform-wide visibility.
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

    // ── 2. Active residents count ──────────────────────────

    async getResidentSummary(): Promise<ResidentSummary> {
        const activeResidents = await Resident.countDocuments({
            status: ResidentStatus.ACTIVE,
        });

        return { activeResidents };
    }

    // ── 3. Outstanding dues (global) ───────────────────────

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
        ]);

        return result[0] ?? { totalOutstanding: 0, invoiceCount: 0 };
    }

    // ── 4. Commission revenue ──────────────────────────────

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
        ]);

        return result[0] ?? {
            totalCommissionRevenue: 0,
            totalPOAmount: 0,
            commissionCount: 0,
        };
    }

    // ── 5. Monthly platform earnings ───────────────────────

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
        ]);
    }

    // ── 6. Vendor performance ──────────────────────────────

    async getVendorPerformance(limit = 10): Promise<VendorPerformance[]> {
        // Step 1: aggregate PO stats + commission per vendor from CommissionRecord
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
        ]);

        if (commissionStats.length === 0) return [];

        // Step 2: enrich with vendor name + rating via $lookup
        const vendorIds = commissionStats.map((s) => s._id);

        const vendors = await Vendor.find(
            { _id: { $in: vendorIds } },
            { _id: 1, name: 1, rating: 1 },
        ).lean();

        const vendorMap = new Map(
            vendors.map((v) => [v._id.toString(), v]),
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

    // ── Full dashboard ─────────────────────────────────────

    /** Run all six metrics in parallel and return a single payload. */
    async getPlatformDashboard(): Promise<PlatformDashboard> {
        const [
            societies,
            residents,
            outstandingDues,
            commission,
            monthlyEarnings,
            topVendors,
        ] = await Promise.all([
            this.getSocietySummary(),
            this.getResidentSummary(),
            this.getOutstandingDues(),
            this.getCommissionSummary(),
            this.getMonthlyEarnings(),
            this.getVendorPerformance(),
        ]);

        return {
            societies,
            residents,
            outstandingDues,
            commission,
            monthlyEarnings,
            topVendors,
        };
    }
}

export const AnalyticsService = new AnalyticsServiceClass();
