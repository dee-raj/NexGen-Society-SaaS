import { StatusCodes } from 'http-status-codes';

/**
 * Base class for all operational errors.
 * The global error handler distinguishes ApiError (send to client)
 * from unexpected errors (log + generic 500).
 */
export class ApiError extends Error {
    public readonly statusCode: number;
    public readonly code: string;
    public readonly isOperational: boolean;
    public readonly details?: unknown;

    constructor(
        statusCode: number,
        message: string,
        code: string = 'INTERNAL_ERROR',
        details?: unknown,
    ) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.isOperational = true;
        this.details = details;
        Object.setPrototypeOf(this, new.target.prototype);
        Error.captureStackTrace(this, this.constructor);
    }
}

export class NotFoundError extends ApiError {
    constructor(resource: string = 'Resource') {
        super(StatusCodes.NOT_FOUND, `${resource} not found`, 'NOT_FOUND');
    }
}

export class BadRequestError extends ApiError {
    constructor(message: string, details?: unknown) {
        super(StatusCodes.BAD_REQUEST, message, 'BAD_REQUEST', details);
    }
}

export class UnauthorizedError extends ApiError {
    constructor(message: string = 'Authentication required') {
        super(StatusCodes.UNAUTHORIZED, message, 'UNAUTHORIZED');
    }
}

export class ForbiddenError extends ApiError {
    constructor(message: string = 'Insufficient permissions') {
        super(StatusCodes.FORBIDDEN, message, 'FORBIDDEN');
    }
}

export class ConflictError extends ApiError {
    constructor(message: string) {
        super(StatusCodes.CONFLICT, message, 'CONFLICT');
    }
}

export class ValidationError extends ApiError {
    constructor(details: unknown) {
        super(StatusCodes.UNPROCESSABLE_ENTITY, 'Validation failed', 'VALIDATION_ERROR', details);
    }
}

export class TenantMismatchError extends ForbiddenError {
    constructor() {
        super('Tenant context mismatch — access denied');
    }
}
