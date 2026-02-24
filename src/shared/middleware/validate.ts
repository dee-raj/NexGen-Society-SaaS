import { Request, Response, NextFunction } from 'express';
import { ZodType, ZodError } from 'zod';
import { ValidationError } from '../utils/api-error';

/**
 * Factory middleware that validates req.body, req.query, and req.params
 * against a Zod schema. Strips unknown fields (prevents mass-assignment).
 *
 * Usage: router.post('/foo', validate(createFooSchema), handler)
 */
export const validate = (schema: ZodType) => {
    return (req: Request, _res: Response, next: NextFunction): void => {
        try {
            schema.parse({
                body: req.body,
                query: req.query,
                params: req.params,
            });
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                const details = error.issues.map((issue) => ({
                    field: issue.path.join('.'),
                    message: issue.message,
                }));
                next(new ValidationError(details));
            } else {
                next(error);
            }
        }
    };
};
