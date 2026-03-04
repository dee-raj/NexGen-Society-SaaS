import mongoose, { Schema } from 'mongoose';
import { IBuilding } from './building.types';
import { BuildingType } from '@shared/utils/constants';
import { tenantScopePlugin } from '@shared/plugins/tenant-scope.plugin';
import { auditLogPlugin } from '@shared/plugins/audit-log.plugin';

const buildingSchema = new Schema<IBuilding>(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            maxlength: 100,
        },
        type: {
            type: String,
            enum: Object.values(BuildingType),
            default: BuildingType.RESIDENTIAL,
            required: true,
        },
        totalFloors: {
            type: Number,
            required: true,
            min: 1,
            max: 200,
        },
        totalFlats: {
            type: Number,
            default: 0,
            min: 0,
        },
        description: {
            type: String,
            trim: true,
            maxlength: 500,
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
buildingSchema.plugin(tenantScopePlugin);
buildingSchema.plugin(auditLogPlugin);

// ── Indexes ──────────────────────────────────────────────
buildingSchema.index({ societyId: 1, name: 1 }, { unique: true });

export const Building = mongoose.model<IBuilding>('Building', buildingSchema);
