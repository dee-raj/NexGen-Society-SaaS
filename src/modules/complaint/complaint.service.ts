import { Complaint, ComplaintActivityLog, ComplaintRating } from './complaint.model';
import { ComplaintStatus, Role } from '@shared/utils/constants';
import { NotFoundError, BadRequestError, ForbiddenError } from '@shared/utils/api-error';

// ── State machine: allowed transitions ──────────────────────

const ALLOWED_TRANSITIONS: Record<ComplaintStatus, ComplaintStatus[]> = {
    [ComplaintStatus.REPORTED]: [ComplaintStatus.IN_PROGRESS, ComplaintStatus.CLOSED],
    [ComplaintStatus.IN_PROGRESS]: [ComplaintStatus.RESOLVED],
    [ComplaintStatus.RESOLVED]: [ComplaintStatus.CLOSED],
    [ComplaintStatus.CLOSED]: [], // Terminal state
};

export class ComplaintService {
    // ── Create a new complaint ──────────────────────────────

    static async createComplaint(
        societyId: string,
        userId: string,
        data: {
            title: string;
            description: string;
            category: string;
            priority?: string;
            photos?: string[];
        },
    ) {
        const complaint = await Complaint.create({
            societyId,
            title: data.title,
            description: data.description,
            category: data.category,
            priority: data.priority,
            photos: data.photos || [],
            status: ComplaintStatus.REPORTED,
            reportedBy: userId,
        });

        // Log creation activity
        await ComplaintActivityLog.create({
            societyId,
            complaintId: complaint._id,
            action: 'Complaint created',
            toStatus: ComplaintStatus.REPORTED,
            performedBy: userId,
            timestamp: new Date(),
        });

        return complaint;
    }

    // ── Transition complaint status ─────────────────────────

    static async transitionStatus(
        societyId: string,
        complaintId: string,
        newStatus: ComplaintStatus,
        userId: string,
        userRole: Role,
        comment?: string,
    ) {
        const complaint = await Complaint.findOne({
            _id: complaintId,
            societyId,
        }).setOptions({ tenantId: societyId });

        if (!complaint) {
            throw new NotFoundError('Complaint not found');
        }

        const currentStatus = complaint.status as ComplaintStatus;

        // Validate transition is allowed
        const allowedNext = ALLOWED_TRANSITIONS[currentStatus];
        if (!allowedNext || !allowedNext.includes(newStatus)) {
            throw new BadRequestError(
                `Invalid transition: ${currentStatus} → ${newStatus}. ` +
                `Allowed transitions from ${currentStatus}: ${allowedNext?.join(', ') || 'none'}`,
            );
        }

        // Role-based restrictions on transitions
        if (newStatus === ComplaintStatus.IN_PROGRESS || newStatus === ComplaintStatus.RESOLVED) {
            // Only SOCIETY_ADMIN or SUPER_ADMIN can move to IN_PROGRESS or RESOLVED
            if (userRole !== Role.SOCIETY_ADMIN && userRole !== Role.SUPER_ADMIN) {
                throw new ForbiddenError('Only admins can move complaints to this status');
            }
        }

        if (newStatus === ComplaintStatus.CLOSED) {
            // SOCIETY_ADMIN/SUPER_ADMIN can always close
            // RESIDENT can only close if they are the reporter AND status is RESOLVED
            if (userRole === Role.RESIDENT) {
                if (complaint.reportedBy.toString() !== userId) {
                    throw new ForbiddenError('Only the complaint reporter can close it');
                }
                if (currentStatus !== ComplaintStatus.RESOLVED) {
                    throw new ForbiddenError('Residents can only close resolved complaints');
                }
            }
        }

        // Apply transition
        const fromStatus = complaint.status as ComplaintStatus;
        complaint.status = newStatus;

        // Time tracking
        if (newStatus === ComplaintStatus.RESOLVED) {
            complaint.resolvedAt = new Date();
        }
        if (newStatus === ComplaintStatus.CLOSED) {
            complaint.closedAt = new Date();
        }

        await complaint.save();

        // Create activity log
        await ComplaintActivityLog.create({
            societyId,
            complaintId: complaint._id,
            action: `Status changed: ${fromStatus} → ${newStatus}`,
            fromStatus,
            toStatus: newStatus,
            performedBy: userId,
            comment,
            timestamp: new Date(),
        });

        return complaint;
    }

    // ── Add rating ──────────────────────────────────────────

    static async addRating(
        societyId: string,
        complaintId: string,
        userId: string,
        rating: number,
        comment?: string,
    ) {
        const complaint = await Complaint.findOne({
            _id: complaintId,
            societyId,
        }).setOptions({ tenantId: societyId });

        if (!complaint) {
            throw new NotFoundError('Complaint not found');
        }

        // Only allow rating for RESOLVED or CLOSED complaints
        if (
            complaint.status !== ComplaintStatus.RESOLVED &&
            complaint.status !== ComplaintStatus.CLOSED
        ) {
            throw new BadRequestError('Can only rate resolved or closed complaints');
        }

        // Only the reporter can rate
        if (complaint.reportedBy.toString() !== userId) {
            throw new ForbiddenError('Only the complaint reporter can submit a rating');
        }

        // Check for duplicate rating
        const existing = await ComplaintRating.findOne({
            complaintId,
        }).setOptions({ tenantId: societyId });

        if (existing) {
            throw new BadRequestError('Rating already submitted for this complaint');
        }

        const ratingDoc = await ComplaintRating.create({
            societyId,
            complaintId,
            ratedBy: userId,
            rating,
            comment,
        });

        // Log the rating activity
        await ComplaintActivityLog.create({
            societyId,
            complaintId,
            action: `Rating submitted: ${rating}/5`,
            performedBy: userId,
            comment,
            timestamp: new Date(),
        });

        return ratingDoc;
    }

    // ── Get complaints ──────────────────────────────────────

    static async getComplaints(societyId: string, userId?: string, role?: Role) {
        const filter: Record<string, any> = { societyId };

        // Residents can only see their own complaints
        if (role === Role.RESIDENT && userId) {
            filter.reportedBy = userId;
        }

        return Complaint.find(filter)
            .setOptions({ tenantId: societyId })
            .populate({ path: 'reportedBy', select: 'firstName lastName email' })
            .populate({ path: 'assignedTo', select: 'firstName lastName email' })
            .sort({ createdAt: -1 });
    }

    // ── Get single complaint ────────────────────────────────

    static async getComplaint(societyId: string, complaintId: string) {
        const complaint = await Complaint.findOne({
            _id: complaintId,
            societyId,
        })
            .setOptions({ tenantId: societyId })
            .populate({ path: 'reportedBy', select: 'firstName lastName email' })
            .populate({ path: 'assignedTo', select: 'firstName lastName email' });

        if (!complaint) {
            throw new NotFoundError('Complaint not found');
        }

        return complaint;
    }

    // ── Get activity log for a complaint ────────────────────

    static async getActivityLog(societyId: string, complaintId: string) {
        return ComplaintActivityLog.find({
            complaintId,
            societyId,
        })
            .setOptions({ tenantId: societyId })
            .populate({ path: 'performedBy', select: 'firstName lastName email' })
            .sort({ timestamp: -1 });
    }
}
