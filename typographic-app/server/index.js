import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 5175;
const dataDir = path.join(__dirname, 'data');

app.use(cors());
app.use(express.json({ limit: '2mb' }));

if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

// Helper: Sanitize nodes (remove functions)
const sanitizeNodes = (nodes) => {
  return nodes.map((n) => {
    const d = { ...(n.data || {}) };
    if (d.onChange) delete d.onChange;
    // Remove any function params in transforms
    if (d.config?.transforms) {
      d.config.transforms = d.config.transforms.map((t) => {
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

app.get('/api/flow/:id', (req, res) => {
  const { id } = req.params;
  const flowPath = path.join(dataDir, `${id}.json`);
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

app.post('/api/flow/:id', (req, res) => {
  const { id } = req.params;
  const { nodes, edges } = req.body || {};
  if (!Array.isArray(nodes) || !Array.isArray(edges)) {
    return res.status(400).json({ error: 'Invalid payload: nodes and edges must be arrays' });
  }
  const flowPath = path.join(dataDir, `${id}.json`);
  try {
    const cleanNodes = sanitizeNodes(nodes);
    fs.writeFileSync(flowPath, JSON.stringify({ nodes: cleanNodes, edges }, null, 2));
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to save flow', details: String(e) });
  }
});

app.listen(5176, () => console.log(`Flow server running on http://localhost:5176`));