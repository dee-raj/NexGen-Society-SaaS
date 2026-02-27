import mongoose, { Schema } from 'mongoose';
import { IFlat } from './flat.types';
import { FlatType } from '../../shared/utils/constants';
import { tenantScopePlugin } from '../../shared/plugins/tenant-scope.plugin';
import { auditLogPlugin } from '../../shared/plugins/audit-log.plugin';

const flatSchema = new Schema<IFlat>(
    {
        buildingId: {
            type: Schema.Types.ObjectId,
            ref: 'Building',
            required: true,
            index: true,
        },
        unitNumber: {
            type: String,
            required: true,
            trim: true,
            maxlength: 20,
        },
        floor: {
            type: Number,
            required: true,
            min: -5, // basement levels
            max: 200,
        },
        type: {
            type: String,
            enum: Object.values(FlatType),
            default: FlatType.APARTMENT,
            required: true,
        },
        area: {
            type: Number,
            min: 0,
        },
        isOccupied: {
            type: Boolean,
            default: false,
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
flatSchema.plugin(tenantScopePlugin);
flatSchema.plugin(auditLogPlugin);

// ── Indexes ──────────────────────────────────────────────
flatSchema.index({ societyId: 1, buildingId: 1, unitNumber: 1 }, { unique: true });
flatSchema.index({ buildingId: 1, floor: 1 });

export const Flat = mongoose.model<IFlat>('Flat', flatSchema);
