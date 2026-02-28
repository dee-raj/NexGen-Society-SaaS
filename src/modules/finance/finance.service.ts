import mongoose, { Types } from 'mongoose';
import {
    Invoice,
    Payment,
    LedgerEntry,
    MaintenanceTemplate,
} from './finance.model';
import { Resident } from '../resident/resident.model';
import { Flat } from '../flat/flat.model';
import {
    InvoiceStatus,
    PaymentMethod,
    LedgerEntryType,
    ResidentStatus,
    CalculationMethod,
} from '../../shared/utils/constants';

export class FinanceService {
    /**
     * Generates monthly maintenance invoices for all active residents
     * @param societyId Society ID
     * @param templateId MaintenanceTemplate ID active for the society
     * @param month Invoice month (1-12)
     * @param year Invoice year (e.g., 2026)
     * @param dueDate Due date for the payment
     */
    static async generateMonthlyInvoices(
        societyId: string,
        templateId: string,
        month: number,
        year: number,
        dueDate: Date,
    ) {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const template = await MaintenanceTemplate.findOne({
                _id: templateId,
                societyId,
                isActive: true,
            }).session(session);

            if (!template) {
                throw new Error('Active maintenance template not found');
            }

            // Get all flats with their active residents (typically owners or tenants responsible for maintenance)
            // Simplified: Generate an invoice per flat, assigned to the primary active resident
            const flats = await Flat.find({ societyId }).session(session);
            let generatedCount = 0;

            for (const flat of flats) {
                // Find primary active resident for the flat
                const resident = await Resident.findOne({
                    flatId: flat._id,
                    status: ResidentStatus.ACTIVE,
                }).session(session);

                if (!resident) continue; // Skip flats without active residents

                // Check if invoice already exists for this period
                const existingInvoice = await Invoice.findOne({
                    flatId: flat._id,
                    'period.month': month,
                    'period.year': year,
                }).session(session);

                if (existingInvoice) continue;

                // Calculate Amount
                let amount = 0;
                if (template.calculationMethod === CalculationMethod.FIXED) {
                    amount = template.amountOrRate;
                } else if (template.calculationMethod === CalculationMethod.PER_SQFT) {
                    if (!flat.area) {
                        throw new Error(`Flat ${flat.unitNumber} does not have an area defined for PER_SQFT calculation`);
                    }
                    amount = template.amountOrRate * flat.area;
                }

                const invoiceNumber = `INV-${year}${month.toString().padStart(2, '0')}-${flat.unitNumber}`;

                // Create Invoice
                const invoice = new Invoice({
                    societyId,
                    residentId: resident._id,
                    flatId: flat._id,
                    invoiceNumber,
                    issueDate: new Date(),
                    dueDate,
                    period: { month, year },
                    items: [
                        {
                            description: `${template.name} for ${month}/${year}`,
                            amount,
                        },
                    ],
                    subtotal: amount,
                    totalAmount: amount, // late fees can be added later
                    status: InvoiceStatus.ISSUED,
                });

                await invoice.save({ session });

                // Create DEBIT Ledger Entry for the invoice generated
                // First get current balance for the society (simplistic form: total balance across society context)
                // For a robust system, balance might be per-resident or per-society. We'll track society's overall receivables as balance.
                // Wait, if DEBIT represents money DUE to the society, balance goes up (Account Receivable).
                // Let's get the last ledger entry to calculate continuous balance.

                const lastEntry = await LedgerEntry.findOne({ societyId })
                    .sort({ date: -1, createdAt: -1 })
                    .session(session);

                const currentBalance = lastEntry ? lastEntry.balance : 0;
                const newBalance = currentBalance + amount; // Accounts Receivable increases

                const ledgerEntry = new LedgerEntry({
                    societyId,
                    type: LedgerEntryType.DEBIT,
                    amount,
                    balance: newBalance,
                    description: `Invoice ${invoiceNumber} issued to Flat ${flat.unitNumber}`,
                    referenceType: 'Invoice',
                    referenceId: invoice._id,
                    date: new Date(),
                });

                await ledgerEntry.save({ session });
                generatedCount++;
            }

            await session.commitTransaction();
            return { message: `${generatedCount} invoices generated successfully.` };
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }

    /**
     * Processes a payment for an invoice with strong transactional consistency
     */
    static async processPayment(
        societyId: string,
        invoiceId: string,
        amount: number,
        paymentMethod: PaymentMethod,
        transactionReference?: string,
        notes?: string,
    ) {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const invoice = await Invoice.findOne({ _id: invoiceId, societyId }).session(session);

            if (!invoice) {
                throw new Error('Invoice not found');
            }

            if (invoice.status === InvoiceStatus.PAID) {
                throw new Error('Invoice is already fully paid');
            }

            if (invoice.status === InvoiceStatus.CANCELLED) {
                throw new Error('Invoice is cancelled');
            }

            const remainingAmount = invoice.totalAmount - invoice.amountPaid;

            if (amount > remainingAmount) {
                throw new Error(`Payment amount (${amount}) exceeds remaining due (${remainingAmount})`);
            }

            // Create Payment Record
            const payment = new Payment({
                societyId,
                invoiceId: invoice._id,
                residentId: invoice.residentId,
                transactionReference,
                amount,
                paymentMethod,
                notes,
            });

            await payment.save({ session });

            // Update Invoice
            invoice.amountPaid += amount;
            if (invoice.amountPaid >= invoice.totalAmount) {
                invoice.status = InvoiceStatus.PAID;
            } else if (invoice.amountPaid > 0) {
                invoice.status = InvoiceStatus.ISSUED; // Or PARTIALLY_PAID if you had the enum
            }

            await invoice.save({ session });

            // Create CREDIT Ledger Entry (Money received)
            const lastEntry = await LedgerEntry.findOne({ societyId })
                .sort({ date: -1, createdAt: -1 })
                .session(session);

            const currentBalance = lastEntry ? lastEntry.balance : 0;
            // Accounts Receivable decreases, or Bank Balance increases.
            // Let's standardise: DEBIT = Due to society (+), CREDIT = Paid to society (-) 
            // So balance approaches 0 when all dues are paid.
            const newBalance = currentBalance - amount;

            const ledgerEntry = new LedgerEntry({
                societyId,
                type: LedgerEntryType.CREDIT,
                amount,
                balance: newBalance,
                description: `Payment received for Invoice ${invoice.invoiceNumber}`,
                referenceType: 'Payment',
                referenceId: payment._id,
                date: new Date(),
            });

            await ledgerEntry.save({ session });

            await session.commitTransaction();
            return payment;
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }

    /**
     * Applies late fees to all overdue invoices
     */
    static async applyLateFees(societyId: string, lateFeeAmount: number) {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const currentDate = new Date();
            const overdueInvoices = await Invoice.find({
                societyId,
                dueDate: { $lt: currentDate },
                status: { $in: [InvoiceStatus.ISSUED, InvoiceStatus.OVERDUE] }, // Only active unpaid
            }).session(session);

            let appliedCount = 0;

            for (const invoice of overdueInvoices) {
                // To avoid multiple late fees per month, you might add a flag or check last modified
                // For simplicity, apply it once
                if (invoice.status !== InvoiceStatus.OVERDUE) {
                    invoice.lateFee += lateFeeAmount;
                    invoice.totalAmount += lateFeeAmount;
                    invoice.status = InvoiceStatus.OVERDUE;

                    // Add an item line for clarity
                    invoice.items.push({
                        description: 'Late Fee Penalty',
                        amount: lateFeeAmount
                    });

                    await invoice.save({ session });

                    // DEBIT entry for late fee
                    const lastEntry = await LedgerEntry.findOne({ societyId })
                        .sort({ date: -1, createdAt: -1 })
                        .session(session);

                    const currentBalance = lastEntry ? lastEntry.balance : 0;

                    const ledgerEntry = new LedgerEntry({
                        societyId,
                        type: LedgerEntryType.DEBIT,
                        amount: lateFeeAmount,
                        balance: currentBalance + lateFeeAmount,
                        description: `Late fee assessed for Invoice ${invoice.invoiceNumber}`,
                        referenceType: 'Invoice',
                        referenceId: invoice._id,
                        date: new Date(),
                    });

                    await ledgerEntry.save({ session });
                    appliedCount++;
                }
            }

            await session.commitTransaction();
            return { message: `Late fees applied to ${appliedCount} invoices.` };
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }

    /**
     * Query all defaulters (residents with overdue invoices)
     */
    static async getDefaulters(societyId: string) {
        // Aggregate to find residents with total overdue amount
        const defaulters = await Invoice.aggregate([
            {
                $match: {
                    societyId: new Types.ObjectId(societyId),
                    status: InvoiceStatus.OVERDUE,
                }
            },
            {
                $group: {
                    _id: '$residentId',
                    totalDue: { $sum: { $subtract: ['$totalAmount', '$amountPaid'] } },
                    invoiceCount: { $sum: 1 },
                    flats: { $addToSet: '$flatId' }
                }
            },
            {
                $lookup: {
                    from: 'users', // Assumes resident has user info populated via 'userId' mapping, but Resident model links to User collection
                    localField: '_id',
                    foreignField: '_id', // Actually in Resident it's userId. Let's lookup Residents
                    as: 'residentInfo'
                }
            },
            {
                $lookup: {
                    from: 'residents',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'residentDoc'
                }
            },
            {
                $unwind: '$residentDoc'
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'residentDoc.userId',
                    foreignField: '_id',
                    as: 'user'
                }
            },
            {
                $unwind: '$user'
            },
            {
                $project: {
                    _id: 1,
                    totalDue: 1,
                    invoiceCount: 1,
                    flats: 1,
                    name: '$user.firstName',
                    lastName: '$user.lastName',
                    email: '$user.email',
                    phone: '$user.phone'
                }
            }
        ]);

        return defaulters;
    }
}
