import { Router } from 'express';
import { searchRouter } from './search.js';
import { workflowsRouter } from './workflows.js';
import { dashboardsRouter } from './dashboards.js';
import { reportsRouter } from './reports.js';

const router = Router();

router.use('/search', searchRouter);
router.use('/workflows', workflowsRouter);
router.use('/dashboards', dashboardsRouter);
router.use('/reports', reportsRouter);

export default router;
