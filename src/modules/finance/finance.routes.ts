import { Router } from 'express';
import { FinanceController } from './finance.controller';
import {
    createMaintenanceTemplateSchema,
    generateInvoicesSchema,
    processPaymentSchema,
    applyLateFeesSchema,
    createExpenseSchema,
    updateExpenseStatusSchema,
} from './finance.validation';
import { validate } from '../../shared/middleware/validate';
import { Role } from '../../shared/utils/constants';
import { authenticate } from '@shared/middleware/authenticate';
import { authorize } from '../../shared/middleware/authorize';
const router = Router();

// Only SOCIETY_ADMIN and SUPER_ADMIN can manage society finances
router.use(authenticate);
router.use(authorize(Role.SOCIETY_ADMIN, Role.SUPER_ADMIN));

// ── Maintenance Templates ──────────────────────────────────
router.post(
    '/templates',
    validate(createMaintenanceTemplateSchema),
    FinanceController.createTemplate,
);
router.get('/templates', FinanceController.getTemplates);

// ── Invoices ───────────────────────────────────────────────
router.post(
    '/invoices/generate',
    validate(generateInvoicesSchema),
    FinanceController.generateMonthlyInvoices,
);
router.get('/invoices', FinanceController.getInvoices);

// ── Payments ───────────────────────────────────────────────
router.post(
    '/payments',
    validate(processPaymentSchema),
    FinanceController.processPayment,
);
router.get('/payments', FinanceController.getPayments);

// ── Late Fees & Defaulters ─────────────────────────────────
router.post(
    '/late-fees',
    validate(applyLateFeesSchema),
    FinanceController.applyLateFees,
);
router.get('/defaulters', FinanceController.getDefaulters);

// ── Ledgers (Immutable) ────────────────────────────────────
router.get('/ledger', FinanceController.getLedger);

// ── Expenses ───────────────────────────────────────────────
router.post(
    '/expenses',
    validate(createExpenseSchema),
    FinanceController.createExpense,
);
router.get('/expenses', FinanceController.getExpenses);
router.patch(
    '/expenses/:id/status',
    validate(updateExpenseStatusSchema),
    FinanceController.updateExpenseStatus,
);

export const financeRoutes = router;
