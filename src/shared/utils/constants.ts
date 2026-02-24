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

/** Pagination defaults */
export const PAGINATION = {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100,
} as const;
