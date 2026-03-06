import { TenantService } from '@shared/services/tenant.service';
import { IBuilding } from './building.types';
import { Building } from './building.model';
import { CreateBuildingInput, UpdateBuildingInput } from './building.validator';
import { ConflictError } from '@shared/utils/api-error';

/**
 * Building service — extends TenantService for automatic tenant scoping.
 */
class BuildingServiceClass extends TenantService<IBuilding> {
    constructor() {
        super(Building);
    }

    async createBuilding(tenantId: string | null, data: CreateBuildingInput, userId: string): Promise<IBuilding> {
        // Check for duplicate name within the same society (if scoped)
        if (data.name && tenantId) {
            const existing = await Building.findOne({ name: data.name, societyId: tenantId }).setOptions({ tenantId });
            if (existing) {
                throw new ConflictError('Building with this name already exists');
            }
        }
        return this.create(tenantId, {
            ...data,
            createdBy: userId as unknown as IBuilding['createdBy'],
            updatedBy: userId as unknown as IBuilding['updatedBy'],
        });
    }

    async updateBuilding(
        tenantId: string | null,
        id: string,
        data: UpdateBuildingInput,
        userId: string,
    ): Promise<IBuilding | null> {
        // Check for duplicate name (if scoped)
        if (data.name && tenantId) {
            const existing = await Building.findOne({ name: data.name, societyId: tenantId, _id: { $ne: id } });
            if (existing) {
                throw new ConflictError('Building with this name already exists');
            }
        }
        return this.updateById(tenantId, id, { ...data, updatedBy: userId });
    }
}

export const BuildingService = new BuildingServiceClass();
