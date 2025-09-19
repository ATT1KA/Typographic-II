import { Router } from 'express';
import { performSearch } from '../services/discovery.service';

export const searchRouter = Router();

searchRouter.get('/', async (req, res, next) => {
  try {
    const q = String(req.query.q || '').trim();
    const results = await performSearch(q);
    res.json({ query: q, results });
  } catch (err) {
    next(err);
  }
});
