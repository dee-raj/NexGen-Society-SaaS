import mongoose, { Schema } from 'mongoose';
import { INotice, NoticePriority } from './notices.types';
import { tenantScopePlugin } from '@shared/plugins/tenant-scope.plugin';
import { auditLogPlugin } from '@shared/plugins/audit-log.plugin';

const noticeSchema = new Schema<INotice>(
    {
        title: {
            type: String,
            required: true,
            trim: true,
            maxlength: 200,
        },
        content: {
            type: String,
            required: true,
            maxlength: 5000,
        },
        priority: {
            type: String,
            enum: Object.values(NoticePriority),
            default: NoticePriority.MEDIUM,
            required: true,
        },
        isPublished: {
            type: Boolean,
            default: false,
        },
        publishedAt: {
            type: Date,
        },
        expiresAt: {
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
// tenantScopePlugin adds `societyId` field + query enforcement
noticeSchema.plugin(tenantScopePlugin);
noticeSchema.plugin(auditLogPlugin);

// ── Indexes ──────────────────────────────────────────────
noticeSchema.index({ societyId: 1, isPublished: 1, createdAt: -1 });
noticeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const Notice = mongoose.model<INotice>('Notice', noticeSchema);
