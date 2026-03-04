import { Request, Response, NextFunction } from 'express';
import { ComplaintService } from './complaint.service';
import { ApiResponse } from '@shared/utils/api-response';
import { Role } from '@shared/utils/constants';

export class ComplaintController {
    // ── Create complaint ────────────────────────────────────

    static async create(req: Request, res: Response, next: NextFunction) {
        try {
            const societyId = req.user?.societyId!;
            const userId = req.user?.userId!;

            const complaint = await ComplaintService.createComplaint(
                societyId,
                userId,
                req.body,
            );
            ApiResponse.created(res, complaint);
        } catch (error) {
            next(error);
        }
    }

    // ── List complaints ─────────────────────────────────────

    static async getAll(req: Request, res: Response, next: NextFunction) {
        try {
            const societyId = req.user?.societyId!;
            const userId = req.user?.userId!;
            const role = req.user?.role!;

            const complaints = await ComplaintService.getComplaints(societyId, userId, role);
            ApiResponse.success(res, complaints);
        } catch (error) {
            next(error);
        }
    }

    // ── Get single complaint ────────────────────────────────

    static async getOne(req: Request, res: Response, next: NextFunction) {
        try {
            const societyId = req.user?.societyId!;
            const id = req.params.id as string;

            const complaint = await ComplaintService.getComplaint(societyId, id);
            ApiResponse.success(res, complaint);
        } catch (error) {
            next(error);
        }
    }

    // ── Transition status ───────────────────────────────────

    static async transitionStatus(req: Request, res: Response, next: NextFunction) {
        try {
            const societyId = req.user?.societyId!;
            const userId = req.user?.userId!;
            const userRole = req.user?.role!;
            const id = req.params.id as string;
            const { status, comment } = req.body;

            const complaint = await ComplaintService.transitionStatus(
                societyId,
                id,
                status,
                userId,
                userRole,
                comment,
            );
            ApiResponse.success(res, complaint);
        } catch (error) {
            next(error);
        }
    }

    // ── Add rating ──────────────────────────────────────────

    static async addRating(req: Request, res: Response, next: NextFunction) {
        try {
            const societyId = req.user?.societyId!;
            const userId = req.user?.userId!;
            const id = req.params.id as string;
            const { rating, comment } = req.body;

            const ratingDoc = await ComplaintService.addRating(
                societyId,
                id,
                userId,
                rating,
                comment,
            );
            ApiResponse.created(res, ratingDoc);
        } catch (error) {
            next(error);
        }
    }

    // ── Get activity log ────────────────────────────────────

    static async getActivityLog(req: Request, res: Response, next: NextFunction) {
        try {
            const societyId = req.user?.societyId!;
            const id = req.params.id as string;

            const logs = await ComplaintService.getActivityLog(societyId, id);
            ApiResponse.success(res, logs);
        } catch (error) {
            next(error);
        }
    }
}
