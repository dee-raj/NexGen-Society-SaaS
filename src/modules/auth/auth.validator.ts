import { z } from 'zod';
import { Role } from '@shared/utils/constants';

export const registerSchema = z.object({
    body: z.object({
        email: z
            .string({ message: 'Email is required' })
            .trim()
            .toLowerCase()
            .email('Invalid email format'),
        password: z
            .string({ message: 'Password is required' })
            .min(8, 'Password must be at least 8 characters')
            .max(72, 'Password must not exceed 72 characters') // bcrypt limit
            .regex(
                /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/, // /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/
                'Password must contain uppercase, lowercase, number, and special character',
            ),
        fullName: z
            .string({ message: 'Full name is required' })
            .min(2, 'Name must be at least 2 characters')
            .max(100, 'Name must not exceed 100 characters')
            .trim(),
        phone: z
            .string()
            .regex(/^\+?[\d\s-]{10,15}$/, 'Invalid phone number')
            .optional(),
        role: z
            .enum(Role) // no super admin here
            .optional()
            .default(Role.RESIDENT),
    }).strict(),
});

export const loginSchema = z.object({
    body: z.object({
        email: z
            .string({ message: 'Email is required' })
            .trim()
            .toLowerCase()
            .email('Invalid email format'),
        password: z
            .string({ message: 'Password is required' })
            .min(1, 'Password is required'),
    }).strict(),
});

export const updateProfileSchema = z.object({
    body: z.object({
        email: z
            .string({ message: 'Email is required' })
            .trim()
            .toLowerCase()
            .email('Invalid email format'),
        fullName: z
            .string({ message: 'Full name is required' })
            .min(2, 'Name must be at least 2 characters')
            .max(100, 'Name must not exceed 100 characters')
            .trim(),
        phoneNumber: z
            .string()
            .regex(/^\+?[\d\s-]{10,15}$/, 'Invalid phone number')
            .optional(),
    }).strict(),
});

export const changePasswordSchema = z.object({
    body: z.object({
        newPassword: z
            .string({ message: 'New password is required' })
            .min(8, 'New password must be at least 8 characters')
            .max(72, 'New password must not exceed 72 characters')
            .regex(
                /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/,
                'Password must contain uppercase, lowercase, number, and special character',
            ),
    }).strict(),
});

export const refreshTokenSchema = z.object({
    body: z.object({
        refreshToken: z
            .string({ message: 'Refresh token is required' })
            .min(1, 'Refresh token is required'),
    }).strict(),
});

export const forgotPasswordSchema = z.object({
    body: z.object({
        email: z
            .string({ message: 'Email is required' })
            .trim()
            .toLowerCase()
            .email('Invalid email format'),
    }).strict(),
});

export const resetPasswordSchema = z.object({
    body: z.object({
        token: z.string({ message: 'Reset token is required' }),
        newPassword: z
            .string({ message: 'New password is required' })
            .min(8, 'New password must be at least 8 characters')
            .max(72, 'New password must not exceed 72 characters')
            .regex(
                /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/,
                'Password must contain uppercase, lowercase, number, and special character',
            ),
    }).strict(),
});

export type RegisterInput = z.infer<typeof registerSchema>['body'];
export type LoginInput = z.infer<typeof loginSchema>['body'];
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>['body'];
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>['body'];
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>['body'];
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>['body'];
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>['body'];
