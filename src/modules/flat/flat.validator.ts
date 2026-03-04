import { z } from 'zod';
import { FlatType } from '@shared/utils/constants';

export const createFlatSchema = z.object({
    body: z.object({
        buildingId: z
            .string({ message: 'Building ID is required' })
            .min(1, 'Building ID is required'),
        unitNumber: z
            .string({ message: 'Unit number is required' })
            .min(1, 'Unit number is required')
            .max(20)
            .trim(),
        floor: z
            .number({ message: 'Floor is required' })
            .int()
            .min(-5)
            .max(200),
        type: z
            .nativeEnum(FlatType)
            .optional()
            .default(FlatType.APARTMENT),
        area: z
            .number()
            .positive('Area must be positive')
            .optional(),
        isOccupied: z
            .boolean()
            .optional()
            .default(false),
    }).strict(),
});

export const updateFlatSchema = z.object({
    params: z.object({
        id: z.string().min(1, 'Flat ID is required'),
    }),
    body: z.object({
        unitNumber: z.string().min(1).max(20).trim().optional(),
        floor: z.number().int().min(-5).max(200).optional(),
        type: z.nativeEnum(FlatType).optional(),
        area: z.number().positive().optional().nullable(),
        isOccupied: z.boolean().optional(),
    }).strict(),
});

export const flatIdParamSchema = z.object({
    params: z.object({
        id: z.string().min(1, 'Flat ID is required'),
    }),
});

export type CreateFlatInput = z.infer<typeof createFlatSchema>['body'];
export type UpdateFlatInput = z.infer<typeof updateFlatSchema>['body'];
