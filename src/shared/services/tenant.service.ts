import { Model, QueryOptions, UpdateQuery, Document, Types } from 'mongoose';

/**
 * Generic base service for all tenant-scoped modules.
 *
 * Every CRUD method requires `tenantId` as the FIRST parameter,
 * making it impossible to accidentally skip tenant scoping.
 * The Mongoose tenant-scope plugin acts as a second safety net.
 *
 * SUPER_ADMIN cross-tenant access uses explicit `*Global()` methods
 * so code reviews can catch them immediately.
 *
 * Usage:
 *   class NoticesService extends TenantService<INotice> {
 *     constructor() { super(Notice); }
 *   }
 */
export abstract class TenantService<T extends Document> {
    constructor(protected readonly model: Model<T>) { }

    // ── Option Builders ──────────────────────────────────────

    /** Build query options with tenant scoping */
    protected tenantOptions(tenantId: string | null, extra?: Record<string, unknown>): Record<string, unknown> {
        if (tenantId === null) {
            return { ...extra, skipTenantCheck: true };
        }
        return { ...extra, tenantId };
    }

    /** Build query options for SUPER_ADMIN cross-tenant access */
    protected globalOptions(extra?: Record<string, unknown>): Record<string, unknown> {
        return { ...extra, skipTenantCheck: true };
    }

    // ── Tenant-Scoped CRUD ───────────────────────────────────

    /** Find all documents within a tenant */
    async findAll(
        tenantId: string | null,
        filter: Record<string, unknown> = {},
        page = 1,
        limit = 20,
    ): Promise<{ data: T[]; total: number }> {
        const skip = (page - 1) * limit;
        const opts = this.tenantOptions(tenantId);

        const [data, total] = await Promise.all([
            this.model
                .find(filter, null, opts as QueryOptions<T>)
                .skip(skip)
                .limit(limit)
                .sort({ createdAt: -1 }),
            this.model.countDocuments(filter, opts),
        ]);

        return { data, total };
    }

    /** Find a single document by ID within a tenant */
    async findById(tenantId: string | null, id: string): Promise<T | null> {
        if (!Types.ObjectId.isValid(id)) return null;
        return this.model.findOne(
            { _id: id },
            null,
            this.tenantOptions(tenantId) as QueryOptions<T>,
        );
    }

    /** Create a new document, auto-injecting societyId */
    async create(tenantId: string | null, data: Partial<T>): Promise<T> {
        // Creation always requires a tenant context unless explicitly handled otherwise
        if (!tenantId) {
            throw new Error('[TENANT VIOLATION] Cannot create tenant-scoped document without valid tenantId');
        }
        return this.model.create({
            ...data,
            societyId: tenantId,
        } as Partial<T>);
    }

    /** Update a document by ID within a tenant */
    async updateById(
        tenantId: string | null,
        id: string,
        data: UpdateQuery<T>,
    ): Promise<T | null> {
        if (!Types.ObjectId.isValid(id)) return null;
        return this.model.findOneAndUpdate(
            { _id: id },
            data,
            {
                ...this.tenantOptions(tenantId),
                new: true,
                runValidators: true,
            } as QueryOptions<T>,
        );
    }

    /** Delete a document by ID within a tenant */
    async deleteById(tenantId: string | null, id: string): Promise<T | null> {
        if (!Types.ObjectId.isValid(id)) return null;
        return this.model.findOneAndDelete(
            { _id: id },
            this.tenantOptions(tenantId) as QueryOptions<T>,
        );
    }

    /** Count documents within a tenant */
    async count(tenantId: string | null, filter: Record<string, unknown> = {}): Promise<number> {
        return this.model.countDocuments(filter, this.tenantOptions(tenantId));
    }

    // ── Cross-Tenant (SUPER_ADMIN only) ──────────────────────

    /** Find all documents across all tenants — SUPER_ADMIN only */
    async findAllGlobal(
        filter: Record<string, unknown> = {},
        page = 1,
        limit = 20,
    ): Promise<{ data: T[]; total: number }> {
        const skip = (page - 1) * limit;
        const opts = this.globalOptions();

        const [data, total] = await Promise.all([
            this.model
                .find(filter, null, opts as QueryOptions<T>)
                .skip(skip)
                .limit(limit)
                .sort({ createdAt: -1 }),
            this.model.countDocuments(filter, opts),
        ]);

        return { data, total };
    }

    /** Find a single document by ID across all tenants — SUPER_ADMIN only */
    async findByIdGlobal(id: string): Promise<T | null> {
        if (!Types.ObjectId.isValid(id)) return null;
        return this.model.findOne(
            { _id: id },
            null,
            this.globalOptions() as QueryOptions<T>,
        );
    }
}
