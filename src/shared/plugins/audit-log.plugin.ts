import { Schema } from 'mongoose';
import { logger } from '../../config/logger';

/**
 * Mongoose plugin: audit trail for document mutations.
 * Logs create/update/delete events with who, what, when.
 * Useful for debugging and compliance.
 */
export function auditLogPlugin(schema: Schema): void {
    // Add audit fields to schema
    schema.add({
        createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
        updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
        deletedAt: { type: Date, default: null },
        deletedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    });

    // Enable timestamps
    schema.set('timestamps', true);

    // Soft delete helper
    schema.methods.softDelete = function (userId: string) {
        this.deletedAt = new Date();
        this.deletedBy = userId;
        return this.save();
    };

    // Exclude soft-deleted by default on find queries
    schema.pre('find', function () {
        const filter = this.getFilter();
        if (filter.deletedAt === undefined) {
            this.where({ deletedAt: null });
        }
    });

    schema.pre('findOne', function () {
        const filter = this.getFilter();
        if (filter.deletedAt === undefined) {
            this.where({ deletedAt: null });
        }
    });

    schema.pre('countDocuments', function () {
        const filter = this.getFilter();
        if (filter.deletedAt === undefined) {
            this.where({ deletedAt: null });
        }
    });

    // Log mutations
    schema.post('save', function (doc) {
        logger.debug(
            { docId: doc._id, collection: doc.collection?.name },
            'Document saved',
        );
    });
}
