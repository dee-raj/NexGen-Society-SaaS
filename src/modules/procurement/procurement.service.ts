import {
    ProcurementRequest,
    Quote,
    PurchaseOrder,
    CommissionRecord,
    CommissionRule,
    Vendor,
} from './procurement.model';
import { LedgerEntry } from '../finance/finance.model';
import {
    ProcurementStatus,
    QuoteStatus,
    POStatus,
    CommissionType,
    LedgerEntryType,
} from '@shared/utils/constants';
import { NotFoundError, BadRequestError } from '@shared/utils/api-error';

export class ProcurementService {
    // ── 1. Society Admin submits a procurement request ───────

    static async submitRequest(
        societyId: string,
        userId: string,
        data: { title: string; description: string; estimatedBudget: number; notes?: string },
    ) {
        const request = await ProcurementRequest.create({
            societyId,
            title: data.title,
            description: data.description,
            estimatedBudget: data.estimatedBudget,
            notes: data.notes,
            status: ProcurementStatus.SUBMITTED,
            requestedBy: userId,
        });

        return request;
    }

    // ── 2. Super Admin attaches vendor quotes ────────────────

    static async attachQuote(
        societyId: string,
        requestId: string,
        userId: string,
        data: {
            vendorId: string;
            amount: number;
            description?: string;
            validUntil: string;
            attachmentUrl?: string;
        },
    ) {
        const request = await ProcurementRequest.findOne({
            _id: requestId,
            societyId,
            status: { $in: [ProcurementStatus.SUBMITTED, ProcurementStatus.QUOTED] },
        }).setOptions({ tenantId: societyId });

        if (!request) {
            throw new NotFoundError('Procurement request not found or not in a quotable state');
        }

        // Verify vendor exists and is active
        const vendor = await Vendor.findOne({ _id: data.vendorId, isActive: true });
        if (!vendor) {
            throw new NotFoundError('Active vendor not found');
        }

        const quote = await Quote.create({
            societyId,
            procurementRequestId: requestId,
            vendorId: data.vendorId,
            amount: data.amount,
            description: data.description,
            validUntil: new Date(data.validUntil),
            status: QuoteStatus.PENDING,
            attachmentUrl: data.attachmentUrl,
            submittedBy: userId,
        });

        // Update request status to QUOTED
        if (request.status === ProcurementStatus.SUBMITTED) {
            request.status = ProcurementStatus.QUOTED;
            await request.save();
        }

        return quote;
    }

    // ── 3. Society Admin approves a quote ────────────────────

    static async approveQuote(
        societyId: string,
        requestId: string,
        quoteId: string,
        userId: string,
    ) {
        const request = await ProcurementRequest.findOne({
            _id: requestId,
            societyId,
            status: ProcurementStatus.QUOTED,
        }).setOptions({ tenantId: societyId });

        if (!request) {
            throw new NotFoundError('Procurement request not found or not in QUOTED state');
        }

        const quote = await Quote.findOne({
            _id: quoteId,
            procurementRequestId: requestId,
            status: QuoteStatus.PENDING,
        }).setOptions({ tenantId: societyId });

        if (!quote) {
            throw new NotFoundError('Quote not found or already processed');
        }

        // Accept this quote
        quote.status = QuoteStatus.ACCEPTED;
        await quote.save();

        // Reject all other pending quotes for this request
        await Quote.updateMany(
            {
                procurementRequestId: requestId,
                _id: { $ne: quoteId },
                status: QuoteStatus.PENDING,
            },
            { status: QuoteStatus.REJECTED },
        ).setOptions({ tenantId: societyId });

        // Update request status
        request.status = ProcurementStatus.APPROVED;
        request.approvedBy = userId as any;
        request.approvalDate = new Date();
        await request.save();

        return { request, acceptedQuote: quote };
    }

    // ── 4. PO generated (Super Admin) ────────────────────────

    static async generatePO(
        societyId: string,
        requestId: string,
        userId: string,
        notes?: string,
    ) {
        const request = await ProcurementRequest.findOne({
            _id: requestId,
            societyId,
            status: ProcurementStatus.APPROVED,
        }).setOptions({ tenantId: societyId });

        if (!request) {
            throw new NotFoundError('Approved procurement request not found');
        }

        const acceptedQuote = await Quote.findOne({
            procurementRequestId: requestId,
            status: QuoteStatus.ACCEPTED,
        }).setOptions({ tenantId: societyId });

        if (!acceptedQuote) {
            throw new NotFoundError('No accepted quote found for this request');
        }

        // Generate unique PO number
        const timestamp = Date.now().toString(36).toUpperCase();
        const poNumber = `PO-${timestamp}-${requestId.slice(-4).toUpperCase()}`;

        const po = await PurchaseOrder.create({
            societyId,
            procurementRequestId: requestId,
            quoteId: acceptedQuote._id,
            vendorId: acceptedQuote.vendorId,
            poNumber,
            amount: acceptedQuote.amount,
            status: POStatus.ISSUED,
            issuedBy: userId,
            issuedDate: new Date(),
            notes,
        });

        // Update request status
        request.status = ProcurementStatus.PO_ISSUED;
        await request.save();

        return po;
    }

    // ── 5. Commission calculation ────────────────────────────

    static async calculateCommission(
        societyId: string,
        purchaseOrderId: string,
    ) {
        const po = await PurchaseOrder.findOne({
            _id: purchaseOrderId,
            societyId,
        }).setOptions({ tenantId: societyId });

        if (!po) {
            throw new NotFoundError('Purchase order not found');
        }

        // Get vendor to find category
        const vendor = await Vendor.findById(po.vendorId);
        if (!vendor) {
            throw new NotFoundError('Vendor not found');
        }

        // Find active commission rule for this vendor category
        const rule = await CommissionRule.findOne({
            vendorCategoryId: vendor.categoryId,
            isActive: true,
        });

        if (!rule) {
            throw new NotFoundError('No active commission rule found for this vendor category');
        }

        // Calculate commission
        let commissionAmount: number;
        let calculationDetails: string;

        if (rule.commissionType === CommissionType.PERCENTAGE) {
            commissionAmount = (po.amount * rule.value) / 100;
            calculationDetails = `${rule.value}% of ₹${po.amount} = ₹${commissionAmount}`;
        } else {
            commissionAmount = rule.value;
            calculationDetails = `Fixed commission: ₹${rule.value}`;
        }

        // Apply min/max capping
        if (rule.minAmount && commissionAmount < rule.minAmount) {
            calculationDetails += ` → capped to floor ₹${rule.minAmount}`;
            commissionAmount = rule.minAmount;
        }
        if (rule.maxAmount && commissionAmount > rule.maxAmount) {
            calculationDetails += ` → capped to ceiling ₹${rule.maxAmount}`;
            commissionAmount = rule.maxAmount;
        }

        // Check if commission already exists for this PO
        const existingRecord = await CommissionRecord.findOne({
            purchaseOrderId,
        }).setOptions({ tenantId: societyId });

        if (existingRecord) {
            throw new BadRequestError('Commission already calculated for this purchase order');
        }

        // Create commission record
        const record = await CommissionRecord.create({
            societyId,
            purchaseOrderId,
            vendorId: po.vendorId,
            commissionRuleId: rule._id,
            poAmount: po.amount,
            commissionAmount,
            calculationDetails,
        });

        return record;
    }

    // ── 6. Ledger entry recorded ─────────────────────────────

    static async recordCommissionLedger(
        societyId: string,
        commissionRecordId: string,
    ) {
        const record = await CommissionRecord.findOne({
            _id: commissionRecordId,
            societyId,
        }).setOptions({ tenantId: societyId });

        if (!record) {
            throw new NotFoundError('Commission record not found');
        }

        if (record.ledgerEntryId) {
            throw new BadRequestError('Ledger entry already recorded for this commission');
        }

        // Get current balance
        const lastEntry = await LedgerEntry.findOne({ societyId })
            .sort({ date: -1, createdAt: -1 })
            .setOptions({ tenantId: societyId });

        const currentBalance = lastEntry ? lastEntry.balance : 0;
        const newBalance = currentBalance + record.commissionAmount;

        // Create DEBIT ledger entry (commission is a receivable / income)
        const ledgerEntry = await LedgerEntry.create({
            societyId,
            type: LedgerEntryType.DEBIT,
            amount: record.commissionAmount,
            balance: newBalance,
            description: `Procurement commission: ${record.calculationDetails}`,
            referenceType: 'PurchaseOrder',
            referenceId: record.purchaseOrderId,
            date: new Date(),
        });

        // Link ledger entry back to commission record
        record.ledgerEntryId = ledgerEntry._id as any;
        await record.save();

        return { record, ledgerEntry };
    }

    // ── Complete PO (triggers commission + ledger) ───────────

    static async completePO(societyId: string, poId: string) {
        const po = await PurchaseOrder.findOne({
            _id: poId,
            societyId,
            status: POStatus.ISSUED,
        }).setOptions({ tenantId: societyId });

        if (!po) {
            throw new NotFoundError('Issued purchase order not found');
        }

        // Mark PO as delivered
        po.status = POStatus.DELIVERED;
        po.deliveryDate = new Date();
        await po.save();

        // Update procurement request to COMPLETED
        await ProcurementRequest.findOneAndUpdate(
            { _id: po.procurementRequestId, societyId },
            { status: ProcurementStatus.COMPLETED },
        ).setOptions({ tenantId: societyId });

        // Calculate commission
        const commissionRecord = await ProcurementService.calculateCommission(
            societyId,
            poId,
        );

        // Record ledger entry
        const result = await ProcurementService.recordCommissionLedger(
            societyId,
            commissionRecord.id,
        );

        return {
            purchaseOrder: po,
            commission: result.record,
            ledgerEntry: result.ledgerEntry,
        };
    }

    // ── Get all procurement requests for a society ───────────

    static async getRequests(societyId: string) {
        return ProcurementRequest.find({ societyId })
            .setOptions({ tenantId: societyId })
            .populate({ path: 'requestedBy', select: 'firstName lastName email' })
            .populate({ path: 'approvedBy', select: 'firstName lastName email' })
            .sort({ createdAt: -1 });
    }

    // ── Get quotes for a request ─────────────────────────────

    static async getQuotes(societyId: string, requestId: string) {
        return Quote.find({ societyId, procurementRequestId: requestId })
            .setOptions({ tenantId: societyId })
            .populate({ path: 'vendorId', select: 'name contactPerson email phone' })
            .sort({ amount: 1 });
    }

    // ── Get commission records ───────────────────────────────

    static async getCommissions(societyId: string) {
        return CommissionRecord.find({ societyId })
            .setOptions({ tenantId: societyId })
            .populate({ path: 'purchaseOrderId', select: 'poNumber amount status' })
            .populate({ path: 'vendorId', select: 'name' })
            .sort({ createdAt: -1 });
    }
}
