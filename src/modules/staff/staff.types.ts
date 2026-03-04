import { Document, Types } from 'mongoose';
import { StaffType, StaffDepartment, StaffStatus } from '@shared/utils/constants';

/** Staff document shape backward compatible with mongoose */
export interface IStaff extends Document {
    _id: Types.ObjectId;
    societyId: Types.ObjectId;
    userId: Types.ObjectId;
    type: StaffType;
    department: StaffDepartment;
    status: StaffStatus;
    shiftTiming?: string;
    policeVerificationStatus: 'pending' | 'verified' | 'rejected';
    joinedAt?: Date;
    leftAt?: Date;

    // Audit fields
    createdBy?: Types.ObjectId;
    updatedBy?: Types.ObjectId;
    deletedAt?: Date | null;
    deletedBy?: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}
