// ─────────────────────────────────────────────────────────────
// Analytics response types — Super Admin platform dashboard
// ─────────────────────────────────────────────────────────────

/** Society counts broken down by status */
export interface SocietySummary {
    total: number;
    byStatus: Record<string, number>;
}

/** Platform-wide resident headcount */
export interface ResidentSummary {
    activeResidents: number;
}

/** Outstanding maintenance dues across all societies */
export interface OutstandingDues {
    totalOutstanding: number;       // Sum of (totalAmount - amountPaid) for unpaid invoices
    invoiceCount: number;
}

/** Platform commission revenue totals */
export interface CommissionSummary {
    totalCommissionRevenue: number;
    totalPOAmount: number;          // Gross procurement volume
    commissionCount: number;
}

/** Commission revenue broken down by calendar month */
export interface MonthlyEarning {
    year: number;
    month: number;
    revenue: number;
    commissionCount: number;
}

/** Vendor performance — PO volume + average vendor rating */
export interface VendorPerformance {
    vendorId: string;
    vendorName: string;
    rating: number;
    poCount: number;
    totalPOValue: number;
    totalCommission: number;
}

/** Full platform dashboard payload */
export interface PlatformDashboard {
    societies: SocietySummary;
    residents: ResidentSummary;
    outstandingDues: OutstandingDues;
    commission: CommissionSummary;
    monthlyEarnings: MonthlyEarning[];
    topVendors: VendorPerformance[];
}
