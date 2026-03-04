import mongoose, { Schema } from 'mongoose';
import {
    IVendorCategory,
    IVendor,
    ICommissionRule,
    IProcurementRequest,
    IQuote,
    IPurchaseOrder,
    ICommissionRecord,
} from './procurement.types';
import {
    ProcurementStatus,
    QuoteStatus,
    POStatus,
    CommissionType,
} from '@shared/utils/constants';
import { tenantScopePlugin } from '@shared/plugins/tenant-scope.plugin';
import { auditLogPlugin } from '@shared/plugins/audit-log.plugin';

const transformJSON = {
    transform(_doc: any, ret: Record<string, unknown>) {
        ret.id = (ret._id as mongoose.Types.ObjectId)?.toString();
        delete ret.__v;
        return ret;
    },
};

// ══════════════════════════════════════════════════════════════
//  GLOBAL COLLECTIONS (No tenant scoping)
// ══════════════════════════════════════════════════════════════

// ── VendorCategory Schema ────────────────────────────────────

const vendorCategorySchema = new Schema<IVendorCategory>(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            unique: true,
            maxlength: 100,
        },
        description: {
            type: String,
            trim: true,
            maxlength: 500,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true, toJSON: transformJSON },
);

vendorCategorySchema.plugin(auditLogPlugin);

export const VendorCategory = mongoose.model<IVendorCategory>(
    'VendorCategory',
    vendorCategorySchema,
);

// ── Vendor Schema ────────────────────────────────────────────

const vendorSchema = new Schema<IVendor>(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            maxlength: 200,
        },
        categoryId: {
            type: Schema.Types.ObjectId,
            ref: 'VendorCategory',
            required: true,
            index: true,
        },
        contactPerson: {
            type: String,
            required: true,
            trim: true,
            maxlength: 100,
        },
        email: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
        },
        phone: {
            type: String,
            required: true,
            trim: true,
        },
        address: {
            type: String,
            trim: true,
            maxlength: 500,
        },
        gstin: {
            type: String,
            trim: true,
            maxlength: 20,
        },
        rating: {
            type: Number,
            default: 0,
            min: 0,
            max: 5,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true, toJSON: transformJSON },
);

vendorSchema.plugin(auditLogPlugin);
vendorSchema.index({ categoryId: 1, isActive: 1 });
vendorSchema.index({ name: 'text', contactPerson: 'text' });

export const Vendor = mongoose.model<IVendor>('Vendor', vendorSchema);

// ── CommissionRule Schema ────────────────────────────────────

const commissionRuleSchema = new Schema<ICommissionRule>(
    {
        vendorCategoryId: {
            type: Schema.Types.ObjectId,
            ref: 'VendorCategory',
            required: true,
            index: true,
        },
        commissionType: {
            type: String,
            enum: Object.values(CommissionType),
            required: true,
        },
        value: {
            type: Number,
            required: true,
            min: 0,
        },
        minAmount: {
            type: Number,
            min: 0,
        },
        maxAmount: {
            type: Number,
            min: 0,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true, toJSON: transformJSON },
);

commissionRuleSchema.plugin(auditLogPlugin);
commissionRuleSchema.index({ vendorCategoryId: 1, isActive: 1 });

export const CommissionRule = mongoose.model<ICommissionRule>(
    'CommissionRule',
    commissionRuleSchema,
);

// ══════════════════════════════════════════════════════════════
//  TENANT-SCOPED COLLECTIONS
// ══════════════════════════════════════════════════════════════

// ── ProcurementRequest Schema ────────────────────────────────

const procurementRequestSchema = new Schema<IProcurementRequest>(
    {
        title: {
            type: String,
            required: true,
            trim: true,
            maxlength: 200,
        },
        description: {
            type: String,
            required: true,
            trim: true,
            maxlength: 2000,
        },
        estimatedBudget: {
            type: Number,
            required: true,
            min: 0,
        },
        status: {
            type: String,
            enum: Object.values(ProcurementStatus),
            default: ProcurementStatus.SUBMITTED,
            required: true,
        },
        requestedBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        approvedBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
        },
        approvalDate: {
            type: Date,
        },
        notes: {
            type: String,
            trim: true,
            maxlength: 1000,
        },
    },
    { timestamps: true, toJSON: transformJSON },
);

procurementRequestSchema.plugin(tenantScopePlugin);
procurementRequestSchema.plugin(auditLogPlugin);
procurementRequestSchema.index({ societyId: 1, status: 1 });
procurementRequestSchema.index({ societyId: 1, requestedBy: 1 });

export const ProcurementRequest = mongoose.model<IProcurementRequest>(
    'ProcurementRequest',
    procurementRequestSchema,
);

// ── Quote Schema ─────────────────────────────────────────────

const quoteSchema = new Schema<IQuote>(
    {
        procurementRequestId: {
            type: Schema.Types.ObjectId,
            ref: 'ProcurementRequest',
            required: true,
            index: true,
        },
        vendorId: {
            type: Schema.Types.ObjectId,
            ref: 'Vendor',
            required: true,
            index: true,
        },
        amount: {
            type: Number,
            required: true,
            min: 0,
        },
        description: {
            type: String,
            trim: true,
            maxlength: 1000,
        },
        validUntil: {
            type: Date,
            required: true,
        },
        status: {
            type: String,
            enum: Object.values(QuoteStatus),
            default: QuoteStatus.PENDING,
            required: true,
        },
        attachmentUrl: {
            type: String,
            trim: true,
        },
        submittedBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
    },
    { timestamps: true, toJSON: transformJSON },
);

quoteSchema.plugin(tenantScopePlugin);
quoteSchema.plugin(auditLogPlugin);
quoteSchema.index({ societyId: 1, procurementRequestId: 1 });

export const Quote = mongoose.model<IQuote>('Quote', quoteSchema);

// ── PurchaseOrder Schema ─────────────────────────────────────

const purchaseOrderSchema = new Schema<IPurchaseOrder>(
    {
        procurementRequestId: {
            type: Schema.Types.ObjectId,
            ref: 'ProcurementRequest',
            required: true,
            index: true,
        },
        quoteId: {
            type: Schema.Types.ObjectId,
            ref: 'Quote',
            required: true,
        },
        vendorId: {
            type: Schema.Types.ObjectId,
            ref: 'Vendor',
            required: true,
            index: true,
        },
        poNumber: {
            type: String,
            required: true,
            unique: true,
        },
        amount: {
            type: Number,
            required: true,
            min: 0,
        },
        status: {
            type: String,
            enum: Object.values(POStatus),
            default: POStatus.ISSUED,
            required: true,
        },
        issuedBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        issuedDate: {
            type: Date,
            default: Date.now,
            required: true,
        },
        deliveryDate: {
            type: Date,
        },
        notes: {
            type: String,
            trim: true,
            maxlength: 1000,
        },
    },
    { timestamps: true, toJSON: transformJSON },
);

purchaseOrderSchema.plugin(tenantScopePlugin);
purchaseOrderSchema.plugin(auditLogPlugin);
purchaseOrderSchema.index({ societyId: 1, status: 1 });
purchaseOrderSchema.index({ societyId: 1, vendorId: 1 });

export const PurchaseOrder = mongoose.model<IPurchaseOrder>(
    'PurchaseOrder',
    purchaseOrderSchema,
);

// ── CommissionRecord Schema ──────────────────────────────────

const commissionRecordSchema = new Schema<ICommissionRecord>(
    {
        purchaseOrderId: {
            type: Schema.Types.ObjectId,
            ref: 'PurchaseOrder',
            required: true,
            index: true,
        },
        vendorId: {
            type: Schema.Types.ObjectId,
            ref: 'Vendor',
            required: true,
            index: true,
        },
        commissionRuleId: {
            type: Schema.Types.ObjectId,
            ref: 'CommissionRule',
            required: true,
        },
        poAmount: {
            type: Number,
            required: true,
            min: 0,
        },
        commissionAmount: {
            type: Number,
            required: true,
            min: 0,
        },
        calculationDetails: {
            type: String,
            required: true,
            trim: true,
        },
        ledgerEntryId: {
            type: Schema.Types.ObjectId,
            ref: 'LedgerEntry',
        },
    },
    { timestamps: true, toJSON: transformJSON },
);

commissionRecordSchema.plugin(tenantScopePlugin);
commissionRecordSchema.plugin(auditLogPlugin);
commissionRecordSchema.index({ societyId: 1, purchaseOrderId: 1 });

export const CommissionRecord = mongoose.model<ICommissionRecord>(
    'CommissionRecord',
    commissionRecordSchema,
);
