import { z } from 'zod';

export const createSocietyRequestSchema = z.object({
    body: z.object({
        societyName: z
            .string({ message: 'Society name is required' })
            .min(2, 'Society name must be at least 2 characters')
            .max(200, 'Society name must not exceed 200 characters')
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

        adminName: z
            .string({ message: 'Admin name is required' })
            .min(2, 'Admin name must be at least 2 characters')
            .max(100)
            .trim(),
        adminEmail: z
            .string({ message: 'Admin email is required' })
            .email('Invalid email address')
            .trim()
            .toLowerCase(),
        adminPhone: z
            .string({ message: 'Admin phone is required' })
            .regex(/^\+?[\d\s-]{10,15}$/, 'Invalid phone number'),
    }).strict(),
});

export const approveSocietyRequestSchema = z.object({
    params: z.object({
        id: z.string().min(1, 'Request ID is required'),
    }),
});

export const rejectSocietyRequestSchema = z.object({
    params: z.object({
        id: z.string().min(1, 'Request ID is required'),
    }),
    body: z.object({
        reason: z.string().min(1, 'Rejection reason is required').trim(),
    }).strict(),
});

export type CreateSocietyRequestInput = z.infer<typeof createSocietyRequestSchema>['body'];
