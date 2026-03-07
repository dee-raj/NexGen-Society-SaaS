// ─────────────────────────────────────────────────────────────
// Analytics response types — Super Admin platform dashboard
// ─────────────────────────────────────────────────────────────

/** Society counts broken down by status */
export interface SocietySummary {
    total: number;
    byStatus: Record<string, number>;
}

/** Society registration request counts */
export interface RequestSummary {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    last7Days: number;
    last30Days: number;
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

/** Society growth over time */
export interface SocietyGrowth {
    date: string;
    count: number;
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
    requests: RequestSummary;
    residents: ResidentSummary;
    outstandingDues: OutstandingDues;
    commission: CommissionSummary;
    monthlyEarnings: MonthlyEarning[];
    societyGrowth: SocietyGrowth[];
    topVendors: VendorPerformance[];
}

// ─────────────────────────────────────────────────────────────
// Analytics response types — Society Admin dashboard
// ─────────────────────────────────────────────────────────────

export interface BuildingDistribution {
    buildingName: string;
    residentCount: number;
    flatCount: number;
}

export interface StaffDistribution {
    category: string;
    count: number;
}

export interface OccupancyStats {
    occupied: number;
    vacant: number;
    total: number;
}

/** Single society dashboard payload */
export interface SocietyDashboard {
    totalResidents: number;
    totalStaff: number;
    totalBuildings: number;
    totalFlats: number;
    buildings: BuildingDistribution[];
    staffDistribution: StaffDistribution[];
    occupancy: OccupancyStats;
}
