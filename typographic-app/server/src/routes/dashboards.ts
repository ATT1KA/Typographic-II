import { Router } from 'express';

export const dashboardsRouter = Router();

const dashboards = new Map<string, any>();

dashboardsRouter.get('/', (_req, res) => {
  res.json(Array.from(dashboards.values()));
});

dashboardsRouter.post('/', (req, res) => {
  const id = String(Date.now());
  const dashboard = { id, ...req.body };
  dashboards.set(id, dashboard);
  res.status(201).json(dashboard);
});
