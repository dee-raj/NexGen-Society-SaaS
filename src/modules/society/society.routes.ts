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
router.use(authenticate);

router.get(
    '/fetch-all',
    authorize(Role.SUPER_ADMIN),
    SocietyController.getAll
);
router.get(
    '/fetch-one/:id',
    authorize(Role.SUPER_ADMIN, Role.SOCIETY_ADMIN),
    validate(societyIdParamSchema),
    SocietyController.getById
);
router.post(
    '/create',
    authorize(Role.SUPER_ADMIN),
    validate(createSocietySchema),
    SocietyController.create
);
router.patch(
    '/update/:id',
    authorize(Role.SUPER_ADMIN, Role.SOCIETY_ADMIN),
    validate(updateSocietySchema),
    SocietyController.update
);
router.delete(
    '/delete/:id',
    authorize(Role.SUPER_ADMIN),
    validate(societyIdParamSchema),
    SocietyController.delete
);

export default router;
