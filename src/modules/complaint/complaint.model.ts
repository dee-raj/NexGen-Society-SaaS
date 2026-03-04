import mongoose, { Schema } from 'mongoose';
import {
    IComplaint,
    IComplaintActivityLog,
    IComplaintRating,
} from './complaint.types';
import {
    ComplaintStatus,
    ComplaintPriority,
    ComplaintCategory,
} from '@shared/utils/constants';
import { tenantScopePlugin } from '@shared/plugins/tenant-scope.plugin';
import { auditLogPlugin } from '@shared/plugins/audit-log.plugin';

const transformJSON = {
    transform(_doc: any, ret: Record<string, unknown>) {
        ret.id = (ret._id as mongoose.Types.ObjectId)?.toString();
        delete ret.__v;
        return ret;
    },
};

// ── Complaint Schema ─────────────────────────────────────────

const complaintSchema = new Schema<IComplaint>(
    {
        title: {
            type: String,
            required: true,
            trim: true,
            maxlength: 200,
        },
        description: {
            type: String,
            required: true,
            trim: true,
            maxlength: 2000,
        },
        category: {
            type: String,
            enum: Object.values(ComplaintCategory),
            required: true,
        },
        priority: {
            type: String,
            enum: Object.values(ComplaintPriority),
            default: ComplaintPriority.MEDIUM,
            required: true,
        },
        status: {
            type: String,
            enum: Object.values(ComplaintStatus),
            default: ComplaintStatus.REPORTED,
            required: true,
        },
        reportedBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        assignedTo: {
            type: Schema.Types.ObjectId,
            ref: 'User',
        },
        photos: {
            type: [String],
            default: [],
        },
        resolvedAt: {
            type: Date,
        },
        closedAt: {
            type: Date,
        },
    },
    { timestamps: true, toJSON: transformJSON },
);

complaintSchema.plugin(tenantScopePlugin);
complaintSchema.plugin(auditLogPlugin);
complaintSchema.index({ societyId: 1, status: 1 });
complaintSchema.index({ societyId: 1, reportedBy: 1 });
complaintSchema.index({ societyId: 1, category: 1 });
complaintSchema.index({ societyId: 1, priority: 1 });

export const Complaint = mongoose.model<IComplaint>('Complaint', complaintSchema);

// ── ComplaintActivityLog Schema (Append-only / Immutable) ───

const complaintActivityLogSchema = new Schema<IComplaintActivityLog>(
    {
        complaintId: {
            type: Schema.Types.ObjectId,
            ref: 'Complaint',
            required: true,
            index: true,
        },
        action: {
            type: String,
            required: true,
            trim: true,
            maxlength: 200,
        },
        fromStatus: {
            type: String,
            enum: Object.values(ComplaintStatus),
        },
        toStatus: {
            type: String,
            enum: Object.values(ComplaintStatus),
        },
        performedBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        comment: {
            type: String,
            trim: true,
            maxlength: 1000,
        },
        timestamp: {
            type: Date,
            default: Date.now,
            required: true,
        },
    },
    {
        timestamps: { createdAt: true, updatedAt: false }, // Append-only
        toJSON: transformJSON,
    },
);

complaintActivityLogSchema.plugin(tenantScopePlugin);

// Enforce immutability — no updates or deletes
complaintActivityLogSchema.pre('save', function () {
    if (!this.isNew) {
        throw new Error('ComplaintActivityLog is immutable and cannot be updated.');
    }
});

complaintActivityLogSchema.pre(/update|updateOne|updateMany|findOneAndUpdate/, function () {
    throw new Error('Updating a ComplaintActivityLog is strictly prohibited.');
});

complaintActivityLogSchema.pre(/deleteOne|deleteMany|findOneAndDelete|remove/, function () {
    throw new Error('Deleting a ComplaintActivityLog is strictly prohibited.');
});

complaintActivityLogSchema.index({ societyId: 1, complaintId: 1, timestamp: -1 });

export const ComplaintActivityLog = mongoose.model<IComplaintActivityLog>(
    'ComplaintActivityLog',
    complaintActivityLogSchema,
);

// ── ComplaintRating Schema ───────────────────────────────────

const complaintRatingSchema = new Schema<IComplaintRating>(
    {
        complaintId: {
            type: Schema.Types.ObjectId,
            ref: 'Complaint',
            required: true,
            index: true,
        },
        ratedBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        rating: {
            type: Number,
            required: true,
            min: 1,
            max: 5,
        },
        comment: {
            type: String,
            trim: true,
            maxlength: 500,
        },
    },
    { timestamps: true, toJSON: transformJSON },
);

complaintRatingSchema.plugin(tenantScopePlugin);
complaintRatingSchema.plugin(auditLogPlugin);
complaintRatingSchema.index({ societyId: 1, complaintId: 1 }, { unique: true });

export const ComplaintRating = mongoose.model<IComplaintRating>(
    'ComplaintRating',
    complaintRatingSchema,
);
