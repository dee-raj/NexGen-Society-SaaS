import { TenantService } from '@shared/services/tenant.service';
import { IResident } from './resident.types';
import { Resident } from './resident.model';
import { CreateResidentInput, UpdateResidentInput } from './resident.validator';
import { Types, QueryOptions } from 'mongoose';

/** Build a populate config that passes tenantId so the Flat model's tenant-scope plugin is satisfied */
const flatPopulate = (tenantId: string) => ({
    path: 'flatId',
    select: 'unitNumber floor type buildingId',
    options: { tenantId },
});

/**
 * Resident service — extends TenantService for automatic tenant scoping.
 */
class ResidentServiceClass extends TenantService<IResident> {
    constructor() {
        super(Resident);
    }

    // ── Overrides with .populate() ────────────────────────────

    /**
     * Find all residents with flat details populated.
     * Supports optional `search` regex across fullName, email, phoneNumber.
     */
    async findAllResidents(
        tenantId: string,
        filter: Record<string, unknown> = {},
        page = 1,
        limit = 20,
        search?: string,
    ): Promise<{ data: IResident[]; total: number }> {
        const query: Record<string, unknown> = { ...filter };

        if (search) {
            const regex = new RegExp(search, 'i');
            query.$or = [
                { fullName: regex },
                { email: regex },
                { phoneNumber: regex },
            ];
        }

        const skip = (page - 1) * limit;
        const opts = this.tenantOptions(tenantId);

        const [data, total] = await Promise.all([
            this.model
                .find(query, null, opts as QueryOptions<IResident>)
                .populate(flatPopulate(tenantId))
                .skip(skip)
                .limit(limit)
                .sort({ createdAt: -1 }),
            this.model.countDocuments(query, opts),
        ]);

        return { data, total };
    }

    /** Find a single resident by ID with flat details populated */
    async findResidentById(tenantId: string, id: string): Promise<IResident | null> {
        if (!Types.ObjectId.isValid(id)) return null;
        return this.model
            .findOne(
                { _id: id },
                null,
                this.tenantOptions(tenantId) as QueryOptions<IResident>,
            )
            .populate(flatPopulate(tenantId));
    }

    // ── Mutations ─────────────────────────────────────────────

    async createResident(tenantId: string, data: any, userId: string): Promise<IResident> {
        const objectActionUserId = new Types.ObjectId(userId);
        const objectTargetUserId = data.userId ? new Types.ObjectId(data.userId) : undefined;
        const objectFlatId = new Types.ObjectId(data.flatId);

        const resident = await this.create(tenantId, {
            ...data,
            moveInDate: data.moveInDate ? new Date(data.moveInDate) : undefined,
            createdBy: objectActionUserId as unknown as IResident['createdBy'],
            updatedBy: objectActionUserId as unknown as IResident['updatedBy'],
            userId: objectTargetUserId as unknown as IResident['userId'],
            flatId: objectFlatId as unknown as IResident['flatId'],
        });

        return resident.populate(flatPopulate(tenantId));
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

        const resident = await this.updateById(tenantId, id, updateData);
        return resident ? resident.populate(flatPopulate(tenantId)) : null;
    }

    /** Find all residents in a specific flat */
    async findByFlat(
        tenantId: string,
        flatId: string,
        page = 1,
        limit = 20,
    ): Promise<{ data: IResident[]; total: number }> {
        return this.findAllResidents(tenantId, { flatId }, page, limit);
    }
}

export const ResidentService = new ResidentServiceClass();
