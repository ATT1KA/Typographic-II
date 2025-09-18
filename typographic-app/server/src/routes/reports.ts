import { Router } from 'express';

export const reportsRouter = Router();

reportsRouter.post('/', (req, res) => {
  const { title = 'Executive Brief', content = 'Generated report', format = 'html' } = req.body || {};
  const id = String(Date.now());
  res.status(201).json({ id, title, format, content });
});
