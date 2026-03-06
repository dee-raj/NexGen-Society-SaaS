import { TenantService } from '@shared/services/tenant.service';
import { IResident } from './resident.types';
import { Resident } from './resident.model';
import { CreateResidentInput, UpdateResidentInput } from './resident.validator';
import { Types } from 'mongoose';

/**
 * Resident service — extends TenantService for automatic tenant scoping.
 */
class ResidentServiceClass extends TenantService<IResident> {
    constructor() {
        super(Resident);
    }

    async createResident(tenantId: string, data: any, userId: string): Promise<IResident> {
        const objectActionUserId = new Types.ObjectId(userId);
        const objectTargetUserId = data.userId ? new Types.ObjectId(data.userId) : undefined;
        const objectFlatId = new Types.ObjectId(data.flatId);

        return this.create(tenantId, {
            ...data,
            moveInDate: data.moveInDate ? new Date(data.moveInDate) : undefined,
            createdBy: objectActionUserId as unknown as IResident['createdBy'],
            updatedBy: objectActionUserId as unknown as IResident['updatedBy'],
            userId: objectTargetUserId as unknown as IResident['userId'],
            flatId: objectFlatId as unknown as IResident['flatId'],
        });
    }

    async updateResident(
        tenantId: string,
        id: string,
        data: UpdateResidentInput,
        userId: string,
    ): Promise<IResident | null> {
        const objectUserId = new Types.ObjectId(userId);
        const updateData: Record<string, unknown> = { ...data, updatedBy: objectUserId };
        if (data.moveInDate) updateData.moveInDate = new Date(data.moveInDate);
        if (data.moveOutDate) updateData.moveOutDate = new Date(data.moveOutDate);
        return this.updateById(tenantId, id, updateData);
    }

    /** Find all residents in a specific flat */
    async findByFlat(
        tenantId: string,
        flatId: string,
        page = 1,
        limit = 20,
    ): Promise<{ data: IResident[]; total: number }> {
        return this.findAll(tenantId, { flatId }, page, limit);
    }
}

export const ResidentService = new ResidentServiceClass();
