import { Request, Response, NextFunction } from 'express';
import { ProcurementService } from './procurement.service';
import {
    VendorCategory,
    Vendor,
    CommissionRule,
    PurchaseOrder,
} from './procurement.model';
import { ApiResponse } from '@shared/utils/api-response';
import { NotFoundError } from '@shared/utils/api-error';

export class ProcurementController {
    // ══════════════════════════════════════════════════════════
    //  GLOBAL — Vendor Categories (SUPER_ADMIN only)
    // ══════════════════════════════════════════════════════════

    static async createVendorCategory(req: Request, res: Response, next: NextFunction) {
        try {
            const category = await VendorCategory.create(req.body);
            ApiResponse.created(res, category);
        } catch (error) {
            next(error);
        }
    }

    static async getVendorCategories(_req: Request, res: Response, next: NextFunction) {
        try {
            const categories = await VendorCategory.find({ deletedAt: null }).sort({ name: 1 });
            ApiResponse.success(res, categories);
        } catch (error) {
            next(error);
        }
    }

    static async updateVendorCategory(req: Request, res: Response, next: NextFunction) {
        try {
            const category = await VendorCategory.findByIdAndUpdate(
                req.params.id,
                req.body,
                { new: true },
            );
            if (!category) throw new NotFoundError('Vendor category');
            ApiResponse.success(res, category);
        } catch (error) {
            next(error);
        }
    }

    // ══════════════════════════════════════════════════════════
    //  GLOBAL — Vendors (SUPER_ADMIN only)
    // ══════════════════════════════════════════════════════════

    static async createVendor(req: Request, res: Response, next: NextFunction) {
        try {
            const vendor = await Vendor.create(req.body);
            ApiResponse.created(res, vendor);
        } catch (error) {
            next(error);
        }
    }

    static async getVendors(_req: Request, res: Response, next: NextFunction) {
        try {
            const vendors = await Vendor.find({ deletedAt: null })
                .populate({ path: 'categoryId', select: 'name' })
                .sort({ name: 1 });
            ApiResponse.success(res, vendors);
        } catch (error) {
            next(error);
        }
    }

    static async updateVendor(req: Request, res: Response, next: NextFunction) {
        try {
            const vendor = await Vendor.findByIdAndUpdate(
                req.params.id,
                req.body,
                { new: true },
            );
            if (!vendor) throw new NotFoundError('Vendor');
            ApiResponse.success(res, vendor);
        } catch (error) {
            next(error);
        }
    }

    // ══════════════════════════════════════════════════════════
    //  GLOBAL — Commission Rules (SUPER_ADMIN only)
    // ══════════════════════════════════════════════════════════

    static async createCommissionRule(req: Request, res: Response, next: NextFunction) {
        try {
            const rule = await CommissionRule.create(req.body);
            ApiResponse.created(res, rule);
        } catch (error) {
            next(error);
        }
    }

    static async getCommissionRules(_req: Request, res: Response, next: NextFunction) {
        try {
            const rules = await CommissionRule.find({ deletedAt: null })
                .populate({ path: 'vendorCategoryId', select: 'name' })
                .sort({ createdAt: -1 });
            ApiResponse.success(res, rules);
        } catch (error) {
            next(error);
        }
    }

    static async updateCommissionRule(req: Request, res: Response, next: NextFunction) {
        try {
            const rule = await CommissionRule.findByIdAndUpdate(
                req.params.id,
                req.body,
                { new: true },
            );
            if (!rule) throw new NotFoundError('Commission rule');
            ApiResponse.success(res, rule);
        } catch (error) {
            next(error);
        }
    }

    // ══════════════════════════════════════════════════════════
    //  TENANT — Procurement Requests
    // ══════════════════════════════════════════════════════════

    static async submitRequest(req: Request, res: Response, next: NextFunction) {
        try {
            const societyId = req.user?.societyId!;
            const userId = req.user?.userId!;

            const request = await ProcurementService.submitRequest(societyId, userId, req.body);
            ApiResponse.created(res, request);
        } catch (error) {
            next(error);
        }
    }

    static async getRequests(req: Request, res: Response, next: NextFunction) {
        try {
            const societyId = req.user?.societyId!;
            const requests = await ProcurementService.getRequests(societyId);
            ApiResponse.success(res, requests);
        } catch (error) {
            next(error);
        }
    }

    // ══════════════════════════════════════════════════════════
    //  TENANT — Quotes
    // ══════════════════════════════════════════════════════════

    static async attachQuote(req: Request, res: Response, next: NextFunction) {
        try {
            const societyId = req.user?.societyId!;
            const userId = req.user?.userId!;
            const id = req.params.id as string;

            const quote = await ProcurementService.attachQuote(societyId, id, userId, req.body);
            ApiResponse.created(res, quote);
        } catch (error) {
            next(error);
        }
    }

    static async getQuotes(req: Request, res: Response, next: NextFunction) {
        try {
            const societyId = req.user?.societyId!;
            const id = req.params.id as string;

            const quotes = await ProcurementService.getQuotes(societyId, id);
            ApiResponse.success(res, quotes);
        } catch (error) {
            next(error);
        }
    }

    // ══════════════════════════════════════════════════════════
    //  TENANT — Approve Quote
    // ══════════════════════════════════════════════════════════

    static async approveQuote(req: Request, res: Response, next: NextFunction) {
        try {
            const societyId = req.user?.societyId!;
            const userId = req.user?.userId!;
            const id = req.params.id as string;
            const { quoteId } = req.body;

            const result = await ProcurementService.approveQuote(societyId, id, quoteId, userId);
            ApiResponse.success(res, result);
        } catch (error) {
            next(error);
        }
    }

    // ══════════════════════════════════════════════════════════
    //  TENANT — Purchase Orders
    // ══════════════════════════════════════════════════════════

    static async generatePO(req: Request, res: Response, next: NextFunction) {
        try {
            const societyId = req.user?.societyId!;
            const userId = req.user?.userId!;
            const id = req.params.id as string;

            const po = await ProcurementService.generatePO(
                societyId,
                id,
                userId,
                req.body?.notes,
            );
            ApiResponse.created(res, po);
        } catch (error) {
            next(error);
        }
    }

    static async completePO(req: Request, res: Response, next: NextFunction) {
        try {
            const societyId = req.user?.societyId!;
            const id = req.params.id as string;

            const result = await ProcurementService.completePO(societyId, id);
            ApiResponse.success(res, result);
        } catch (error) {
            next(error);
        }
    }

    static async getPurchaseOrders(req: Request, res: Response, next: NextFunction) {
        try {
            const societyId = req.user?.societyId!;

            const pos = await PurchaseOrder.find({ societyId })
                .setOptions({ tenantId: societyId })
                .populate({ path: 'vendorId', select: 'name contactPerson' })
                .populate({ path: 'procurementRequestId', select: 'title' })
                .sort({ issuedDate: -1 });

            ApiResponse.success(res, pos);
        } catch (error) {
            next(error);
        }
    }

    // ══════════════════════════════════════════════════════════
    //  TENANT — Commission Records
    // ══════════════════════════════════════════════════════════

    static async getCommissions(req: Request, res: Response, next: NextFunction) {
        try {
            const societyId = req.user?.societyId!;
            const records = await ProcurementService.getCommissions(societyId);
            ApiResponse.success(res, records);
        } catch (error) {
            next(error);
        }
    }
}
