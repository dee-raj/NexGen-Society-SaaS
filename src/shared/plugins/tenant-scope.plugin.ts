import { Schema, Query, SaveOptions } from 'mongoose';
import { logger } from '../../config/logger';

/**
 * Mongoose plugin: STRICT automatic tenant scoping.
 *
 * Applied to every tenant-scoped schema. This is the LAST LINE OF DEFENSE
 * for tenant isolation — belt-and-suspenders with TenantService.
 *
 * Behavior:
 *   • If `tenantId` is set in query options → injects `{ societyId: tenantId }` into filter
 *   • If `skipTenantCheck: true` is in options → bypasses (SUPER_ADMIN cross-tenant ops)
 *   • Otherwise → THROWS to prevent silent cross-tenant leakage
 *
 * Usage in service layer (via TenantService):
 *   Model.find({}, null, { tenantId: req.tenantId })
 *
 * SUPER_ADMIN bypass:
 *   Model.find({}, null, { skipTenantCheck: true })
 */
export function tenantScopePlugin(schema: Schema): void {
    // ── Add societyId field to schema ─────────────────────────
    schema.add({
        societyId: {
            type: Schema.Types.ObjectId,
            ref: 'Society',
            required: true,
            index: true,
        },
    });

    // ── Query hooks: inject or enforce tenant scope ──────────
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
    ] as const;

    for (const method of queryMethods) {
        schema.pre(method, function (this: Query<unknown, unknown>) {
            const options = this.getOptions();

            // Explicit opt-out for SUPER_ADMIN cross-tenant operations
            if (options.skipTenantCheck) {
                return;
            }

            const tenantId = options.tenantId;
            if (tenantId) {
                this.where({ societyId: tenantId });
                return;
            }

            // No tenantId and no skipTenantCheck — FAIL SAFE
            const modelName = this.model?.modelName || 'Unknown';
            const error = new Error(
                `[TENANT VIOLATION] Query on tenant-scoped model "${modelName}" ` +
                `executed without tenantId. Pass { tenantId } or { skipTenantCheck: true } in options.`,
            );
            logger.error(
                { model: modelName, method, stack: error.stack },
                'Tenant scope violation detected',
            );
            throw error;
        });
    }

    // ── Aggregate pipeline: prepend $match stage ─────────────
    schema.pre('aggregate', function () {
        const options = this.options as Record<string, unknown>;

        if (options.skipTenantCheck) {
            return;
        }

        const tenantId = options.tenantId;
        if (tenantId) {
            this.pipeline().unshift({ $match: { societyId: tenantId } });
            return;
        }

        const error = new Error(
            `[TENANT VIOLATION] Aggregate on tenant-scoped model executed without tenantId.`,
        );
        logger.error({ stack: error.stack }, 'Tenant scope violation in aggregate');
        throw error;
    });

    // ── Save hook: ensure societyId is set on new documents ──
    schema.pre('save', function () {
        if (this.isNew && !this.get('societyId')) {
            throw new Error(
                `[TENANT VIOLATION] Attempted to save new document without societyId. ` +
                `Always set societyId when creating tenant-scoped documents.`,
            );
        }
    });
}
