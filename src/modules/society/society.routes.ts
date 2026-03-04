import { Router } from 'express';
import { SocietyController } from './society.controller';
import { validate } from '@shared/middleware/validate';
import { authenticate } from '@shared/middleware/authenticate';
import { authorize } from '@shared/middleware/authorize';
import { Role } from '@shared/utils/constants';
import {
    createSocietySchema,
    updateSocietySchema,
    societyIdParamSchema,
} from './society.validator';

const router = Router();

/**
 * All society routes require SUPER_ADMIN.
 * Society is the tenant entity — no tenantContext middleware needed.
 */
router.use(authenticate, authorize(Role.SUPER_ADMIN));

router.get(
    '/fetch-all',
    SocietyController.getAll
);
router.get(
    '/fetch-one/:id',
    validate(societyIdParamSchema),
    SocietyController.getById
);
router.post(
    '/create',
    validate(createSocietySchema),
    SocietyController.create
);
router.patch(
    '/update/:id',
    validate(updateSocietySchema),
    SocietyController.update
);
router.delete(
    '/delete/:id',
    validate(societyIdParamSchema),
    SocietyController.delete
);

export default router;
