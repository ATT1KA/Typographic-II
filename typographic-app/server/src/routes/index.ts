import { Router } from 'express';
import { searchRouter } from './search';
import { workflowsRouter } from './workflows';
import { dashboardsRouter } from './dashboards';
import { reportsRouter } from './reports';
import { flowRouter } from './flow';

const router = Router();

router.use('/search', searchRouter);
router.use('/workflows', workflowsRouter);
router.use('/dashboards', dashboardsRouter);
router.use('/reports', reportsRouter);
router.use('/flow', flowRouter);

export default router;
