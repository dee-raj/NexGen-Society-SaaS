import { PAGINATION } from './constants';

export interface PaginationQuery {
    page: number;
    limit: number;
    skip: number;
}

/**
 * Normalizes page/limit from query params with safe defaults and ceiling.
 * Usage: const { page, limit, skip } = parsePagination(req.query);
 */
export const parsePagination = (query: Record<string, unknown>): PaginationQuery => {
    let page = Number(query.page) || PAGINATION.DEFAULT_PAGE;
    let limit = Number(query.limit) || PAGINATION.DEFAULT_LIMIT;

    if (page < 1) page = 1;
    if (limit < 1) limit = PAGINATION.DEFAULT_LIMIT;
    if (limit > PAGINATION.MAX_LIMIT) limit = PAGINATION.MAX_LIMIT;

    return {
        page,
        limit,
        skip: (page - 1) * limit,
    };
};
