import bcrypt from 'bcryptjs';
import { IUser } from './auth.types';
import { Role } from '@shared/utils/constants';
import mongoose, { Schema } from 'mongoose';

const BCRYPT_ROUNDS = 12;

const userSchema = new Schema<IUser>(
    {
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            index: true,
        },
        password: {
            type: String,
            required: true,
            minlength: 8,
            select: false, // Never returned in queries by default
        },
        fullName: {
            type: String,
            required: true,
            trim: true,
            maxlength: 100,
        },
        phone: {
            type: String,
            trim: true,
        },
        role: {
            type: String,
            enum: Object.values(Role),
            default: Role.RESIDENT,
            required: true,
        },
        societyId: {
            type: Schema.Types.ObjectId,
            ref: 'Society',
            index: true,
            // Not required — SUPER_ADMIN has no society
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        lastLoginAt: {
            type: Date,
        },
    },
    {
        timestamps: true,
        toJSON: {
            transform(_doc, ret: Record<string, any>) {
                ret.id = ret._id?.toString();
                delete ret.password;
                delete ret.__v;
                return ret;
            },
        },
    },
);



// ── Compound indexes ──────────────────────────────────
userSchema.index({ societyId: 1, email: 1 });
userSchema.index({ societyId: 1, role: 1 });

// ── Pre-save: hash password on create/change ──────────
userSchema.pre('save', async function () {
    if (!this.isModified('password')) return;

    const salt = await bcrypt.genSalt(BCRYPT_ROUNDS);
    this.password = await bcrypt.hash(this.password, salt);
});

// ── Instance method: password comparison ──────────────
userSchema.methods.comparePassword = async function (
    candidatePassword: string,
): Promise<boolean> {
    return bcrypt.compare(candidatePassword, this.password);
};

export const User = mongoose.model<IUser>('User', userSchema);
