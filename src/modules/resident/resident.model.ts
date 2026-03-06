import mongoose, { Schema } from 'mongoose';
import { IResident } from './resident.types';
import { ResidentType, ResidentStatus } from '@shared/utils/constants';
import { tenantScopePlugin } from '@shared/plugins/tenant-scope.plugin';
import { auditLogPlugin } from '@shared/plugins/audit-log.plugin';

const residentSchema = new Schema<IResident>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            index: true,
        },
        fullName: {
            type: String,
            required: true,
            trim: true,
        },
        email: {
            type: String,
            required: true,
            trim: true,
        },
        phoneNumber: {
            type: String,
            required: true,
        },
        profilePic: {
            type: String,
            trim: true,
        },
        flatId: {
            type: Schema.Types.ObjectId,
            ref: 'Flat',
            required: true,
            index: true,
        },
        type: {
            type: String,
            enum: Object.values(ResidentType),
            default: ResidentType.OWNER,
            required: true,
        },
        status: {
            type: String,
            enum: Object.values(ResidentStatus),
            default: ResidentStatus.ACTIVE,
            required: true,
        },
        moveInDate: {
            type: Date,
        },
        moveOutDate: {
            type: Date,
        },
        vehicleNumbers: {
            type: [String],
            default: [],
        },
        emergencyContact: {
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
residentSchema.plugin(tenantScopePlugin);
residentSchema.plugin(auditLogPlugin);

// ── Indexes ──────────────────────────────────────────────
residentSchema.index({ societyId: 1, userId: 1 });
residentSchema.index({ societyId: 1, flatId: 1 });
residentSchema.index({ societyId: 1, status: 1 });

export const Resident = mongoose.model<IResident>('Resident', residentSchema);
