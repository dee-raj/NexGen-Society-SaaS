import { TenantService } from '@shared/services/tenant.service';
import { INotice } from './notices.types';
import { Notice } from './notices.model';
import { CreateNoticeInput, UpdateNoticeInput } from './notices.validator';

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

        // If publishing immediately, set publishedAt
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

        // Handle publish state transition
        if (data.isPublished === true) {
            updateData.publishedAt = new Date();
        }

        // Handle expiresAt
        if (data.expiresAt) {
            updateData.expiresAt = new Date(data.expiresAt);
        } else if (data.expiresAt === null) {
            updateData.$unset = { expiresAt: 1 };
            delete updateData.expiresAt;
        }

        return this.updateById(tenantId, id, updateData);
    }
}

/** Singleton instance */
export const NoticesService = new NoticesServiceClass();
