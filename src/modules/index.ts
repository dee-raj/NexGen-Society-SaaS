import { Router } from 'express';

import authRoutes from './auth/auth.routes';
import noticeRoutes from './notices/notices.routes';
import societyRoutes from './society/society.routes';
import residentRoutes from './resident/resident.routes';
import buildingRoutes from './building/building.routes';
import flatRoutes from './flat/flat.routes';
import financeRoutes from './finance/finance.routes';
import procurementRoutes from './procurement/procurement.routes';
import complaintRoutes from './complaint/complaint.routes';
import notificationRoutes from './notification/notification.routes';
import analyticsRoutes from './analytics/analytics.routes';

const rootRouter = Router();

rootRouter.use("/auth", authRoutes);
rootRouter.use("/notices", noticeRoutes);
rootRouter.use("/societies", societyRoutes);
rootRouter.use("/residents", residentRoutes);
rootRouter.use("/buildings", buildingRoutes);
rootRouter.use("/flats", flatRoutes);
rootRouter.use("/finance", financeRoutes);
rootRouter.use("/procurement", procurementRoutes);
rootRouter.use("/complaints", complaintRoutes);
rootRouter.use("/notifications", notificationRoutes);
rootRouter.use("/analytics", analyticsRoutes);

export default rootRouter;
