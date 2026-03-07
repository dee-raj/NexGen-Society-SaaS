import { Router } from 'express';
import { AuthController } from './auth.controller';
import { validate } from '@shared/middleware/validate';
import { authenticate } from '@shared/middleware/authenticate';
import { authRateLimiter } from '@shared/middleware/rate-limit';
import { registerSchema, loginSchema, refreshTokenSchema, forgotPasswordSchema, resetPasswordSchema } from './auth.validator';

const router = Router();

// ── Public routes (no auth required) ────────────────────
router.post(
    '/register',
    authRateLimiter,
    validate(registerSchema),
    AuthController.register,
);

router.post(
    '/login',
    authRateLimiter,
    validate(loginSchema),
    AuthController.login,
);

router.post(
    '/forgot-password',
    authRateLimiter,
    validate(forgotPasswordSchema),
    AuthController.forgotPassword,
);

router.post(
    '/reset-password',
    authRateLimiter,
    validate(resetPasswordSchema),
    AuthController.resetPassword,
);

router.post(
    '/refresh',
    validate(refreshTokenSchema),
    AuthController.refreshTokens,
);

router.post('/logout', AuthController.logout);

// ── Protected routes (auth required) ────────────────────
router.post('/logout-all', authenticate, AuthController.logoutAll);
router.get('/me', authenticate, AuthController.getProfile);
router.patch('/update-profile', authenticate, AuthController.updateProfile);
router.put('/change-password', authenticate, AuthController.changePassword);

export default router;
