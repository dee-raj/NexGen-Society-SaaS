/** Roles ordered by privilege level (highest → lowest) */
export enum Role {
    SUPER_ADMIN = 'SUPER_ADMIN',
    SOCIETY_ADMIN = 'SOCIETY_ADMIN',
    RESIDENT = 'RESIDENT',
}

export enum SocietyStatus {
    ACTIVE = 'active',
    INACTIVE = 'inactive',
    SUSPENDED = 'suspended',
    ONBOARDING = 'onboarding',
}

export enum ResidentStatus {
    ACTIVE = 'active',
    INACTIVE = 'inactive',
    MOVED_OUT = 'moved_out',
}

export enum PaymentStatus {
    PENDING = 'pending',
    PAID = 'paid',
    OVERDUE = 'overdue',
    PARTIALLY_PAID = 'partially_paid',
    CANCELLED = 'cancelled',
}

export enum LedgerEntryType {
    DEBIT = 'debit',
    CREDIT = 'credit',
}

export enum ServiceRequestStatus {
    DRAFT = 'draft',
    SUBMITTED = 'submitted',
    VENDOR_ASSIGNED = 'vendor_assigned',
    IN_PROGRESS = 'in_progress',
    COMPLETED = 'completed',
    CANCELLED = 'cancelled',
}

export enum TicketPriority {
    LOW = 'low',
    MEDIUM = 'medium',
    HIGH = 'high',
    URGENT = 'urgent',
}

export enum TicketStatus {
    OPEN = 'open',
    IN_PROGRESS = 'in_progress',
    RESOLVED = 'resolved',
    CLOSED = 'closed',
}

export enum BuildingType {
    RESIDENTIAL = 'residential',
    COMMERCIAL = 'commercial',
    MIXED = 'mixed',
}

export enum FlatType {
    APARTMENT = 'apartment',
    PENTHOUSE = 'penthouse',
    STUDIO = 'studio',
    DUPLEX = 'duplex',
    SHOP = 'shop',
    OFFICE = 'office',
}

export enum ResidentType {
    OWNER = 'owner',
    TENANT = 'tenant',
    FAMILY_MEMBER = 'family_member',
}

export enum StaffType {
    PERMANENT = 'permanent',
    CONTRACT = 'contract',
    TEMPORARY = 'temporary',
}

export enum StaffDepartment {
    SECURITY = 'security',
    MAINTENANCE = 'maintenance',
    HOUSEKEEPING = 'housekeeping',
    ADMINISTRATION = 'administration',
    GARDENING = 'gardening',
    OTHER = 'other',
}

export enum CalculationMethod {
    FIXED = 'fixed',
    PER_SQFT = 'per_sqft',
}

export enum InvoiceStatus {
    DRAFT = 'draft',
    ISSUED = 'issued',
    PAID = 'paid',
    OVERDUE = 'overdue',
    CANCELLED = 'cancelled',
}

export enum PaymentMethod {
    CASH = 'cash',
    CHEQUE = 'cheque',
    ONLINE = 'online',
    UPI = 'upi',
    BANK_TRANSFER = 'bank_transfer',
}

export enum ExpenseCategory {
    MAINTENANCE = 'maintenance',
    UTILITY = 'utility',
    SALARY = 'salary',
    REPAIR = 'repair',
    EVENT = 'event',
    OTHER = 'other',
}

export enum ExpenseStatus {
    PENDING = 'pending',
    APPROVED = 'approved',
    PAID = 'paid',
    REJECTED = 'rejected',
}

// ── Procurement Engine ──────────────────────────────────────

export enum ProcurementStatus {
    DRAFT = 'draft',
    SUBMITTED = 'submitted',
    QUOTED = 'quoted',
    APPROVED = 'approved',
    PO_ISSUED = 'po_issued',
    COMPLETED = 'completed',
    CANCELLED = 'cancelled',
}

export enum QuoteStatus {
    PENDING = 'pending',
    ACCEPTED = 'accepted',
    REJECTED = 'rejected',
}

export enum POStatus {
    ISSUED = 'issued',
    DELIVERED = 'delivered',
    CANCELLED = 'cancelled',
}

export enum CommissionType {
    PERCENTAGE = 'percentage',
    FIXED = 'fixed',
}

// ── Complaint Workflow ──────────────────────────────────────

export enum ComplaintStatus {
    REPORTED = 'reported',
    IN_PROGRESS = 'in_progress',
    RESOLVED = 'resolved',
    CLOSED = 'closed',
}

export enum ComplaintPriority {
    LOW = 'low',
    MEDIUM = 'medium',
    HIGH = 'high',
    URGENT = 'urgent',
}

export enum ComplaintCategory {
    PLUMBING = 'plumbing',
    ELECTRICAL = 'electrical',
    CIVIL = 'civil',
    HOUSEKEEPING = 'housekeeping',
    SECURITY = 'security',
    PARKING = 'parking',
    NOISE = 'noise',
    OTHER = 'other',
}

// ── Communication Module ────────────────────────────────────

export enum NotificationType {
    NOTICE = 'notice',
    COMPLAINT_UPDATE = 'complaint_update',
    PAYMENT_REMINDER = 'payment_reminder',
    MAINTENANCE_ALERT = 'maintenance_alert',
    SYSTEM = 'system',
    CUSTOM = 'custom',
}

export enum NotificationChannel {
    IN_APP = 'in_app',
    PUSH = 'push',
    EMAIL = 'email',
    SMS = 'sms',
}

/** Pagination defaults */
export const PAGINATION = {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100,
} as const;
