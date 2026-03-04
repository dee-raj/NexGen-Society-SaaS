import { Document, Types } from 'mongoose';
import { SocietyStatus } from '@shared/utils/constants';

/** Society document shape after Mongoose hydration */
export interface ISociety extends Document {
    _id: Types.ObjectId;
    name: string;
    registrationNumber?: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    status: SocietyStatus;
    contactEmail?: string;
    contactPhone?: string;
    totalBuildings: number;
    totalFlats: number;
    logoUrl?: string;

    // Audit fields (added by auditLogPlugin)
    createdBy?: Types.ObjectId;
    updatedBy?: Types.ObjectId;
    deletedAt?: Date | null;
    deletedBy?: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}
