import { Router } from 'express';
import { StaffController } from './staff.controller';
import { validate } from '@shared/middleware/validate';
import { authenticate } from '@shared/middleware/authenticate';
import { tenantContext } from '@shared/middleware/tenant-context';
import { authorize } from '@shared/middleware/authorize';
import { Role } from '@shared/utils/constants';
import { createStaffSchema, updateStaffSchema, staffIdParamSchema } from './staff.validator';

const router = Router();

router.use(authenticate, tenantContext);

router.get('/', StaffController.getAll);
router.get('/:id', validate(staffIdParamSchema), StaffController.getById);

router.post('/',
    authorize(Role.SOCIETY_ADMIN, Role.SUPER_ADMIN),
    validate(createStaffSchema),
    StaffController.create
);

router.patch('/:id',
    authorize(Role.SOCIETY_ADMIN, Role.SUPER_ADMIN),
    validate(updateStaffSchema),
    StaffController.update
);

router.delete('/:id',
    authorize(Role.SOCIETY_ADMIN, Role.SUPER_ADMIN),
    validate(staffIdParamSchema),
    StaffController.delete
);

export default router;
