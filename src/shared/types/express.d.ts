import { Role } from '../utils/constants';

/**
 * Extends Express Request with tenant and auth context,
 * attached by middleware during the request lifecycle.
 */
declare global {
    namespace Express {
        interface Request {
            /** Unique request correlation ID for logging and tracing */
            requestId: string;

            /** Authenticated user — attached by authenticate middleware */
            user?: {
                userId: string;
                societyId?: string;
                role: Role;
                email: string;
            };

            /** Tenant context — attached by tenant-context middleware */
            tenantId?: string | null;
        }
    }
}

export { };
