import { Document, Types } from 'mongoose';
import { NotificationType, NotificationChannel } from '@shared/utils/constants';

/**
 * Per-user notification document.
 * Tenant-scoped via societyId (added by tenantScopePlugin).
 * TTL index on `expiresAt` auto-purges stale records.
 */
export interface INotification extends Document {
    _id: Types.ObjectId;
    societyId: Types.ObjectId;

    /** The user who should receive this notification */
    recipientId: Types.ObjectId;

    title: string;
    body: string;
    type: NotificationType;
    channel: NotificationChannel;

    /** Has the user read this notification? */
    isRead: boolean;
    readAt?: Date;

    /**
     * Arbitrary JSON payload forwarded to push providers (FCM, APNs).
     * Kept flexible so providers can be swapped without schema changes.
     */
    data?: Record<string, unknown>;

    sentAt: Date;
    expiresAt?: Date;

    createdAt: Date;
    updatedAt: Date;
}
