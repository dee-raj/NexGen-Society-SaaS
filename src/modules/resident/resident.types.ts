import { Document, Types } from 'mongoose';
import { ResidentType, ResidentStatus } from '../../shared/utils/constants';

/** Resident document shape after Mongoose hydration */
export interface IResident extends Document {
    _id: Types.ObjectId;
    societyId: Types.ObjectId;
    userId: Types.ObjectId;
    flatId: Types.ObjectId;
    type: ResidentType;
    status: ResidentStatus;
    moveInDate?: Date;
    moveOutDate?: Date;
    vehicleNumbers?: string[];
    emergencyContact?: string;

    // Audit fields (added by auditLogPlugin)
    createdBy?: Types.ObjectId;
    updatedBy?: Types.ObjectId;
    deletedAt?: Date | null;
    deletedBy?: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}
