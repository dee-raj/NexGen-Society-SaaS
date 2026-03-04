import { Router } from 'express';
import { ResidentController } from './resident.controller';
import { validate } from '@shared/middleware/validate';
import { authenticate } from '@shared/middleware/authenticate';
import { tenantContext } from '@shared/middleware/tenant-context';
import { authorize } from '@shared/middleware/authorize';
import { Role } from '@shared/utils/constants';
import { createResidentSchema, updateResidentSchema, residentIdParamSchema } from './resident.validator';

const router = Router();

router.use(authenticate, tenantContext);

router.get('/', ResidentController.getAll);
router.get('/:id', validate(residentIdParamSchema), ResidentController.getById);

router.post('/',
    authorize(Role.SOCIETY_ADMIN, Role.SUPER_ADMIN),
    validate(createResidentSchema),
    ResidentController.create
);

router.patch('/:id',
    authorize(Role.SOCIETY_ADMIN, Role.SUPER_ADMIN),
    validate(updateResidentSchema),
    ResidentController.update
);

router.delete('/:id',
    authorize(Role.SOCIETY_ADMIN, Role.SUPER_ADMIN),
    validate(residentIdParamSchema),
    ResidentController.delete
);

export default router;
