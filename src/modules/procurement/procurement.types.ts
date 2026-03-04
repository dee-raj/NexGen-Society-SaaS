import { Document, Types } from 'mongoose';
import {
    ProcurementStatus,
    QuoteStatus,
    POStatus,
    CommissionType,
} from '@shared/utils/constants';

// ── VendorCategory (Global) ─────────────────────────────────

export interface IVendorCategory extends Document {
    id: string;
    name: string;
    description?: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

// ── Vendor (Global) ─────────────────────────────────────────

export interface IVendor extends Document {
    id: string;
    name: string;
    categoryId: Types.ObjectId;
    contactPerson: string;
    email: string;
    phone: string;
    address?: string;
    gstin?: string;
    rating: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

// ── CommissionRule (Global) ─────────────────────────────────

export interface ICommissionRule extends Document {
    id: string;
    vendorCategoryId: Types.ObjectId;
    commissionType: CommissionType;
    value: number; // percentage (0-100) or fixed amount
    minAmount?: number; // floor for commission
    maxAmount?: number; // cap for commission
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

// ── ProcurementRequest (Tenant-scoped) ──────────────────────

export interface IProcurementRequest extends Document {
    id: string;
    societyId: Types.ObjectId;
    title: string;
    description: string;
    estimatedBudget: number;
    status: ProcurementStatus;
    requestedBy: Types.ObjectId;
    approvedBy?: Types.ObjectId;
    approvalDate?: Date;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}

// ── Quote (Tenant-scoped) ───────────────────────────────────

export interface IQuote extends Document {
    id: string;
    societyId: Types.ObjectId;
    procurementRequestId: Types.ObjectId;
    vendorId: Types.ObjectId;
    amount: number;
    description?: string;
    validUntil: Date;
    status: QuoteStatus;
    attachmentUrl?: string;
    submittedBy: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

// ── PurchaseOrder (Tenant-scoped) ───────────────────────────

export interface IPurchaseOrder extends Document {
    id: string;
    societyId: Types.ObjectId;
    procurementRequestId: Types.ObjectId;
    quoteId: Types.ObjectId;
    vendorId: Types.ObjectId;
    poNumber: string;
    amount: number;
    status: POStatus;
    issuedBy: Types.ObjectId;
    issuedDate: Date;
    deliveryDate?: Date;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}

// ── CommissionRecord (Tenant-scoped) ────────────────────────

export interface ICommissionRecord extends Document {
    id: string;
    societyId: Types.ObjectId;
    purchaseOrderId: Types.ObjectId;
    vendorId: Types.ObjectId;
    commissionRuleId: Types.ObjectId;
    poAmount: number;
    commissionAmount: number;
    calculationDetails: string;
    ledgerEntryId?: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}
