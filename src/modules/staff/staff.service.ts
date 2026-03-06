import { TenantService } from '@shared/services/tenant.service';
import { IStaff } from './staff.types';
import { Staff } from './staff.model';
import { CreateStaffInput, UpdateStaffInput } from './staff.validator';
import { Types } from 'mongoose';

class StaffServiceClass extends TenantService<IStaff> {
    constructor() {
        super(Staff);
    }

    async createStaff(tenantId: string | null, data: CreateStaffInput, actionUserId: string): Promise<IStaff> {
        const objectActionUserId = new Types.ObjectId(actionUserId);

        return this.create(tenantId, {
            ...data,
            joinedAt: data.joinedAt ? new Date(data.joinedAt) : undefined,
            createdBy: objectActionUserId as unknown as IStaff['createdBy'],
            updatedBy: objectActionUserId as unknown as IStaff['updatedBy'],
        });
    }

    async updateStaff(
        tenantId: string | null,
        id: string,
        data: UpdateStaffInput,
        actionUserId: string,
    ): Promise<IStaff | null> {
        const objectUserId = new Types.ObjectId(actionUserId);
        const updateData: Record<string, unknown> = { ...data, updatedBy: objectUserId };
        if (data.joinedAt) updateData.joinedAt = new Date(data.joinedAt);
        if (data.leftAt) updateData.leftAt = new Date(data.leftAt);
        return this.updateById(tenantId, id, updateData);
    }
}

export const StaffService = new StaffServiceClass();
