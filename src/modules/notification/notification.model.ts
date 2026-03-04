import mongoose, { Schema } from 'mongoose';
import { INotification } from './notification.types';
import { NotificationType, NotificationChannel } from '@shared/utils/constants';
import { tenantScopePlugin } from '@shared/plugins/tenant-scope.plugin';
import { auditLogPlugin } from '@shared/plugins/audit-log.plugin';

const notificationSchema = new Schema<INotification>(
    {
        recipientId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        title: {
            type: String,
            required: true,
            trim: true,
            maxlength: 200,
        },
        body: {
            type: String,
            required: true,
            maxlength: 2000,
        },
        type: {
            type: String,
            enum: Object.values(NotificationType),
            required: true,
        },
        channel: {
            type: String,
            enum: Object.values(NotificationChannel),
            default: NotificationChannel.IN_APP,
            required: true,
        },
        isRead: {
            type: Boolean,
            default: false,
        },
        readAt: {
            type: Date,
        },
        data: {
            type: Schema.Types.Mixed,
        },
        sentAt: {
            type: Date,
            default: Date.now,
            required: true,
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
notificationSchema.plugin(tenantScopePlugin);
notificationSchema.plugin(auditLogPlugin);

// ── Indexes ──────────────────────────────────────────────
// Primary read pattern: "my unread notifications"
notificationSchema.index({ societyId: 1, recipientId: 1, isRead: 1, sentAt: -1 });
// Admin broadcast queries: all notifications of a type for a society
notificationSchema.index({ societyId: 1, type: 1, sentAt: -1 });
// TTL – auto-expire notifications after expiresAt
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0, sparse: true });

export const Notification = mongoose.model<INotification>('Notification', notificationSchema);
