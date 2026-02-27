import { z } from 'zod';
import { SocietyStatus } from '../../shared/utils/constants';

export const createSocietySchema = z.object({
    body: z.object({
        name: z
            .string({ message: 'Name is required' })
            .min(2, 'Name must be at least 2 characters')
            .max(200, 'Name must not exceed 200 characters')
            .trim(),
        registrationNumber: z
            .string()
            .trim()
            .optional(),
        address: z
            .string({ message: 'Address is required' })
            .min(5, 'Address must be at least 5 characters')
            .max(500, 'Address must not exceed 500 characters')
            .trim(),
        city: z
            .string({ message: 'City is required' })
            .min(2, 'City must be at least 2 characters')
            .max(100)
            .trim(),
        state: z
            .string({ message: 'State is required' })
            .min(2, 'State must be at least 2 characters')
            .max(100)
            .trim(),
        pincode: z
            .string({ message: 'Pincode is required' })
            .regex(/^\d{4,10}$/, 'Pincode must be 4-10 digits'),
        status: z
            .nativeEnum(SocietyStatus)
            .optional()
            .default(SocietyStatus.ONBOARDING),
        contactEmail: z
            .string()
            .email('Invalid email')
            .optional(),
        contactPhone: z
            .string()
            .regex(/^\+?[\d\s-]{10,15}$/, 'Invalid phone number')
            .optional(),
        logoUrl: z
            .string()
            .url('Invalid URL')
            .optional(),
    }).strict(),
});

export const updateSocietySchema = z.object({
    params: z.object({
        id: z.string().min(1, 'Society ID is required'),
    }),
    body: z.object({
        name: z.string().min(2).max(200).trim().optional(),
        registrationNumber: z.string().trim().optional().nullable(),
        address: z.string().min(5).max(500).trim().optional(),
        city: z.string().min(2).max(100).trim().optional(),
        state: z.string().min(2).max(100).trim().optional(),
        pincode: z.string().regex(/^\d{4,10}$/, 'Pincode must be 4-10 digits').optional(),
        status: z.nativeEnum(SocietyStatus).optional(),
        contactEmail: z.string().email().optional().nullable(),
        contactPhone: z.string().regex(/^\+?[\d\s-]{10,15}$/).optional().nullable(),
        logoUrl: z.string().url().optional().nullable(),
    }).strict(),
});

export const societyIdParamSchema = z.object({
    params: z.object({
        id: z.string().min(1, 'Society ID is required'),
    }),
});

export type CreateSocietyInput = z.infer<typeof createSocietySchema>['body'];
export type UpdateSocietyInput = z.infer<typeof updateSocietySchema>['body'];
