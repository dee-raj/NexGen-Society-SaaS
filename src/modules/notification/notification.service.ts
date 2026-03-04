import { Document, Types } from 'mongoose';
import { Notification } from './notification.model';
import { INotification } from './notification.types';
import {
    SendNotificationInput,
    BroadcastInput,
    BroadcastGlobalInput,
} from './notification.validator';
import { Resident } from '@modules/resident/resident.model';
import { Society } from '@modules/society/society.model';
import { NotificationChannel, ResidentStatus, SocietyStatus } from '@shared/utils/constants';

// ─────────────────────────────────────────────────────────────
// Push-ready provider abstraction layer
// ─────────────────────────────────────────────────────────────

/**
 * Strategy interface for notification delivery providers.
 *
 * To add FCM / APNs / email support:
 *   1. Implement this interface in a new class.
 *   2. Register it in NotificationService via setProvider().
 *
 * The current default InAppProvider persists directly to MongoDB.
 */
export interface INotificationProvider {
    send(payload: Omit<INotification, keyof Document | 'societyId' | 'isRead' | 'sentAt' | 'createdAt' | 'updatedAt'>): Promise<void>;
}

/**
 * Default in-app provider – stores the notification in MongoDB.
 * Swap this out later by calling NotificationService.setProvider(new FcmProvider()).
 */
class InAppProvider implements INotificationProvider {
    async send(_payload: unknown): Promise<void> {
        // No-op: the service directly calls Notification.create()
        // for in-app; this hook is reserved for future push dispatch.
    }
}

// ─────────────────────────────────────────────────────────────
// Notification Service
// ─────────────────────────────────────────────────────────────

class NotificationServiceClass {
    private provider: INotificationProvider = new InAppProvider();

    /** Swap the delivery provider at runtime (e.g. FCM, APNs, email). */
    setProvider(provider: INotificationProvider): void {
        this.provider = provider;
    }

    // ── Core helpers ────────────────────────────────────────

    private buildDoc(
        societyId: string,
        recipientId: string,
        input: BroadcastInput | SendNotificationInput,
    ): Partial<INotification> {
        return {
            societyId: new Types.ObjectId(societyId),
            recipientId: new Types.ObjectId(recipientId),
            title: input.title,
            body: input.body,
            type: input.type,
            channel: (input.channel ?? NotificationChannel.IN_APP) as INotification['channel'],
            isRead: false,
            data: input.data,
            sentAt: new Date(),
            expiresAt: input.expiresAt ? new Date(input.expiresAt) : undefined,
        };
    }

    // ── API ─────────────────────────────────────────────────

    /**
     * Send a notification to a single user within a tenant.
     * SOCIETY_ADMIN / SUPER_ADMIN scope.
     */
    async sendToUser(
        societyId: string,
        input: SendNotificationInput,
    ): Promise<INotification> {
        const doc = this.buildDoc(societyId, input.recipientId, input);
        const notification = await Notification.create(doc);
        // Hook for future provider dispatch
        await this.provider.send(input as never);
        return notification;
    }

    /**
     * Fan-out notification to ALL active residents of a society.
     * Runs insertMany for efficiency; does not use transactions
     * (non-critical delivery — dropped docs can be retried).
     */
    async broadcastToSociety(
        societyId: string,
        input: BroadcastInput,
    ): Promise<{ sent: number }> {
        const residents = await Resident.find(
            { societyId: new Types.ObjectId(societyId), status: ResidentStatus.ACTIVE },
            { _id: 1 },
        ).lean();

        if (residents.length === 0) return { sent: 0 };

        const docs = residents.map((r) =>
            this.buildDoc(societyId, r._id.toString(), input),
        );

        await Notification.insertMany(docs);
        return { sent: docs.length };
    }

    /**
     * Super Admin global broadcast — fan-out to every active resident
     * across ALL active societies.
     */
    async broadcastGlobal(input: BroadcastGlobalInput): Promise<{ sent: number }> {
        const activeSocieties = await Society.find(
            { status: SocietyStatus.ACTIVE },
            { _id: 1 },
        ).lean();

        if (activeSocieties.length === 0) return { sent: 0 };

        const societyIds = activeSocieties.map((s) => s._id);

        const residents = await Resident.find(
            { societyId: { $in: societyIds }, status: ResidentStatus.ACTIVE },
            { _id: 1, societyId: 1 },
        ).lean();

        if (residents.length === 0) return { sent: 0 };

        const docs = residents.map((r) =>
            this.buildDoc(r.societyId.toString(), r._id.toString(), input),
        );

        await Notification.insertMany(docs);
        return { sent: docs.length };
    }

    // ── Read / Mark-read ────────────────────────────────────

    /** Paginated list of notifications for a user within a tenant. */
    async getForUser(
        societyId: string,
        recipientId: string,
        page = 1,
        limit = 20,
    ): Promise<{ data: INotification[]; total: number }> {
        const filter = {
            societyId: new Types.ObjectId(societyId),
            recipientId: new Types.ObjectId(recipientId),
        };
        const skip = (page - 1) * limit;

        const [data, total] = await Promise.all([
            Notification.find(filter).sort({ sentAt: -1 }).skip(skip).limit(limit),
            Notification.countDocuments(filter),
        ]);

        return { data, total };
    }

    /** Count of unread notifications for a user within a tenant. */
    async getUnreadCount(societyId: string, recipientId: string): Promise<number> {
        return Notification.countDocuments({
            societyId: new Types.ObjectId(societyId),
            recipientId: new Types.ObjectId(recipientId),
            isRead: false,
        });
    }

    /** Mark a single notification as read (scoped to owner). */
    async markAsRead(
        societyId: string,
        recipientId: string,
        notificationId: string,
    ): Promise<INotification | null> {
        if (!Types.ObjectId.isValid(notificationId)) return null;
        return Notification.findOneAndUpdate(
            {
                _id: notificationId,
                societyId: new Types.ObjectId(societyId),
                recipientId: new Types.ObjectId(recipientId),
            },
            { isRead: true, readAt: new Date() },
            { new: true },
        );
    }

    /** Mark ALL notifications as read for a user within a tenant. */
    async markAllRead(societyId: string, recipientId: string): Promise<{ updated: number }> {
        const result = await Notification.updateMany(
            {
                societyId: new Types.ObjectId(societyId),
                recipientId: new Types.ObjectId(recipientId),
                isRead: false,
            },
            { isRead: true, readAt: new Date() },
        );
        return { updated: result.modifiedCount };
    }
}

/** Singleton instance */
export const NotificationService = new NotificationServiceClass();
