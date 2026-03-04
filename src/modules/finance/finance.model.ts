import mongoose, { Schema } from 'mongoose';
import {
    IMaintenanceTemplate,
    IInvoice,
    IPayment,
    ILedgerEntry,
    IExpense,
} from './finance.types';
import {
    CalculationMethod,
    InvoiceStatus,
    PaymentMethod,
    LedgerEntryType,
    ExpenseCategory,
    ExpenseStatus,
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

// ── MaintenanceTemplate Schema ───────────────────────────────

const maintenanceTemplateSchema = new Schema<IMaintenanceTemplate>(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            maxlength: 100,
        },
        calculationMethod: {
            type: String,
            enum: Object.values(CalculationMethod),
            default: CalculationMethod.FIXED,
            required: true,
        },
        amountOrRate: {
            type: Number,
            required: true,
            min: 0,
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

maintenanceTemplateSchema.plugin(tenantScopePlugin);
maintenanceTemplateSchema.plugin(auditLogPlugin);
maintenanceTemplateSchema.index({ societyId: 1, isActive: 1 });

export const MaintenanceTemplate = mongoose.model<IMaintenanceTemplate>(
    'MaintenanceTemplate',
    maintenanceTemplateSchema,
);

// ── Invoice Schema ───────────────────────────────────────────

const invoiceItemSchema = new Schema({
    description: { type: String, required: true },
    amount: { type: Number, required: true, min: 0 },
}, { _id: false });

const invoiceSchema = new Schema<IInvoice>(
    {
        residentId: {
            type: Schema.Types.ObjectId,
            ref: 'Resident',
            required: true,
            index: true,
        },
        flatId: {
            type: Schema.Types.ObjectId,
            ref: 'Flat',
            required: true,
            index: true,
        },
        invoiceNumber: {
            type: String,
            required: true,
            unique: true,
        },
        issueDate: {
            type: Date,
            required: true,
        },
        dueDate: {
            type: Date,
            required: true,
        },
        period: {
            month: { type: Number, required: true, min: 1, max: 12 },
            year: { type: Number, required: true, min: 2000 },
        },
        items: [invoiceItemSchema],
        subtotal: {
            type: Number,
            required: true,
            min: 0,
            default: 0,
        },
        lateFee: {
            type: Number,
            default: 0,
            min: 0,
        },
        totalAmount: {
            type: Number,
            required: true,
            min: 0,
        },
        amountPaid: {
            type: Number,
            default: 0,
            min: 0,
        },
        status: {
            type: String,
            enum: Object.values(InvoiceStatus),
            default: InvoiceStatus.DRAFT,
            required: true,
        },
        notes: {
            type: String,
            trim: true,
        },
    },
    { timestamps: true, toJSON: transformJSON },
);

invoiceSchema.plugin(tenantScopePlugin);
invoiceSchema.plugin(auditLogPlugin);

// Prevent modifications if status is PAID or CANCELLED unless it's a specific internal update
invoiceSchema.pre('save', function () {
    if (!this.isNew && this.isModified()) {
        const locals = this.$locals as { originalDocument?: IInvoice };
        const original = locals.originalDocument;
        if (original && (original.status === InvoiceStatus.PAID || original.status === InvoiceStatus.CANCELLED)) {
            // Cannot modify a paid or cancelled invoice (exceptions could be added if needed)
            throw new Error('Cannot modify a paid or cancelled invoice');
        }
    }
});

invoiceSchema.post('init', function (doc) {
    // Store original document copy for pre-save checks
    (this.$locals as { originalDocument?: IInvoice }).originalDocument = doc.toObject() as IInvoice;
});

invoiceSchema.index({ societyId: 1, residentId: 1, status: 1 });
invoiceSchema.index({ societyId: 1, 'period.year': 1, 'period.month': 1 });
invoiceSchema.index({ societyId: 1, status: 1, dueDate: 1 });

export const Invoice = mongoose.model<IInvoice>('Invoice', invoiceSchema);

// ── Payment Schema ───────────────────────────────────────────

const paymentSchema = new Schema<IPayment>(
    {
        invoiceId: {
            type: Schema.Types.ObjectId,
            ref: 'Invoice',
            required: true,
            index: true,
        },
        residentId: {
            type: Schema.Types.ObjectId,
            ref: 'Resident',
            required: true,
            index: true,
        },
        transactionReference: {
            type: String,
            trim: true,
        },
        amount: {
            type: Number,
            required: true,
            min: 0,
        },
        paymentDate: {
            type: Date,
            default: Date.now,
            required: true,
        },
        paymentMethod: {
            type: String,
            enum: Object.values(PaymentMethod),
            required: true,
        },
        notes: {
            type: String,
            trim: true,
        },
    },
    { timestamps: true, toJSON: transformJSON },
);

paymentSchema.plugin(tenantScopePlugin);
paymentSchema.plugin(auditLogPlugin);
paymentSchema.index({ societyId: 1, residentId: 1 });

export const Payment = mongoose.model<IPayment>('Payment', paymentSchema);

// ── LedgerEntry Schema (Immutable) ───────────────────────────

const ledgerEntrySchema = new Schema<ILedgerEntry>(
    {
        type: {
            type: String,
            enum: Object.values(LedgerEntryType),
            required: true,
        },
        amount: {
            type: Number,
            required: true,
            min: 0,
        },
        balance: {
            type: Number,
            required: true,
        },
        description: {
            type: String,
            required: true,
            trim: true,
        },
        referenceType: {
            type: String,
            enum: ['Invoice', 'Payment', 'Expense', 'Manual'],
            required: true,
        },
        referenceId: {
            type: Schema.Types.ObjectId,
            required: true,
            index: true,
        },
        date: {
            type: Date,
            default: Date.now,
            required: true,
            index: true,
        },
    },
    {
        timestamps: { createdAt: true, updatedAt: false }, // Append-only
        toJSON: transformJSON,
    },
);

ledgerEntrySchema.plugin(tenantScopePlugin);

// Pre-save hook to enforce immutability
ledgerEntrySchema.pre('save', function () {
    if (!this.isNew) {
        throw new Error('LedgerEntry is immutable and cannot be updated.');
    }
});

// Disable update methods entirely for this schema (append-only ledger constraint)
ledgerEntrySchema.pre(/update|updateOne|updateMany|findOneAndUpdate/, function () {
    throw new Error('Updating a LedgerEntry is strictly prohibited. Use compensatory transactions instead.');
});

// Disable delete methods entirely
ledgerEntrySchema.pre(/deleteOne|deleteMany|findOneAndDelete|remove/, function () {
    throw new Error('Deleting a LedgerEntry is strictly prohibited. Use compensatory transactions instead.');
});

ledgerEntrySchema.index({ societyId: 1, date: -1 });

export const LedgerEntry = mongoose.model<ILedgerEntry>('LedgerEntry', ledgerEntrySchema);

// ── Expense Schema ───────────────────────────────────────────

const expenseSchema = new Schema<IExpense>(
    {
        title: {
            type: String,
            required: true,
            trim: true,
            maxlength: 200,
        },
        description: {
            type: String,
            trim: true,
            maxlength: 1000,
        },
        amount: {
            type: Number,
            required: true,
            min: 0,
        },
        date: {
            type: Date,
            required: true,
        },
        category: {
            type: String,
            enum: Object.values(ExpenseCategory),
            default: ExpenseCategory.OTHER,
            required: true,
        },
        status: {
            type: String,
            enum: Object.values(ExpenseStatus),
            default: ExpenseStatus.PENDING,
            required: true,
        },
        vendorName: {
            type: String,
            trim: true,
        },
        invoiceUrl: {
            type: String,
            trim: true,
        },
        approvedBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
        },
    },
    { timestamps: true, toJSON: transformJSON },
);

expenseSchema.plugin(tenantScopePlugin);
expenseSchema.plugin(auditLogPlugin);
expenseSchema.index({ societyId: 1, date: -1 });
expenseSchema.index({ societyId: 1, category: 1 });
expenseSchema.index({ societyId: 1, status: 1 });

export const Expense = mongoose.model<IExpense>('Expense', expenseSchema);
