import { Router } from 'express';
import { FlatController } from './flat.controller';
import { validate } from '../../shared/middleware/validate';
import { authenticate } from '../../shared/middleware/authenticate';
import { tenantContext } from '../../shared/middleware/tenant-context';
import { authorize } from '../../shared/middleware/authorize';
import { Role } from '../../shared/utils/constants';
import { createFlatSchema, updateFlatSchema, flatIdParamSchema } from './flat.validator';

const router = Router();

router.use(authenticate, tenantContext);

router.get('/', FlatController.getAll);
router.get('/:id', validate(flatIdParamSchema), FlatController.getById);

router.post('/', authorize(Role.SOCIETY_ADMIN, Role.SUPER_ADMIN), validate(createFlatSchema), FlatController.create);
router.patch('/:id', authorize(Role.SOCIETY_ADMIN, Role.SUPER_ADMIN), validate(updateFlatSchema), FlatController.update);
router.delete('/:id', authorize(Role.SOCIETY_ADMIN, Role.SUPER_ADMIN), validate(flatIdParamSchema), FlatController.delete);

export default router;
