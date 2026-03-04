import { z } from 'zod';
import { NotificationType, NotificationChannel } from '@shared/utils/constants';

// ── Send to a single user ─────────────────────────────────

export const sendNotificationSchema = z.object({
    body: z
        .object({
            recipientId: z.string().min(1, 'recipientId is required'),
            title: z
                .string()
                .min(2, 'Title must be at least 2 characters')
                .max(200, 'Title must not exceed 200 characters')
                .trim(),
            body: z
                .string()
                .min(1, 'Body is required')
                .max(2000, 'Body must not exceed 2000 characters'),
            type: z.enum(NotificationType).optional().default(NotificationType.CUSTOM),
            channel: z
                .enum(NotificationChannel)
                .optional()
                .default(NotificationChannel.IN_APP),
            data: z.record(z.string(), z.unknown()).optional(),
            expiresAt: z
                .string()
                .datetime({ message: 'expiresAt must be a valid ISO date' })
                .optional(),
        })
        .strict(),
});

// ── Broadcast to entire society ───────────────────────────

export const broadcastSchema = z.object({
    body: z
        .object({
            title: z
                .string()
                .min(2, 'Title must be at least 2 characters')
                .max(200, 'Title must not exceed 200 characters')
                .trim(),
            body: z
                .string()
                .min(1, 'Body is required')
                .max(2000, 'Body must not exceed 2000 characters'),
            type: z.enum(NotificationType).optional().default(NotificationType.CUSTOM),
            channel: z
                .enum(NotificationChannel)
                .optional()
                .default(NotificationChannel.IN_APP),
            data: z.record(z.string(), z.unknown()).optional(),
            expiresAt: z
                .string()
                .datetime({ message: 'expiresAt must be a valid ISO date' })
                .optional(),
        })
        .strict(),
});

// ── Global broadcast (Super Admin) ───────────────────────

export const broadcastGlobalSchema = z.object({
    body: z
        .object({
            title: z
                .string()
                .min(2, 'Title must be at least 2 characters')
                .max(200, 'Title must not exceed 200 characters')
                .trim(),
            body: z
                .string()
                .min(1, 'Body is required')
                .max(2000, 'Body must not exceed 2000 characters'),
            type: z.enum(NotificationType).optional().default(NotificationType.SYSTEM),
            channel: z
                .enum(NotificationChannel)
                .optional()
                .default(NotificationChannel.IN_APP),
            data: z.record(z.string(), z.unknown()).optional(),
            expiresAt: z
                .string()
                .datetime({ message: 'expiresAt must be a valid ISO date' })
                .optional(),
        })
        .strict(),
});

// ── Param schemas ─────────────────────────────────────────

export const notificationIdParamSchema = z.object({
    params: z.object({
        id: z.string().min(1, 'Notification ID is required'),
    }),
});

// ── Inferred types ────────────────────────────────────────

export type SendNotificationInput = z.infer<typeof sendNotificationSchema>['body'];
export type BroadcastInput = z.infer<typeof broadcastSchema>['body'];
export type BroadcastGlobalInput = z.infer<typeof broadcastGlobalSchema>['body'];
