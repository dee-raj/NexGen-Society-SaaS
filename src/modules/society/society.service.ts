import { Types } from 'mongoose';
import { Society } from './society.model';
import { ISociety } from './society.types';
import { CreateSocietyInput, UpdateSocietyInput } from './society.validator';
import { ConflictError, NotFoundError } from '@shared/utils/api-error';

/**
 * Society service — NOT tenant-scoped.
 * Society IS the tenant entity. Only SUPER_ADMIN can manage societies.
 * Direct Mongoose calls (no TenantService base class).
 */
class SocietyServiceClass {
    /** List all societies with pagination */
    async findAll(
        filter: Record<string, unknown> = {},
        page = 1,
        limit = 20,
    ): Promise<{ data: ISociety[]; total: number }> {
        const skip = (page - 1) * limit;

        const [data, total] = await Promise.all([
            Society.find(filter).skip(skip).limit(limit).sort({ createdAt: -1 }),
            Society.countDocuments(filter),
        ]);

        return { data, total };
    }

    /** Find society by ID */
    async findById(id: string): Promise<ISociety | null> {
        if (!Types.ObjectId.isValid(id)) return null;
        return Society.findById(id);
    }

    /** Create a new society */
    async create(data: CreateSocietyInput, userId: string): Promise<ISociety> {
        // Check for duplicate registration number
        if (data.registrationNumber) {
            const existing = await Society.findOne({ registrationNumber: data.registrationNumber });
            if (existing) {
                throw new ConflictError('A society with this registration number already exists');
            }
        }

        return Society.create({
            ...data,
            createdBy: userId,
            updatedBy: userId,
        });
    }

    /** Update society by ID */
    async updateById(id: string, data: UpdateSocietyInput, userId: string): Promise<ISociety | null> {
        if (!Types.ObjectId.isValid(id)) return null;

        // Check for duplicate registration number if being updated
        if (data.registrationNumber) {
            const existing = await Society.findOne({
                registrationNumber: data.registrationNumber,
                _id: { $ne: id },
            });
            if (existing) {
                throw new ConflictError('A society with this registration number already exists');
            }
        }

        return Society.findByIdAndUpdate(
            id,
            { ...data, updatedBy: userId },
            { new: true, runValidators: true },
        );
    }

    /** Delete society by ID */
    async deleteById(id: string): Promise<ISociety | null> {
        if (!Types.ObjectId.isValid(id)) return null;
        return Society.findByIdAndDelete(id);
    }

    /** Count societies */
    async count(filter: Record<string, unknown> = {}): Promise<number> {
        return Society.countDocuments(filter);
    }
}

/** Singleton instance */
export const SocietyService = new SocietyServiceClass();
