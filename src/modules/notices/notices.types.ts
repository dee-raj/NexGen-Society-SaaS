import { Document, Types } from 'mongoose';

/** Priority levels for notices */
export enum NoticePriority {
    LOW = 'low',
    MEDIUM = 'medium',
    HIGH = 'high',
    URGENT = 'urgent',
}

/** Notice document shape after Mongoose hydration */
export interface INotice extends Document {
    _id: Types.ObjectId;
    societyId: Types.ObjectId;
    title: string;
    content: string;
    priority: NoticePriority;
    isPublished: boolean;
    publishedAt?: Date;
    expiresAt?: Date;

    // Audit fields (added by auditLogPlugin)
    createdBy?: Types.ObjectId;
    updatedBy?: Types.ObjectId;
    deletedAt?: Date | null;
    deletedBy?: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}
