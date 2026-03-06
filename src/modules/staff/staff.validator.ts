import { z } from 'zod';
import { StaffType, StaffDepartment, StaffStatus } from '@shared/utils/constants';

export const createStaffSchema = z.object({
    body: z.object({
        fullName: z
            .string({ message: 'Full name is required' })
            .min(1, 'Full name is required'),
        profilePic: z
            .string()
            .trim()
            .optional(),
        email: z
            .email({ message: 'Invalid email address' })
            .optional(),
        phoneNumber: z
            .string()
            .min(10, 'Phone number must be at least 10 digits')
            .max(15, 'Phone number must be at most 15 digits')
            .optional(),
        type: z
            .enum(StaffType)
            .optional()
            .default(StaffType.PERMANENT),
        department: z
            .enum(StaffDepartment),
        status: z
            .enum(StaffStatus)
            .optional()
            .default(StaffStatus.ACTIVE),
        shiftTiming: z
            .string()
            .trim()
            .optional(),
        policeVerificationStatus: z
            .enum(['pending', 'verified', 'rejected'])
            .optional()
            .default('pending'),
        joinedAt: z
            .string()
            .datetime({ message: 'joinedAt must be a valid ISO date' })
            .optional(),
    }).strict(),
});

export const updateStaffSchema = z.object({
    params: z.object({
        id: z.string().min(1, 'Staff ID is required'),
    }),
    body: z.object({
        type: z.enum(StaffType).optional(),
        department: z.enum(StaffDepartment).optional(),
        status: z.enum(StaffStatus).optional(),
        shiftTiming: z.string().trim().optional().nullable(),
        policeVerificationStatus: z.enum(['pending', 'verified', 'rejected']).optional(),
        joinedAt: z.string().datetime().optional().nullable(),
        leftAt: z.string().datetime().optional().nullable(),
    }).strict(),
});

export const staffIdParamSchema = z.object({
    params: z.object({
        id: z.string().min(1, 'Staff ID is required'),
    }),
});

export type CreateStaffInput = z.infer<typeof createStaffSchema>['body'];
export type UpdateStaffInput = z.infer<typeof updateStaffSchema>['body'];
