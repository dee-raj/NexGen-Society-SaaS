import { Request, Response, NextFunction } from 'express';
import { FinanceService } from './finance.service';
import { MaintenanceTemplate, Invoice, Payment, LedgerEntry, Expense } from './finance.model';
import { ApiResponse } from '../../shared/utils/api-response';
import { NotFoundError } from '@shared/utils/api-error';


export class FinanceController {
    // ── Maintenance Templates ──────────────────────────────────

    static async createTemplate(req: Request, res: Response, next: NextFunction) {
        try {
            const societyId = req.user?.societyId!;
            const template = new MaintenanceTemplate({
                ...req.body,
                societyId,
            });
            await template.save();

            ApiResponse.created(res, template);
        } catch (error) {
            next(error);
        }
    }

    static async getTemplates(req: Request, res: Response, next: NextFunction) {
        try {
            const societyId = req.user?.societyId!;
            const templates = await MaintenanceTemplate.find({ societyId });
            ApiResponse.success(res, templates, 200);
        } catch (error) {
            next(error);
        }
    }

    // ── Invoices ───────────────────────────────────────────────

    static async generateMonthlyInvoices(req: Request, res: Response, next: NextFunction) {
        try {
            const societyId = req.user?.societyId!;
            const { templateId, month, year, dueDate } = req.body;

            const result = await FinanceService.generateMonthlyInvoices(
                societyId,
                templateId,
                month,
                year,
                new Date(dueDate),
            );

            ApiResponse.created(res, result);
        } catch (error) {
            next(error);
        }
    }

    static async getInvoices(req: Request, res: Response, next: NextFunction) {
        try {
            const societyId = req.user?.societyId!;
            const invoices = await Invoice.find({ societyId })
                .populate('residentId', 'userId type status')
                .populate('flatId', 'number block floor')
                .sort({ issueDate: -1 });

            ApiResponse.success(res, invoices, 200);
        } catch (error) {
            next(error);
        }
    }

    // ── Payments ───────────────────────────────────────────────

    static async processPayment(req: Request, res: Response, next: NextFunction) {
        try {
            const societyId = req.user?.societyId!;
            const { invoiceId, amount, paymentMethod, transactionReference, notes } = req.body;

            const payment = await FinanceService.processPayment(
                societyId,
                invoiceId,
                amount,
                paymentMethod,
                transactionReference,
                notes,
            );

            ApiResponse.created(res, payment);
        } catch (error) {
            next(error);
        }
    }

    static async getPayments(req: Request, res: Response, next: NextFunction) {
        try {
            const societyId = req.user?.societyId!;
            const payments = await Payment.find({ societyId })
                .populate('residentId', 'userId type')
                .populate('invoiceId', 'invoiceNumber totalAmount status')
                .sort({ paymentDate: -1 });

            ApiResponse.success(res, payments, 200);
        } catch (error) {
            next(error);
        }
    }

    // ── Ledgers (Read-Only) ────────────────────────────────────

    static async getLedger(req: Request, res: Response, next: NextFunction) {
        try {
            const societyId = req.user?.societyId!;
            // Ledger entries are append-only. We fetch them ordered by date descending.
            const entries = await LedgerEntry.find({ societyId }).sort({ date: -1, createdAt: -1 });

            // The latest entry has the current balance
            const currentBalance = entries.length > 0 ? entries[0].balance : 0;

            ApiResponse.success(res, {
                currentBalance,
                entries,
            }, 200);
        } catch (error) {
            next(error);
        }
    }

    // ── Late Fees & Defaulters ─────────────────────────────────

    static async applyLateFees(req: Request, res: Response, next: NextFunction) {
        try {
            const societyId = req.user?.societyId!;
            const { lateFeeAmount } = req.body;

            const result = await FinanceService.applyLateFees(societyId, lateFeeAmount);

            ApiResponse.success(res, result, 200);
        } catch (error) {
            next(error);
        }
    }

    static async getDefaulters(req: Request, res: Response, next: NextFunction) {
        try {
            const societyId = req.user?.societyId!;
            const defaulters = await FinanceService.getDefaulters(societyId);

            ApiResponse.success(res, defaulters, 200);
        } catch (error) {
            next(error);
        }
    }

    // ── Expenses ───────────────────────────────────────────────

    static async createExpense(req: Request, res: Response, next: NextFunction) {
        try {
            const societyId = req.user?.societyId!;
            const expense = new Expense({
                ...req.body,
                societyId,
                date: new Date(req.body.date),
            });
            await expense.save();

            ApiResponse.created(res, expense);
        } catch (error) {
            next(error);
        }
    }

    static async getExpenses(req: Request, res: Response, next: NextFunction) {
        try {
            const societyId = req.user?.societyId!;
            const expenses = await Expense.find({ societyId }).sort({ date: -1 });
            ApiResponse.success(res, expenses, 200);
        } catch (error) {
            next(error);
        }
    }

    static async updateExpenseStatus(req: Request, res: Response, next: NextFunction) {
        try {
            const societyId = req.user?.societyId!;
            const { id } = req.params;
            const { status } = req.body;

            const expense = await Expense.findOneAndUpdate(
                { _id: id, societyId },
                { status, approvedBy: req.user?.userId },
                { new: true }
            );

            if (!expense) {
                throw new NotFoundError('Expense not found');
            }

            // A robust system might also add a CREDIT ledger entry when an expense is PAID out.
            // Leaving room for extension.

            ApiResponse.success(res, expense, 200);
        } catch (error) {
            next(error);
        }
    }
}
