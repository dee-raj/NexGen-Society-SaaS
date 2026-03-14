import { logger } from '../../config/logger';
import { User } from '../auth/auth.model';
import { Role } from '@shared/utils/constants';
import { SocietyService } from '../society/society.service';
import { SocietyRequest } from './society-request.model';
import { ISocietyRequest, SocietyRequestStatus } from './society-request.types';
import { ConflictError, NotFoundError, BadRequestError } from '@shared/utils/api-error';
import { CreateSocietyRequestInput } from './society-request.validator';
import { EmailService } from '@shared/services/email.service';
import { redis } from '@config/redis';

class SocietyRequestServiceClass {
    /** Submit a new society registration request (Public) */
    async createRequest(data: CreateSocietyRequestInput): Promise<ISocietyRequest> {
        // Check if a pending request with same email or society registration already exists
        const existing = await SocietyRequest.findOne({
            $or: [
                { adminEmail: data.adminEmail, status: SocietyRequestStatus.PENDING },
                ...(data.registrationNumber ? [{ registrationNumber: data.registrationNumber, status: SocietyRequestStatus.PENDING }] : [])
            ]
        });

        if (existing) {
            throw new ConflictError('A pending request for this society or admin email already exists');
        }

        return SocietyRequest.create(data);
    }

    /** Find all requests (Admin only) */
    async findAll(filter: Record<string, any> = {}, page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        const [data, total] = await Promise.all([
            SocietyRequest.find(filter).skip(skip).limit(limit).sort({ createdAt: -1 }),
            SocietyRequest.countDocuments(filter),
        ]);
        return { data, total };
    }

    /** Find request by ID */
    async findById(id: string): Promise<ISocietyRequest> {
        const request = await SocietyRequest.findById(id);
        if (!request) throw new NotFoundError('Society request not found');
        return request;
    }

    /** Approve a request: Creates Society and Admin User */
    async approveRequest(id: string, actionUserId: string): Promise<ISocietyRequest> {
        const request = await this.findById(id);

        if (request.status !== SocietyRequestStatus.PENDING) {
            throw new BadRequestError(`Request cannot be approved. Current status: ${request.status}`);
        }


        try {
            // 1. Create Society
            const society = await SocietyService.create({
                name: request.societyName,
                address: request.address,
                city: request.city,
                state: request.state,
                pincode: request.pincode,
                registrationNumber: request.registrationNumber,
                contactEmail: request.adminEmail,
                contactPhone: request.adminPhone,
                status: 'active' as any, // Activate immediately upon approval
            }, actionUserId);

            // 2. Create SOCIETY_ADMIN user
            const tempPassword = Math.random().toString(36).slice(-10) + '1@Aa'; // Generate robust temp password
            const adminUser = await User.create([{
                email: request.adminEmail,
                password: tempPassword,
                fullName: request.adminName,
                phone: request.adminPhone,
                role: Role.SOCIETY_ADMIN,
                societyId: society._id,
                isActive: true,
            }]);

            // 3. Update Request status
            request.status = SocietyRequestStatus.APPROVED;
            request.createdSocietyId = society._id as any;
            request.createdAdminId = adminUser[0]._id as any;
            await request.save();

            logger.info({
                requestId: id,
                societyId: society._id,
                adminId: adminUser[0]._id
            }, 'Society request approved and provisioned');

            // redis logs
            try {
                await redis.rpush("society_request_approved", JSON.stringify({
                    societyId: society._id,
                    adminId: adminUser[0]._id,
                    adminName: request.adminName,
                    adminEmail: request.adminEmail,
                    societyName: request.societyName,
                    tempPassword,
                }));
                await redis.ltrim("society_request_approved", -1000, -1);
                await redis.expire("society_request_approved", 60 * 60 * 24 * 7);
            } catch (err) {
                logger.error({ err }, "Redis log write failed");
            }
            // Send welcome email to admin
            await EmailService.sendSocietyApprovedEmail(
                request.adminEmail,
                request.societyName,
                request.adminName,
                tempPassword
            );
            return request;
        } catch (error) {
            logger.error({ requestId: id, error }, 'Failed to approve society request');
            throw error;
        }
    }

    /** Reject a request */
    async rejectRequest(id: string, reason: string): Promise<ISocietyRequest> {
        const request = await this.findById(id);

        if (request.status !== SocietyRequestStatus.PENDING) {
            throw new BadRequestError(`Request cannot be rejected. Current status: ${request.status}`);
        }

        request.status = SocietyRequestStatus.REJECTED;
        request.rejectionReason = reason;
        await request.save();

        try {
            await redis.rpush("society_request_rejected", JSON.stringify({
                requestId: id,
                adminName: request.adminName,
                adminEmail: request.adminEmail,
                societyName: request.societyName,
                rejectionReason: reason,
            }));
            await redis.ltrim("society_request_rejected", -1000, -1);
            await redis.expire("society_request_rejected", 60 * 60 * 24 * 7);
        } catch (err) {
            logger.error({ err }, "Redis log write failed");
        }

        return request;
    }

    /** Get logs */
    async getLogs(limit: number = 30) {
        try {
            const approvedLogs = await redis.lrange("society_request_approved", -limit, -1);
            const rejectedLogs = await redis.lrange("society_request_rejected", -limit, -1);
            return [...approvedLogs, ...rejectedLogs].map(log => JSON.parse(log)).sort((a, b) => b.createdAt - a.createdAt);
        } catch (error) {
            logger.error({ error }, "Redis log read failed");
            throw error;
        }
    }
}

export const SocietyRequestService = new SocietyRequestServiceClass();
