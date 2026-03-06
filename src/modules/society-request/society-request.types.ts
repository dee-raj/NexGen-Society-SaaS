import { Document, Types } from 'mongoose';

export enum SocietyRequestStatus {
    PENDING = 'PENDING',
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED',
}

export interface ISocietyRequest extends Document {
    // Society Info
    societyName: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    registrationNumber?: string;

    // Admin Info
    adminName: string;
    adminEmail: string;
    adminPhone: string;

    // Request Context
    status: SocietyRequestStatus;
    rejectionReason?: string;

    // Tracking
    createdSocietyId?: Types.ObjectId;
    createdAdminId?: Types.ObjectId;

    createdAt: Date;
    updatedAt: Date;
}
