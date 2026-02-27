import { z } from 'zod';
import { ResidentType, ResidentStatus } from '../../shared/utils/constants';

export const createResidentSchema = z.object({
    body: z.object({
        userId: z
            .string({ message: 'User ID is required' })
            .min(1, 'User ID is required'),
        flatId: z
            .string({ message: 'Flat ID is required' })
            .min(1, 'Flat ID is required'),
        type: z
            .nativeEnum(ResidentType)
            .optional()
            .default(ResidentType.OWNER),
        status: z
            .nativeEnum(ResidentStatus)
            .optional()
            .default(ResidentStatus.ACTIVE),
        moveInDate: z
            .string()
            .datetime({ message: 'moveInDate must be a valid ISO date' })
            .optional(),
        vehicleNumbers: z
            .array(z.string().trim())
            .optional()
            .default([]),
        emergencyContact: z
            .string()
            .regex(/^\+?[\d\s-]{10,15}$/, 'Invalid phone number')
            .optional(),
    }).strict(),
});

export const updateResidentSchema = z.object({
    params: z.object({
        id: z.string().min(1, 'Resident ID is required'),
    }),
    body: z.object({
        flatId: z.string().min(1).optional(),
        type: z.nativeEnum(ResidentType).optional(),
        status: z.nativeEnum(ResidentStatus).optional(),
        moveInDate: z.string().datetime().optional().nullable(),
        moveOutDate: z.string().datetime().optional().nullable(),
        vehicleNumbers: z.array(z.string().trim()).optional(),
        emergencyContact: z.string().regex(/^\+?[\d\s-]{10,15}$/).optional().nullable(),
    }).strict(),
});

export const residentIdParamSchema = z.object({
    params: z.object({
        id: z.string().min(1, 'Resident ID is required'),
    }),
});

export type CreateResidentInput = z.infer<typeof createResidentSchema>['body'];
export type UpdateResidentInput = z.infer<typeof updateResidentSchema>['body'];
