import { Document, Types } from 'mongoose';
import {
    CalculationMethod,
    InvoiceStatus,
    PaymentMethod,
    LedgerEntryType,
    ExpenseCategory,
    ExpenseStatus,
} from '../../shared/utils/constants';

// ── MaintenanceTemplate ──────────────────────────────────────

export interface IMaintenanceTemplate extends Document {
    id: string; // the stringified _id
    societyId: Types.ObjectId;
    name: string; // e.g., 'monthly_maintenance', 'festival_fund'
    calculationMethod: CalculationMethod;
    amountOrRate: number; // If fixed, then `amount`, if per_sqft, then `rate`
    description?: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

// ── Invoice ──────────────────────────────────────────────────

export interface IInvoiceItem {
    description: string;
    amount: number;
}

export interface IInvoice extends Document {
    id: string;
    societyId: Types.ObjectId;
    residentId: Types.ObjectId;
    flatId: Types.ObjectId;
    invoiceNumber: string;
    issueDate: Date;
    dueDate: Date;
    period: {
        month: number; // 1-12
        year: number;
    };
    items: IInvoiceItem[];
    subtotal: number;
    lateFee: number;
    totalAmount: number;
    amountPaid: number;
    status: InvoiceStatus;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}

// ── Payment ──────────────────────────────────────────────────

export interface IPayment extends Document {
    id: string;
    societyId: Types.ObjectId;
    invoiceId: Types.ObjectId;
    residentId: Types.ObjectId;
    transactionReference?: string; // UTR or cheque number
    amount: number;
    paymentDate: Date;
    paymentMethod: PaymentMethod;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}

// ── LedgerEntry (Immutable) ────────────────────────────────

export interface ILedgerEntry extends Document {
    id: string;
    societyId: Types.ObjectId;
    type: LedgerEntryType; // CREDIT (money in) or DEBIT (money out/due)
    amount: number;
    balance: number; // Running balance at the time of entry
    description: string;
    referenceType: 'Invoice' | 'Payment' | 'Expense' | 'Manual';
    referenceId?: Types.ObjectId;
    date: Date;
    createdAt: Date; // Cannot be updated
}

// ── Expense ──────────────────────────────────────────────────

export interface IExpense extends Document {
    id: string;
    societyId: Types.ObjectId;
    title: string;
    description?: string;
    amount: number;
    date: Date;
    category: ExpenseCategory;
    status: ExpenseStatus;
    vendorName?: string;
    invoiceUrl?: string; // proof of expense
    approvedBy?: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}
