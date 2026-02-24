import { Response } from 'express';
import { StatusCodes } from 'http-status-codes';

interface PaginationMeta {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

interface SuccessResponse<T> {
    success: true;
    data: T;
    meta?: PaginationMeta;
    requestId?: string;
}

interface ErrorResponse {
    success: false;
    error: {
        code: string;
        message: string;
        details?: unknown;
    };
    requestId?: string;
}

/**
 * Standardized response helpers enforce a consistent API envelope
 * across every route — clients always know the shape.
 */
export class ApiResponse {
    static success<T>(res: Response, data: T, statusCode: number = StatusCodes.OK): void {
        const response: SuccessResponse<T> = {
            success: true,
            data,
            requestId: res.req?.requestId,
        };
        res.status(statusCode).json(response);
    }

    static paginated<T>(
        res: Response,
        data: T[],
        total: number,
        page: number,
        limit: number,
    ): void {
        const response: SuccessResponse<T[]> = {
            success: true,
            data,
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
            requestId: res.req?.requestId,
        };
        res.status(StatusCodes.OK).json(response);
    }

    static created<T>(res: Response, data: T): void {
        ApiResponse.success(res, data, StatusCodes.CREATED);
    }

    static noContent(res: Response): void {
        res.status(StatusCodes.NO_CONTENT).send();
    }

    static error(
        res: Response,
        statusCode: number,
        code: string,
        message: string,
        details?: unknown,
    ): void {
        const response: ErrorResponse = {
            success: false,
            error: { code, message, details },
            requestId: res.req?.requestId,
        };
        res.status(statusCode).json(response);
    }
}
