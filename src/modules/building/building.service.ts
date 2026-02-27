import { TenantService } from '../../shared/services/tenant.service';
import { IBuilding } from './building.types';
import { Building } from './building.model';
import { CreateBuildingInput, UpdateBuildingInput } from './building.validator';

/**
 * Building service — extends TenantService for automatic tenant scoping.
 */
class BuildingServiceClass extends TenantService<IBuilding> {
    constructor() {
        super(Building);
    }

    async createBuilding(tenantId: string, data: CreateBuildingInput, userId: string): Promise<IBuilding> {
        return this.create(tenantId, {
            ...data,
            createdBy: userId as unknown as IBuilding['createdBy'],
            updatedBy: userId as unknown as IBuilding['updatedBy'],
        });
    }

    async updateBuilding(
        tenantId: string,
        id: string,
        data: UpdateBuildingInput,
        userId: string,
    ): Promise<IBuilding | null> {
        return this.updateById(tenantId, id, { ...data, updatedBy: userId });
    }
}

export const BuildingService = new BuildingServiceClass();
