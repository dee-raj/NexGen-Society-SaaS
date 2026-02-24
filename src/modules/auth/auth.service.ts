import jwt, { SignOptions } from 'jsonwebtoken';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../../config';
import { logger } from '../../config/logger';
import { User } from './auth.model';
import { RefreshToken } from './refresh-token.model';
import {
    AuthTokens,
    AuthResponse,
    AccessTokenPayload,
    RefreshTokenPayload,
    IUser,
} from './auth.types';
import { RegisterInput, LoginInput } from './auth.validator';
import {
    ConflictError,
    UnauthorizedError,
    BadRequestError,
} from '../../shared/utils/api-error';
import { Role } from '../../shared/utils/constants';

// ── Helpers ──────────────────────────────────────────────

/** Hash a refresh token before storing — never store raw tokens */
function hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
}

/** Sign a short-lived access token */
function signAccessToken(payload: AccessTokenPayload): string {
    return jwt.sign(payload, config.JWT_ACCESS_SECRET, {
        expiresIn: config.JWT_ACCESS_EXPIRY as SignOptions['expiresIn'],
    });
}

/** Sign a long-lived refresh token */
function signRefreshToken(payload: RefreshTokenPayload): string {
    return jwt.sign(payload, config.JWT_REFRESH_SECRET, {
        expiresIn: config.JWT_REFRESH_EXPIRY as SignOptions['expiresIn'],
    });
}

/** Parse JWT_REFRESH_EXPIRY string (e.g. '7d') into milliseconds */
function parseExpiryToMs(expiry: string): number {
    const unit = expiry.slice(-1);
    const value = parseInt(expiry.slice(0, -1), 10);
    const multipliers: Record<string, number> = {
        s: 1_000,
        m: 60_000,
        h: 3_600_000,
        d: 86_400_000,
    };
    return value * (multipliers[unit] || 86_400_000);
}

/** Build the standardized AuthResponse from a user document */
function buildAuthResponse(user: IUser, tokens: AuthTokens): AuthResponse {
    return {
        user: {
            id: user._id.toString(),
            email: user.email,
            fullName: user.fullName,
            role: user.role,
            ...(user.societyId && { societyId: user.societyId.toString() }),
        },
        tokens,
    };
}

// ── Service Methods ──────────────────────────────────────

export class AuthService {
    /**
     * Register a new user.
     * Password is hashed by the User model pre-save hook.
     */
    static async register(input: RegisterInput): Promise<AuthResponse> {
        const existingUser = await User.findOne({ email: input.email });
        if (existingUser) {
            throw new ConflictError('A user with this email already exists');
        }

        const user = await User.create({
            email: input.email,
            password: input.password,
            fullName: input.fullName,
            phone: input.phone,
            role: input.role || Role.RESIDENT,
        });

        const tokens = await AuthService.generateTokenPair(user);

        logger.info({ userId: user._id, email: user.email }, 'User registered');
        return buildAuthResponse(user, tokens);
    }

    /**
     * Authenticate with email + password.
     * `select('+password')` is needed because the field has `select: false`.
     */
    static async login(input: LoginInput): Promise<AuthResponse> {
        const user = await User.findOne({ email: input.email }).select('+password');
        if (!user) {
            throw new UnauthorizedError('Invalid email or password');
        }

        if (!user.isActive) {
            throw new UnauthorizedError('Account is deactivated — contact support');
        }

        const isMatch = await user.comparePassword(input.password);
        if (!isMatch) {
            throw new UnauthorizedError('Invalid email or password');
        }

        // Update last login timestamp
        user.lastLoginAt = new Date();
        await user.save();

        const tokens = await AuthService.generateTokenPair(user);

        logger.info({ userId: user._id }, 'User logged in');
        return buildAuthResponse(user, tokens);
    }

    /**
     * Rotate refresh token.
     *
     * Security model:
     * 1. Verify the refresh JWT signature and extract payload
     * 2. Find the stored token by (userId, family) and compare hash
     * 3. If the hash doesn't match → REUSE DETECTED → revoke entire family
     * 4. If valid, delete the old token, issue new pair, store new hash
     */
    static async refreshTokens(rawRefreshToken: string): Promise<AuthResponse> {
        let payload: RefreshTokenPayload;

        try {
            payload = jwt.verify(
                rawRefreshToken,
                config.JWT_REFRESH_SECRET,
            ) as RefreshTokenPayload;
        } catch {
            throw new UnauthorizedError('Invalid or expired refresh token');
        }

        const tokenHash = hashToken(rawRefreshToken);

        // Find the stored token for this family
        const storedToken = await RefreshToken.findOne({
            userId: payload.userId,
            family: payload.family,
        });

        if (!storedToken) {
            // Family doesn't exist — token was already revoked
            throw new UnauthorizedError('Refresh token has been revoked');
        }

        // ── Reuse detection ─────────────────────────────────
        if (storedToken.tokenHash !== tokenHash) {
            // Someone is using an OLD token from this family.
            // This means the real token was stolen OR the legitimate
            // user's new token was stolen. Either way, nuke the family.
            logger.warn(
                { userId: payload.userId, family: payload.family },
                '🚨 Refresh token reuse detected — revoking family',
            );
            await RefreshToken.deleteMany({
                userId: payload.userId,
                family: payload.family,
            });
            throw new UnauthorizedError('Refresh token reuse detected — please log in again');
        }

        // Token is valid — fetch user
        const user = await User.findById(payload.userId);
        if (!user || !user.isActive) {
            await RefreshToken.deleteMany({ userId: payload.userId });
            throw new UnauthorizedError('User not found or deactivated');
        }

        // Delete old token and issue new pair (same family)
        await RefreshToken.deleteOne({ _id: storedToken._id });
        const tokens = await AuthService.generateTokenPair(user, payload.family);

        logger.debug({ userId: user._id, family: payload.family }, 'Token rotated');
        return buildAuthResponse(user, tokens);
    }

    /**
     * Logout — revoke the specific refresh token family.
     */
    static async logout(rawRefreshToken: string): Promise<void> {
        try {
            const payload = jwt.verify(
                rawRefreshToken,
                config.JWT_REFRESH_SECRET,
            ) as RefreshTokenPayload;

            await RefreshToken.deleteMany({
                userId: payload.userId,
                family: payload.family,
            });

            logger.info({ userId: payload.userId }, 'User logged out — family revoked');
        } catch {
            // Token is invalid/expired — that's fine, just return success
            logger.debug('Logout called with invalid token — no-op');
        }
    }

    /**
     * Logout from all sessions — nuke all refresh tokens for a user.
     */
    static async logoutAll(userId: string): Promise<void> {
        await RefreshToken.deleteMany({ userId });
        logger.info({ userId }, 'All sessions revoked');
    }

    // ── Internal ──────────────────────────────────────────

    /**
     * Generate an access + refresh token pair.
     * Stores the refresh token hash in the DB.
     *
     * @param user   - The authenticated user document
     * @param family - Reuse same family on rotation; new family on fresh login
     */
    private static async generateTokenPair(
        user: IUser,
        family?: string,
    ): Promise<AuthTokens> {
        const tokenFamily = family || uuidv4();

        const accessPayload: AccessTokenPayload = {
            userId: user._id.toString(),
            email: user.email,
            role: user.role,
            ...(user.societyId && { societyId: user.societyId.toString() }),
        };

        const refreshPayload: RefreshTokenPayload = {
            userId: user._id.toString(),
            family: tokenFamily,
        };

        const accessToken = signAccessToken(accessPayload);
        const refreshToken = signRefreshToken(refreshPayload);

        // Store the HASH of the refresh token — never the raw value
        await RefreshToken.create({
            userId: user._id,
            tokenHash: hashToken(refreshToken),
            family: tokenFamily,
            expiresAt: new Date(Date.now() + parseExpiryToMs(config.JWT_REFRESH_EXPIRY)),
        });

        return { accessToken, refreshToken };
    }
}
