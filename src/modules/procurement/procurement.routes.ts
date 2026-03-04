import { Router } from 'express';
import { ProcurementController } from './procurement.controller';
import {
    createVendorCategorySchema,
    updateVendorCategorySchema,
    createVendorSchema,
    updateVendorSchema,
    createCommissionRuleSchema,
    updateCommissionRuleSchema,
    createProcurementRequestSchema,
    attachQuoteSchema,
    approveQuoteSchema,
    generatePOSchema,
    completePOSchema,
} from './procurement.validation';
import { validate } from '@shared/middleware/validate';
import { Role } from '@shared/utils/constants';
import { authenticate } from '@shared/middleware/authenticate';
import { authorize } from '@shared/middleware/authorize';

const router = Router();

// All procurement routes require authentication
router.use(authenticate);

// ══════════════════════════════════════════════════════════════
//  GLOBAL — Vendor Categories (SUPER_ADMIN only)
// ══════════════════════════════════════════════════════════════

router.post(
    '/vendor-categories',
    authorize(Role.SUPER_ADMIN),
    validate(createVendorCategorySchema),
    ProcurementController.createVendorCategory,
);

router.get(
    '/vendor-categories',
    authorize(Role.SUPER_ADMIN, Role.SOCIETY_ADMIN),
    ProcurementController.getVendorCategories,
);

router.patch(
    '/vendor-categories/:id',
    authorize(Role.SUPER_ADMIN),
    validate(updateVendorCategorySchema),
    ProcurementController.updateVendorCategory,
);

// ══════════════════════════════════════════════════════════════
//  GLOBAL — Vendors (SUPER_ADMIN only)
// ══════════════════════════════════════════════════════════════

router.post(
    '/vendors',
    authorize(Role.SUPER_ADMIN),
    validate(createVendorSchema),
    ProcurementController.createVendor,
);

router.get(
    '/vendors',
    authorize(Role.SUPER_ADMIN, Role.SOCIETY_ADMIN),
    ProcurementController.getVendors,
);

router.patch(
    '/vendors/:id',
    authorize(Role.SUPER_ADMIN),
    validate(updateVendorSchema),
    ProcurementController.updateVendor,
);

// ══════════════════════════════════════════════════════════════
//  GLOBAL — Commission Rules (SUPER_ADMIN only)
// ══════════════════════════════════════════════════════════════

router.post(
    '/commission-rules',
    authorize(Role.SUPER_ADMIN),
    validate(createCommissionRuleSchema),
    ProcurementController.createCommissionRule,
);

router.get(
    '/commission-rules',
    authorize(Role.SUPER_ADMIN),
    ProcurementController.getCommissionRules,
);

router.patch(
    '/commission-rules/:id',
    authorize(Role.SUPER_ADMIN),
    validate(updateCommissionRuleSchema),
    ProcurementController.updateCommissionRule,
);

// ══════════════════════════════════════════════════════════════
//  TENANT — Procurement Requests
// ══════════════════════════════════════════════════════════════

router.post(
    '/requests',
    authorize(Role.SOCIETY_ADMIN),
    validate(createProcurementRequestSchema),
    ProcurementController.submitRequest,
);

router.get(
    '/requests',
    authorize(Role.SOCIETY_ADMIN, Role.SUPER_ADMIN),
    ProcurementController.getRequests,
);

// ══════════════════════════════════════════════════════════════
//  TENANT — Quotes (Super Admin attaches, Society Admin views)
// ══════════════════════════════════════════════════════════════

router.post(
    '/requests/:id/quotes',
    authorize(Role.SUPER_ADMIN),
    validate(attachQuoteSchema),
    ProcurementController.attachQuote,
);

router.get(
    '/requests/:id/quotes',
    authorize(Role.SOCIETY_ADMIN, Role.SUPER_ADMIN),
    ProcurementController.getQuotes,
);

// ══════════════════════════════════════════════════════════════
//  TENANT — Approve Quote (Society Admin)
// ══════════════════════════════════════════════════════════════

router.patch(
    '/requests/:id/approve',
    authorize(Role.SOCIETY_ADMIN),
    validate(approveQuoteSchema),
    ProcurementController.approveQuote,
);

// ══════════════════════════════════════════════════════════════
//  TENANT — Purchase Orders
// ══════════════════════════════════════════════════════════════

router.post(
    '/requests/:id/po',
    authorize(Role.SUPER_ADMIN),
    validate(generatePOSchema),
    ProcurementController.generatePO,
);

router.get(
    '/purchase-orders',
    authorize(Role.SOCIETY_ADMIN, Role.SUPER_ADMIN),
    ProcurementController.getPurchaseOrders,
);

router.patch(
    '/purchase-orders/:id/complete',
    authorize(Role.SUPER_ADMIN),
    validate(completePOSchema),
    ProcurementController.completePO,
);

// ══════════════════════════════════════════════════════════════
//  TENANT — Commission Records
// ══════════════════════════════════════════════════════════════

router.get(
    '/commissions',
    authorize(Role.SOCIETY_ADMIN, Role.SUPER_ADMIN),
    ProcurementController.getCommissions,
);

export default router;
