import { Schema, Query } from 'mongoose';

/**
 * Mongoose plugin: automatic tenant scoping.
 *
 * Applied to every tenant-scoped schema. On every query operation,
 * this plugin injects `{ societyId }` from the query options into the filter.
 *
 * Usage in service:
 *   Model.find({}, null, { tenantId: req.tenantId })
 *
 * This is the LAST LINE OF DEFENSE for tenant isolation.
 * Even if a developer forgets to filter by societyId manually,
 * this plugin ensures no cross-tenant data leakage.
 */
export function tenantScopePlugin(schema: Schema): void {
    // Add societyId field to schema
    schema.add({
        societyId: {
            type: Schema.Types.ObjectId,
            required: true,
            index: true,
        },
    });

    const queryMethods = [
        'find',
        'findOne',
        'findOneAndUpdate',
        'findOneAndDelete',
        'findOneAndReplace',
        'updateOne',
        'updateMany',
        'deleteOne',
        'deleteMany',
        'countDocuments',
        'estimatedDocumentCount',
    ] as const;

    for (const method of queryMethods) {
        schema.pre(method, function (this: Query<unknown, unknown>) {
            const tenantId = this.getOptions().tenantId;
            if (tenantId) {
                this.where({ societyId: tenantId });
            }
        });
    }

    // Aggregate pipeline: prepend $match stage
    schema.pre('aggregate', function () {
        const options = this.options as Record<string, unknown>;
        const tenantId = options.tenantId;
        if (tenantId) {
            this.pipeline().unshift({ $match: { societyId: tenantId } });
        }
    });
}
