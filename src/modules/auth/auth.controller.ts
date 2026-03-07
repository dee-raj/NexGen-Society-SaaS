import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { ApiResponse } from '@shared/utils/api-response';
import { StatusCodes } from 'http-status-codes';
import { BadRequestError } from '@shared/utils/api-error';
import { asyncHandler } from '@shared/utils/async-handler';

export class AuthController {
    /**
     * POST /auth/register
     * Body: { email, password, fullName, phone?, role? }
     */
    static register = asyncHandler(async (req: Request, res: Response): Promise<void> => {
        const result = await AuthService.register(req.body);
        ApiResponse.created(res, result);
    });

    /**
     * POST /auth/login
     * Body: { email, password }
     */
    static login = asyncHandler(async (req: Request, res: Response): Promise<void> => {
        const result = await AuthService.login(req.body);
        ApiResponse.success(res, result);
    });

    /**
     * POST /auth/refresh
     * Body: { refreshToken }
     */
    static refreshTokens = asyncHandler(async (req: Request, res: Response): Promise<void> => {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            throw new BadRequestError('Refresh token is required');
        }

        const result = await AuthService.refreshTokens(refreshToken);
        ApiResponse.success(res, result);
    });

    /**
     * POST /auth/logout
     * Body: { refreshToken }
     */
    static logout = asyncHandler(async (req: Request, res: Response): Promise<void> => {
        const { refreshToken } = req.body;
        if (refreshToken) {
            await AuthService.logout(refreshToken);
        }
        ApiResponse.success(res, { message: 'Logged out successfully' });
    });

    /**
     * POST /auth/logout-all
     * Requires authentication — revokes all sessions for the current user.
     */
    static logoutAll = asyncHandler(async (req: Request, res: Response): Promise<void> => {
        if (!req.user) {
            throw new BadRequestError('Authentication required');
        }
        await AuthService.logoutAll(req.user.userId);
        ApiResponse.success(res, { message: 'All sessions revoked' });
    });

    /**
     * GET /auth/me
     * Returns the currently authenticated user's profile.
     */
    static getProfile = asyncHandler(async (req: Request, res: Response): Promise<void> => {
        if (!req.user) {
            throw new BadRequestError('Authentication required');
        }

        // Re-fetch full user doc (without password)
        const { User } = await import('./auth.model');
        const user = await User.findById(req.user.userId);
        if (!user) {
            throw new BadRequestError('User not found');
        }

        ApiResponse.success(res, {
            id: user._id.toString(),
            email: user.email,
            fullName: user.fullName,
            phone: user.phone,
            role: user.role,
            societyId: user.societyId?.toString(),
            isActive: user.isActive,
            lastLoginAt: user.lastLoginAt,
            createdAt: user.createdAt,
        });
    });

    static updateProfile = asyncHandler(async (req: Request, res: Response): Promise<void> => {
        if (!req.user) {
            throw new BadRequestError('Authentication required');
        }
        const result = await AuthService.updateProfile(req.user.userId, req.body);

        ApiResponse.success(res, {
            id: result._id.toString(),
            email: result.email,
            fullName: result.fullName,
            phone: result.phone,
            role: result.role,
        });
    });

    // changePassword
    static changePassword = asyncHandler(async (req: Request, res: Response): Promise<void> => {
        if (!req.user) {
            throw new BadRequestError('Authentication required');
        }
        const result = await AuthService.changePassword(req.user.userId, req.body.newPassword);
        ApiResponse.success(res, result);
    });

    /**
     * POST /auth/forgot-password
     * Body: { email }
     */
    static forgotPassword = asyncHandler(async (req: Request, res: Response): Promise<void> => {
        const { email } = req.body;
        await AuthService.forgotPassword(email);
        ApiResponse.success(res, { message: 'If an account exists with that email, a reset link has been sent.' });
    });

    /**
     * POST /auth/reset-password
     * Body: { token, newPassword }
     */
    static resetPassword = asyncHandler(async (req: Request, res: Response): Promise<void> => {
        const { token, newPassword } = req.body;
        await AuthService.resetPassword(token, newPassword);
        ApiResponse.success(res, { message: 'Password has been reset successfully. Please log in with your new password.' });
    });
}
