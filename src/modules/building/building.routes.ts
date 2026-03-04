import { Router } from 'express';
import { BuildingController } from './building.controller';
import { validate } from '@shared/middleware/validate';
import { authenticate } from '@shared/middleware/authenticate';
import { tenantContext } from '@shared/middleware/tenant-context';
import { authorize } from '@shared/middleware/authorize';
import { Role } from '@shared/utils/constants';
import { createBuildingSchema, updateBuildingSchema, buildingIdParamSchema } from './building.validator';

const router = Router();

router.use(authenticate, tenantContext);

// Read — all authenticated tenant users
router.get('/', BuildingController.getAll);
router.get('/:id',
    validate(buildingIdParamSchema),
    BuildingController.getById
);

// Write — SOCIETY_ADMIN and SUPER_ADMIN
router.post('/',
    authorize(Role.SOCIETY_ADMIN, Role.SUPER_ADMIN),
    validate(createBuildingSchema),
    BuildingController.create
);

router.patch('/:id',
    authorize(Role.SOCIETY_ADMIN, Role.SUPER_ADMIN),
    validate(updateBuildingSchema),
    BuildingController.update
);

router.delete('/:id',
    authorize(Role.SOCIETY_ADMIN, Role.SUPER_ADMIN),
    validate(buildingIdParamSchema),
    BuildingController.delete
);

export default router;
