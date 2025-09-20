import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { createWorkflow, getWorkflows, runWorkflow } from '../services/workflow.service';

export const workflowsRouter = Router();

workflowsRouter.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const flows = await getWorkflows();
    res.json(flows);
  } catch (err) {
    next(err);
  }
});

workflowsRouter.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const wf = await createWorkflow(req.body);
    res.status(201).json(wf);
  } catch (err) {
    next(err);
  }
});

workflowsRouter.post('/:id/run', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);
    const result = await runWorkflow(id);
    res.json(result);
  } catch (err) {
    next(err);
  }
});
