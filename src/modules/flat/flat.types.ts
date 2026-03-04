import { Document, Types } from 'mongoose';
import { FlatType } from '@shared/utils/constants';

/** Flat document shape after Mongoose hydration */
export interface IFlat extends Document {
    _id: Types.ObjectId;
    societyId: Types.ObjectId;
    buildingId: Types.ObjectId;
    unitNumber: string;
    floor: number;
    type: FlatType;
    area?: number; // in sq ft
    isOccupied: boolean;

    // Audit fields (added by auditLogPlugin)
    createdBy?: Types.ObjectId;
    updatedBy?: Types.ObjectId;
    deletedAt?: Date | null;
    deletedBy?: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}
