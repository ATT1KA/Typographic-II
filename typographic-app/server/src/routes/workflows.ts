import { Router } from 'express';
import { createWorkflow, getWorkflows, runWorkflow } from '../services/workflow.service.js';

export const workflowsRouter = Router();

workflowsRouter.get('/', async (_req, res, next) => {
  try {
    const flows = await getWorkflows();
    res.json(flows);
  } catch (err) {
    next(err);
  }
});

workflowsRouter.post('/', async (req, res, next) => {
  try {
    const wf = await createWorkflow(req.body);
    res.status(201).json(wf);
  } catch (err) {
    next(err);
  }
});

workflowsRouter.post('/:id/run', async (req, res, next) => {
  try {
    const id = String(req.params.id);
    const result = await runWorkflow(id);
    res.json(result);
  } catch (err) {
    next(err);
  }
});
