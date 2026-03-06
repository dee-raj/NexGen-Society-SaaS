import mongoose, { Schema } from 'mongoose';
import { ISocietyRequest, SocietyRequestStatus } from './society-request.types';

const societyRequestSchema = new Schema<ISocietyRequest>(
    {
        societyName: {
            type: String,
            required: true,
            trim: true,
        },
        address: {
            type: String,
            required: true,
            trim: true,
        },
        city: {
            type: String,
            required: true,
            trim: true,
        },
        state: {
            type: String,
            required: true,
            trim: true,
        },
        pincode: {
            type: String,
            required: true,
            trim: true,
        },
        registrationNumber: {
            type: String,
            trim: true,
            unique: true,
            sparse: true,
        },
        adminName: {
            type: String,
            required: true,
            trim: true,
        },
        adminEmail: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
        },
        adminPhone: {
            type: String,
            required: true,
            trim: true,
        },
        status: {
            type: String,
            enum: Object.values(SocietyRequestStatus),
            default: SocietyRequestStatus.PENDING,
        },
        rejectionReason: {
            type: String,
            trim: true,
        },
        createdSocietyId: {
            type: Schema.Types.ObjectId,
            ref: 'Society',
        },
        createdAdminId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
        },
    },
    {
        timestamps: true,
    },
);

// Index for email and status
societyRequestSchema.index({ adminEmail: 1, status: 1 });
societyRequestSchema.index({ status: 1 });

export const SocietyRequest = mongoose.model<ISocietyRequest>('SocietyRequest', societyRequestSchema);
