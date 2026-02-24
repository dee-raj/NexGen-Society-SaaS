import { Document, Types } from 'mongoose';
import { Role } from '../../shared/utils/constants';

/** User document shape after Mongoose hydration */
export interface IUser extends Document {
    _id: Types.ObjectId;
    email: string;
    password: string;
    fullName: string;
    phone?: string;
    role: Role;
    societyId?: Types.ObjectId;
    isActive: boolean;
    lastLoginAt?: Date;
    createdAt: Date;
    updatedAt: Date;

    /** Instance method: compare plaintext against hash */
    comparePassword(candidatePassword: string): Promise<boolean>;
}

/** RefreshToken document — stored hashed, one per token family */
export interface IRefreshToken extends Document {
    _id: Types.ObjectId;
    userId: Types.ObjectId;
    tokenHash: string;
    /** Token family ID for rotation chain — revoking a family kills all its descendants */
    family: string;
    expiresAt: Date;
    createdAt: Date;
}

/** Payload embedded in the JWT access token */
export interface AccessTokenPayload {
    userId: string;
    email: string;
    role: Role;
    societyId?: string;
}

/** Payload embedded in the JWT refresh token */
export interface RefreshTokenPayload {
    userId: string;
    family: string;
}

/** Shape returned by auth service after login/register/refresh */
export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
}

/** Shape returned to the client on auth success */
export interface AuthResponse {
    user: {
        id: string;
        email: string;
        fullName: string;
        role: Role;
        societyId?: string;
    };
    tokens: AuthTokens;
}
