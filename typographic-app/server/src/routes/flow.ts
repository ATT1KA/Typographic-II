import { Router } from 'express';
import fs from 'fs';
import path from 'path';

const router = Router();

// Data directory containing saved flows (matches existing files)
const DATA_DIR = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

// Helper: Sanitize nodes (remove functions)
const sanitizeNodes = (nodes: any[]) => {
  return nodes.map((n) => {
    const d = { ...(n.data || {}) };
    if (d.onChange) delete d.onChange;
    // Remove any function params in transforms
    if (d.config?.transforms) {
      d.config.transforms = d.config.transforms.map((t: any) => {
        const cleanT = { ...t };
        if (cleanT.params && typeof cleanT.params === 'object') {
          Object.keys(cleanT.params).forEach((k) => {
            if (typeof cleanT.params[k] === 'function') delete cleanT.params[k];
          });
        }
        return cleanT;
      });
    }
    return { ...n, data: d };
  });
};

router.get('/_health', (_req, res) => {
  try {
    const files = fs.readdirSync(DATA_DIR).filter((f) => f.endsWith('.json'));
    res.json({ ok: true, files });
  } catch (e) {
    res.status(500).json({ ok: false, error: 'filesystem' });
  }
});

router.get('/:id', (req, res) => {
  const { id } = req.params;
  const flowPath = path.join(DATA_DIR, `${id}.json`);
  try {
    if (!fs.existsSync(flowPath)) {
      return res.json({ nodes: [], edges: [] });
    }
    const json = fs.readFileSync(flowPath, 'utf8');
    const data = JSON.parse(json);
    if (!Array.isArray(data.nodes) || !Array.isArray(data.edges)) {
      throw new Error('Invalid flow data structure');
    }
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: 'Failed to load flow', details: String(e) });
  }
});

router.post('/:id', (req, res) => {
  const { id } = req.params;
  const { nodes, edges } = req.body || {};
  if (!Array.isArray(nodes) || !Array.isArray(edges)) {
    return res.status(400).json({ error: 'Invalid payload: nodes and edges must be arrays' });
  }
  const flowPath = path.join(DATA_DIR, `${id}.json`);
  try {
    const cleanNodes = sanitizeNodes(nodes);
    fs.writeFileSync(flowPath, JSON.stringify({ nodes: cleanNodes, edges }, null, 2));
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to save flow', details: String(e) });
  }
});

export const flowRouter = router;
