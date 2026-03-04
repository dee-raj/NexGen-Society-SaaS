import mongoose, { Schema } from 'mongoose';
import { IStaff } from './staff.types';
import { StaffType, StaffDepartment, StaffStatus } from '@shared/utils/constants';
import { tenantScopePlugin } from '@shared/plugins/tenant-scope.plugin';
import { auditLogPlugin } from '@shared/plugins/audit-log.plugin';

const staffSchema = new Schema<IStaff>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        type: {
            type: String,
            enum: Object.values(StaffType),
            default: StaffType.PERMANENT,
            required: true,
        },
        department: {
            type: String,
            enum: Object.values(StaffDepartment),
            required: true,
        },
        status: {
            type: String,
            enum: Object.values(StaffStatus),
            default: StaffStatus.ACTIVE,
            required: true,
        },
        shiftTiming: {
            type: String,
            trim: true,
        },
        policeVerificationStatus: {
            type: String,
            enum: ['pending', 'verified', 'rejected'],
            default: 'pending',
        },
        joinedAt: {
            type: Date,
        },
        leftAt: {
            type: Date,
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
staffSchema.plugin(tenantScopePlugin);
staffSchema.plugin(auditLogPlugin);

// ── Indexes ──────────────────────────────────────────────
staffSchema.index({ societyId: 1, userId: 1 });
staffSchema.index({ societyId: 1, department: 1 });
staffSchema.index({ societyId: 1, status: 1 });

export const Staff = mongoose.model<IStaff>('Staff', staffSchema);
