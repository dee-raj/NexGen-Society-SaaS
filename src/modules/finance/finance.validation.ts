import { z } from 'zod';
import {
    CalculationMethod,
    PaymentMethod,
    ExpenseCategory,
    ExpenseStatus,
} from '@shared/utils/constants';

// ── MaintenanceTemplate Validation ───────────────────────────

export const createMaintenanceTemplateSchema = z.object({
    body: z.object({
        name: z.string().min(2).max(100),
        calculationMethod: z.enum(CalculationMethod),
        amountOrRate: z.number().positive(),
        description: z.string().max(500).optional(),
    }),
});

// ── Invoice Generation Validation ────────────────────────────

export const generateInvoicesSchema = z.object({
    body: z.object({
        templateId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid template ID'),
        month: z.number().int().min(1).max(12),
        year: z.number().int().min(2000).max(2100),
        dueDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
            message: 'Invalid date format',
        }),
    }),
});

// ── Payment Processing Validation ────────────────────────────

export const processPaymentSchema = z.object({
    body: z.object({
        invoiceId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid invoice ID'),
        amount: z.number().positive(),
        paymentMethod: z.enum(PaymentMethod),
        transactionReference: z.string().optional(),
        notes: z.string().optional(),
    }),
});

// ── Late Fee Application Validation ──────────────────────────

export const applyLateFeesSchema = z.object({
    body: z.object({
        lateFeeAmount: z.number().positive(),
    }),
});

// ── Expense Validation ───────────────────────────────────────

export const createExpenseSchema = z.object({
    body: z.object({
        title: z.string().min(2).max(200),
        description: z.string().max(1000).optional(),
        amount: z.number().positive(),
        date: z.string().refine((val) => !isNaN(Date.parse(val)), {
            message: 'Invalid date format',
        }),
        category: z.enum(ExpenseCategory),
        vendorName: z.string().optional(),
        invoiceUrl: z.url().optional(),
    }),
});

export const updateExpenseStatusSchema = z.object({
    params: z.object({
        id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid expense ID'),
    }),
    body: z.object({
        status: z.enum(ExpenseStatus),
    }),
});
