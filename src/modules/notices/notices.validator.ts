import { z } from 'zod';
import { NoticePriority } from './notices.types';

export const createNoticeSchema = z.object({
    body: z.object({
        title: z
            .string({ message: 'Title is required' })
            .min(3, 'Title must be at least 3 characters')
            .max(200, 'Title must not exceed 200 characters')
            .trim(),
        content: z
            .string({ message: 'Content is required' })
            .min(10, 'Content must be at least 10 characters')
            .max(5000, 'Content must not exceed 5000 characters'),
        priority: z
            .nativeEnum(NoticePriority)
            .optional()
            .default(NoticePriority.MEDIUM),
        isPublished: z
            .boolean()
            .optional()
            .default(false),
        expiresAt: z
            .iso
            .datetime({ message: 'expiresAt must be a valid ISO date' })
            .optional(),
    }).strict(),
});

export const updateNoticeSchema = z.object({
    params: z.object({
        id: z.string().min(1, 'Notice ID is required'),
    }),
    body: z.object({
        title: z
            .string()
            .min(3, 'Title must be at least 3 characters')
            .max(200, 'Title must not exceed 200 characters')
            .trim()
            .optional(),
        content: z
            .string()
            .min(10, 'Content must be at least 10 characters')
            .max(5000, 'Content must not exceed 5000 characters')
            .optional(),
        priority: z
            .nativeEnum(NoticePriority)
            .optional(),
        isPublished: z
            .boolean()
            .optional(),
        expiresAt: z
            .iso
            .datetime({ message: 'expiresAt must be a valid ISO date' })
            .optional()
            .nullable(),
    }).strict(),
});

export const noticeIdParamSchema = z.object({
    params: z.object({
        id: z.string().min(1, 'Notice ID is required'),
    }),
});

export type CreateNoticeInput = z.infer<typeof createNoticeSchema>['body'];
export type UpdateNoticeInput = z.infer<typeof updateNoticeSchema>['body'];
