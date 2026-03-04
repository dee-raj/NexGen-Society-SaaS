import { Document, Types } from 'mongoose';
import { BuildingType } from '@shared/utils/constants';

/** Building document shape after Mongoose hydration */
export interface IBuilding extends Document {
    _id: Types.ObjectId;
    societyId: Types.ObjectId;
    name: string;
    type: BuildingType;
    totalFloors: number;
    totalFlats: number;
    description?: string;

    // Audit fields (added by auditLogPlugin)
    createdBy?: Types.ObjectId;
    updatedBy?: Types.ObjectId;
    deletedAt?: Date | null;
    deletedBy?: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}
