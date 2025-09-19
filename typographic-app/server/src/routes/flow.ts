import { Router } from 'express';
import fs from 'fs';
import path from 'path';

const router = Router();

const dataDir = path.join(process.cwd(), 'data');
const flowPath = path.join(dataDir, 'flow.json');

function ensureFiles() {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  if (!fs.existsSync(flowPath)) {
    fs.writeFileSync(flowPath, JSON.stringify({ nodes: [], edges: [] }, null, 2), 'utf-8');
  }
}

router.get('/', (_req, res) => {
  try {
    ensureFiles();
    const json = fs.readFileSync(flowPath, 'utf-8');
    res.type('application/json').send(json);
  } catch (err) {
    res.status(500).json({ error: 'Failed to read flow file' });
  }
});

router.post('/', (req, res) => {
  try {
    const { nodes, edges } = req.body || {};
    if (!Array.isArray(nodes) || !Array.isArray(edges)) {
      return res.status(400).json({ error: 'Invalid payload' });
    }

    const cleanNodes = nodes.map((n: any) => {
      const d = { ...(n.data || {}) };
      if (d.onChange) delete (d as any).onChange;
      return { ...n, data: d };
    });

    ensureFiles();
    fs.writeFileSync(flowPath, JSON.stringify({ nodes: cleanNodes, edges }, null, 2), 'utf-8');
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to write flow file' });
  }
});

export const flowRouter = router;
