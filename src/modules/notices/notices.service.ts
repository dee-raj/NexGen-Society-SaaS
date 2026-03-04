import { TenantService } from '@shared/services/tenant.service';
import { INotice } from './notices.types';
import { Notice } from './notices.model';
import { CreateNoticeInput, UpdateNoticeInput } from './notices.validator';
import { Society } from '@modules/society/society.model';
import { SocietyStatus } from '@shared/utils/constants';

/**
 * Notices service — extends TenantService for automatic tenant scoping.
 *
 * Every method requires `tenantId` as the first parameter.
 * Controllers never filter by societyId — it's fully transparent.
 */
class NoticesServiceClass extends TenantService<INotice> {
    constructor() {
        super(Notice);
    }

    /** Create a new notice within a tenant */
    async createNotice(tenantId: string, data: CreateNoticeInput, userId: string): Promise<INotice> {
        const noticeData: Partial<INotice> = {
            ...data,
            expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
            createdBy: userId as unknown as INotice['createdBy'],
            updatedBy: userId as unknown as INotice['updatedBy'],
        };

        if (data.isPublished) {
            noticeData.publishedAt = new Date();
        }

        return this.create(tenantId, noticeData);
    }

    /** Update a notice within a tenant */
    async updateNotice(
        tenantId: string,
        id: string,
        data: UpdateNoticeInput,
        userId: string,
    ): Promise<INotice | null> {
        const updateData: Record<string, unknown> = {
            ...data,
            updatedBy: userId,
        };

        if (data.isPublished === true) {
            updateData.publishedAt = new Date();
        }

        if (data.expiresAt) {
            updateData.expiresAt = new Date(data.expiresAt);
        } else if (data.expiresAt === null) {
            updateData.$unset = { expiresAt: 1 };
            delete updateData.expiresAt;
        }

        return this.updateById(tenantId, id, updateData);
    }

    /**
     * SUPER_ADMIN global broadcast — creates an identical notice
     * for every active society. Uses insertMany for efficiency.
     */
    async createGlobalNotice(
        data: CreateNoticeInput,
        userId: string,
    ): Promise<{ created: number }> {
        const activeSocieties = await Society.find(
            { status: SocietyStatus.ACTIVE },
            { _id: 1 },
        ).lean();

        if (activeSocieties.length === 0) return { created: 0 };

        const docs = activeSocieties.map((s) => ({
            ...data,
            societyId: s._id,
            expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
            isPublished: data.isPublished ?? true,
            publishedAt: data.isPublished !== false ? new Date() : undefined,
            createdBy: userId,
            updatedBy: userId,
        }));

        await Notice.insertMany(docs);
        return { created: docs.length };
    }
}

/** Singleton instance */
export const NoticesService = new NoticesServiceClass();
