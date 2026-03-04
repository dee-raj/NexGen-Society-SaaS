import { z } from 'zod';
import { CommissionType } from '@shared/utils/constants';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;
const objectIdSchema = z.string().regex(objectIdRegex, 'Invalid ObjectId');

// ── VendorCategory ───────────────────────────────────────────

export const createVendorCategorySchema = z.object({
    body: z.object({
        name: z.string().min(2).max(100),
        description: z.string().max(500).optional(),
    }),
});

export const updateVendorCategorySchema = z.object({
    params: z.object({ id: objectIdSchema }),
    body: z.object({
        name: z.string().min(2).max(100).optional(),
        description: z.string().max(500).optional(),
        isActive: z.boolean().optional(),
    }),
});

// ── Vendor ───────────────────────────────────────────────────

export const createVendorSchema = z.object({
    body: z.object({
        name: z.string().min(2).max(200),
        categoryId: objectIdSchema,
        contactPerson: z.string().min(2).max(100),
        email: z.string().email(),
        phone: z.string().min(6).max(20),
        address: z.string().max(500).optional(),
        gstin: z.string().max(20).optional(),
    }),
});

export const updateVendorSchema = z.object({
    params: z.object({ id: objectIdSchema }),
    body: z.object({
        name: z.string().min(2).max(200).optional(),
        categoryId: objectIdSchema.optional(),
        contactPerson: z.string().min(2).max(100).optional(),
        email: z.string().email().optional(),
        phone: z.string().min(6).max(20).optional(),
        address: z.string().max(500).optional(),
        gstin: z.string().max(20).optional(),
        isActive: z.boolean().optional(),
    }),
});

// ── CommissionRule ───────────────────────────────────────────

export const createCommissionRuleSchema = z.object({
    body: z.object({
        vendorCategoryId: objectIdSchema,
        commissionType: z.enum(CommissionType),
        value: z.number().positive(),
        minAmount: z.number().min(0).optional(),
        maxAmount: z.number().min(0).optional(),
    }),
});

export const updateCommissionRuleSchema = z.object({
    params: z.object({ id: objectIdSchema }),
    body: z.object({
        commissionType: z.enum(CommissionType).optional(),
        value: z.number().positive().optional(),
        minAmount: z.number().min(0).optional(),
        maxAmount: z.number().min(0).optional(),
        isActive: z.boolean().optional(),
    }),
});

// ── ProcurementRequest ──────────────────────────────────────

export const createProcurementRequestSchema = z.object({
    body: z.object({
        title: z.string().min(3).max(200),
        description: z.string().min(10).max(2000),
        estimatedBudget: z.number().positive(),
        notes: z.string().max(1000).optional(),
    }),
});

// ── Quote ────────────────────────────────────────────────────

export const attachQuoteSchema = z.object({
    params: z.object({ id: objectIdSchema }),
    body: z.object({
        vendorId: objectIdSchema,
        amount: z.number().positive(),
        description: z.string().max(1000).optional(),
        validUntil: z.string().refine((val) => !isNaN(Date.parse(val)), {
            message: 'Invalid date format',
        }),
        attachmentUrl: z.string().url().optional(),
    }),
});

// ── Approve Quote ───────────────────────────────────────────

export const approveQuoteSchema = z.object({
    params: z.object({ id: objectIdSchema }),
    body: z.object({
        quoteId: objectIdSchema,
    }),
});

// ── Generate PO ─────────────────────────────────────────────

export const generatePOSchema = z.object({
    params: z.object({ id: objectIdSchema }),
    body: z.object({
        notes: z.string().max(1000).optional(),
    }).optional(),
});

// ── Complete PO ─────────────────────────────────────────────

export const completePOSchema = z.object({
    params: z.object({ id: objectIdSchema }),
});
