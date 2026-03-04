import { Router } from 'express';
import { AuthController } from './auth.controller';
import { validate } from '@shared/middleware/validate';
import { authenticate } from '@shared/middleware/authenticate';
import { authRateLimiter } from '@shared/middleware/rate-limit';
import { registerSchema, loginSchema, refreshTokenSchema } from './auth.validator';

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
    '/refresh',
    validate(refreshTokenSchema),
    AuthController.refreshTokens,
);

router.post('/logout', AuthController.logout);

// ── Protected routes (auth required) ────────────────────
router.post('/logout-all', authenticate, AuthController.logoutAll);
router.get('/me', authenticate, AuthController.getProfile);

export default router;
