import { TenantService } from '../../shared/services/tenant.service';
import { IFlat } from './flat.types';
import { Flat } from './flat.model';
import { CreateFlatInput, UpdateFlatInput } from './flat.validator';
import { Types } from 'mongoose';

/**
 * Flat service — extends TenantService for automatic tenant scoping.
 */
class FlatServiceClass extends TenantService<IFlat> {
    constructor() {
        super(Flat);
    }

    async createFlat(tenantId: string, data: CreateFlatInput, userId: string): Promise<IFlat> {
        const objectUserId = new Types.ObjectId(userId);
        const objectBuildingId = new Types.ObjectId(data.buildingId);

        return this.create(tenantId, {
            ...data,
            createdBy: objectUserId as unknown as IFlat['createdBy'],
            updatedBy: objectUserId as unknown as IFlat['updatedBy'],
            buildingId: objectBuildingId as unknown as IFlat['buildingId'],
        });
    }

    async updateFlat(
        tenantId: string,
        id: string,
        data: UpdateFlatInput,
        userId: string,
    ): Promise<IFlat | null> {
        const objectUserId = new Types.ObjectId(userId);
        return this.updateById(tenantId, id, { ...data, updatedBy: objectUserId });
    }

    /** Find all flats in a specific building */
    async findByBuilding(
        tenantId: string,
        buildingId: string,
        page = 1,
        limit = 20,
    ): Promise<{ data: IFlat[]; total: number }> {
        return this.findAll(tenantId, { buildingId }, page, limit);
    }
}

export const FlatService = new FlatServiceClass();
