import { z } from 'zod';
import {
    ComplaintCategory,
    ComplaintPriority,
    ComplaintStatus,
} from '@shared/utils/constants';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;
const objectIdSchema = z.string().regex(objectIdRegex, 'Invalid ObjectId');

// ── Create Complaint ─────────────────────────────────────────

export const createComplaintSchema = z.object({
    body: z.object({
        title: z.string().min(3).max(200),
        description: z.string().min(10).max(2000),
        category: z.enum(ComplaintCategory),
        priority: z.enum(ComplaintPriority).optional(),
        photos: z.array(z.string().url()).max(10).optional(),
    }),
});

// ── Transition Status ────────────────────────────────────────

export const transitionStatusSchema = z.object({
    params: z.object({ id: objectIdSchema }),
    body: z.object({
        status: z.enum(ComplaintStatus),
        comment: z.string().max(1000).optional(),
    }),
});

// ── Add Rating ───────────────────────────────────────────────

export const addRatingSchema = z.object({
    params: z.object({ id: objectIdSchema }),
    body: z.object({
        rating: z.number().int().min(1).max(5),
        comment: z.string().max(500).optional(),
    }),
});

// ── Get by ID ────────────────────────────────────────────────

export const complaintIdParamSchema = z.object({
    params: z.object({ id: objectIdSchema }),
});
