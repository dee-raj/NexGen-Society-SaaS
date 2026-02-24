import mongoose, { Schema } from 'mongoose';
import { IRefreshToken } from './auth.types';

const refreshTokenSchema = new Schema<IRefreshToken>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        tokenHash: {
            type: String,
            required: true,
        },
        /**
         * Token family: a UUID assigned when a user first logs in.
         * Every refresh rotation keeps the same family.
         * If token reuse is detected (same token refreshed twice),
         * we revoke the ENTIRE family — forcing re-login.
         */
        family: {
            type: String,
            required: true,
            index: true,
        },
        expiresAt: {
            type: Date,
            required: true,
            index: { expireAfterSeconds: 0 }, // TTL index — MongoDB auto-deletes expired tokens
        },
    },
    {
        timestamps: { createdAt: true, updatedAt: false },
    },
);

// Compound index for efficient lookups during refresh
refreshTokenSchema.index({ userId: 1, family: 1 });

export const RefreshToken = mongoose.model<IRefreshToken>('RefreshToken', refreshTokenSchema);
