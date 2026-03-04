import { z } from 'zod';
import { BuildingType } from '@shared/utils/constants';

export const createBuildingSchema = z.object({
    body: z.object({
        name: z
            .string({ message: 'Name is required' })
            .min(1, 'Name is required')
            .max(100, 'Name must not exceed 100 characters')
            .trim(),
        type: z
            .enum(BuildingType)
            .optional()
            .default(BuildingType.RESIDENTIAL),
        totalFloors: z
            .number({ message: 'Total floors is required' })
            .int()
            .min(1, 'Must have at least 1 floor')
            .max(200),
        description: z
            .string()
            .max(500)
            .trim()
            .optional(),
    }).strict(),
});

export const updateBuildingSchema = z.object({
    params: z.object({
        id: z.string().min(1, 'Building ID is required'),
    }),
    body: z.object({
        name: z.string().min(1).max(100).trim().optional(),
        type: z.enum(BuildingType).optional(),
        totalFloors: z.number().int().min(1).max(200).optional(),
        description: z.string().max(500).trim().optional().nullable(),
    }).strict(),
});

export const buildingIdParamSchema = z.object({
    params: z.object({
        id: z.string().min(1, 'Building ID is required'),
    }),
});

export type CreateBuildingInput = z.infer<typeof createBuildingSchema>['body'];
export type UpdateBuildingInput = z.infer<typeof updateBuildingSchema>['body'];
