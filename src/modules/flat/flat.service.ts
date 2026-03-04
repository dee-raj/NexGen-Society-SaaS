import { Types } from 'mongoose';
import { IFlat } from './flat.types';
import { Flat } from './flat.model';
import { ConflictError } from '@shared/utils/api-error';
import { CreateFlatInput, UpdateFlatInput } from './flat.validator';
import { TenantService } from '@shared/services/tenant.service';

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

        try {
            return await this.create(tenantId, {
                ...data,
                createdBy: objectUserId,
                updatedBy: objectUserId,
                buildingId: objectBuildingId,
            });
        } catch (error: any) {
            if (error.code === 11000) {
                throw new ConflictError('Flat with this unit number already exists in this building');
            }
            throw error;
        }
    }

    async updateFlat(
        tenantId: string,
        id: string,
        data: UpdateFlatInput,
        userId: string,
    ): Promise<IFlat | null> {
        const objectUserId = new Types.ObjectId(userId);

        try {
            return await this.updateById(tenantId, id, {
                ...data,
                updatedBy: objectUserId,
            });
        } catch (error: any) {
            if (error.code === 11000) {
                throw new ConflictError('Flat with this unit number already exists in this building');
            }
            throw error;
        }
    }

    /** Find all flats in a specific building */
    async findByBuilding(
        tenantId: string,
        buildingId: string,
        page = 1,
        limit = 20,
    ): Promise<{ data: IFlat[]; total: number }> {
        const objectBuildingId = new Types.ObjectId(buildingId);
        return this.findAll(tenantId, { buildingId: objectBuildingId }, page, limit);
    }
}

export const FlatService = new FlatServiceClass();
