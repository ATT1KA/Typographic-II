import { Router } from 'express';
import { searchRouter } from './search';
import { workflowsRouter } from './workflows';
import { dashboardsRouter } from './dashboards';
import { reportsRouter } from './reports';

const router = Router();

router.use('/search', searchRouter);
router.use('/workflows', workflowsRouter);
router.use('/dashboards', dashboardsRouter);
router.use('/reports', reportsRouter);
router.get('/health', (_req, res) => {
	res.json({ ok: true, service: 'api', ts: Date.now() });
});

export default router;
