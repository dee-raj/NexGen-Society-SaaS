import { Document, Types } from 'mongoose';
import {
    ComplaintStatus,
    ComplaintPriority,
    ComplaintCategory,
} from '@shared/utils/constants';

// ── Complaint (Tenant-scoped) ───────────────────────────────

export interface IComplaint extends Document {
    id: string;
    societyId: Types.ObjectId;
    title: string;
    description: string;
    category: ComplaintCategory;
    priority: ComplaintPriority;
    status: ComplaintStatus;
    reportedBy: Types.ObjectId;
    assignedTo?: Types.ObjectId;
    photos: string[];
    resolvedAt?: Date;
    closedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

// ── ComplaintActivityLog (Tenant-scoped, Append-only) ───────

export interface IComplaintActivityLog extends Document {
    id: string;
    societyId: Types.ObjectId;
    complaintId: Types.ObjectId;
    action: string;
    fromStatus?: ComplaintStatus;
    toStatus?: ComplaintStatus;
    performedBy: Types.ObjectId;
    comment?: string;
    timestamp: Date;
    createdAt: Date;
}

// ── ComplaintRating (Tenant-scoped) ─────────────────────────

export interface IComplaintRating extends Document {
    id: string;
    societyId: Types.ObjectId;
    complaintId: Types.ObjectId;
    ratedBy: Types.ObjectId;
    rating: number; // 1-5
    comment?: string;
    createdAt: Date;
    updatedAt: Date;
}
