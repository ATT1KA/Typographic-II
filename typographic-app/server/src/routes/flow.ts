import { Router } from 'express';
import fs from 'fs';
import path from 'path';

const router = Router();

// Data directory containing saved flows (matches existing files)
const DATA_DIR = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

router.get('/_health', (_req, res) => {
  try {
    const files = fs.readdirSync(DATA_DIR).filter((f) => f.endsWith('.json'));
    res.json({ ok: true, files });
  } catch (e) {
    res.status(500).json({ ok: false, error: 'filesystem' });
  }
});

router.get('/:id', (req, res) => {
  const id = (req.params.id || 'default').trim();
  const file = path.join(DATA_DIR, `${id}.json`);
  try {
    if (!fs.existsSync(file)) {
      return res.json({ nodes: [], edges: [] });
    }
    const json = fs.readFileSync(file, 'utf8');
    const data = JSON.parse(json);
    if (!Array.isArray(data.nodes) || !Array.isArray(data.edges)) {
      return res.status(500).json({ error: 'Invalid flow data structure' });
    }
    return res.json(data);
  } catch (e) {
    return res.status(500).json({ error: 'Failed to load flow' });
  }
});

router.post('/:id', (req, res) => {
  const id = (req.params.id || 'default').trim();
  const file = path.join(DATA_DIR, `${id}.json`);
  const payload = req.body || {};
  try {
    fs.writeFileSync(file, JSON.stringify(payload, null, 2), 'utf8');
    return res.json({ ok: true, id });
  } catch (e) {
    return res.status(500).json({ error: 'Failed to save flow' });
  }
});

export const flowRouter = router;
