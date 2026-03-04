import mongoose, { Schema } from 'mongoose';
import { ISociety } from './society.types';
import { SocietyStatus } from '@shared/utils/constants';
import { auditLogPlugin } from '@shared/plugins/audit-log.plugin';

const societySchema = new Schema<ISociety>(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            maxlength: 200,
        },
        registrationNumber: {
            type: String,
            trim: true,
            sparse: true,
            unique: true,
        },
        address: {
            type: String,
            required: true,
            trim: true,
            maxlength: 500,
        },
        city: {
            type: String,
            required: true,
            trim: true,
            maxlength: 100,
        },
        state: {
            type: String,
            required: true,
            trim: true,
            maxlength: 100,
        },
        pincode: {
            type: String,
            required: true,
            trim: true,
            match: /^\d{4,10}$/,
        },
        status: {
            type: String,
            enum: Object.values(SocietyStatus),
            default: SocietyStatus.ONBOARDING,
            required: true,
        },
        contactEmail: {
            type: String,
            trim: true,
            lowercase: true,
        },
        contactPhone: {
            type: String,
            trim: true,
        },
        totalBuildings: {
            type: Number,
            default: 0,
            min: 0,
        },
        totalFlats: {
            type: Number,
            default: 0,
            min: 0,
        },
        logoUrl: {
            type: String,
            trim: true,
        },
    },
    {
        timestamps: true,
        toJSON: {
            transform(_doc, ret: Record<string, unknown>) {
                ret.id = (ret._id as mongoose.Types.ObjectId)?.toString();
                delete ret.__v;
                return ret;
            },
        },
    },
);

// ── Plugins ──────────────────────────────────────────────
// NO tenantScopePlugin — Society IS the tenant
societySchema.plugin(auditLogPlugin);

// ── Indexes ──────────────────────────────────────────────
societySchema.index({ status: 1 });
societySchema.index({ city: 1, state: 1 });
societySchema.index({ name: 'text' });

export const Society = mongoose.model<ISociety>('Society', societySchema);
