import { useCallback, useEffect, useMemo, useRef, useState } from 'inferno';
import GraphView from '../graph/GraphView';
import CustomNode from '../components/CustomNode';
import { type NodeData, verticalColors, type NodeCategory } from '../types/flow';

// Lightweight local stubs for types and helpers until full Flow port is implemented
type Node<T = any> = { id: string; position: { x: number; y: number }; data?: T; selected?: boolean; width?: number; height?: number };
type Edge = { id?: string; source: string; target: string; data?: any; animated?: boolean };
type BaseItem = { vertical: string; label: string; subtype: string; sampleConfig?: any };
const unstable_batchedUpdates = (fn: Function) => fn();
const addEdge = (edge: any, current: any[] = []) => (current || []).concat(edge);
const toast = { success: (..._a: any[]) { /* noop */ }, error: (..._a: any[]) { /* noop */ } };
import { GRID_SIZE, roundToGrid, roundToGridOffset, GRID_OFFSET } from '../constants/grid';

const API_BASE: string = (import.meta as any).env?.VITE_API_BASE ?? '/api';

const seedNodes: any[] = [
  {
    id: 'policy-implementation',
    position: { x: 80, y: 120 },
    type: 'custom',
    data: {
      label: 'Policy Implementation (Delays)',
      vertical: 'Policymaking',
      subtype: 'Implementation',
      config: {
        dataSource: {
          type: 'api',
          endpoint: 'https://api.example.com/policy/status',
          notes: 'Tracks rollout milestones and blockers'
        }
      }
    }
  },
  {
    id: 'fundraising-screening',
    position: { x: 380, y: 120 },
    type: 'custom',
    data: {
      label: 'Fundraising Screening (Bottlenecks)',
      vertical: 'Fundraising',
      subtype: 'Screening',
      config: {
        dataSource: {
          type: 'db',
          endpoint: 'postgres://.../dealflow',
          notes: 'Lead qualification queue depth and SLA breaches'
        }
      }
    }
  },
  {
    id: 'sci-shipping',
    position: { x: 680, y: 120 },
    type: 'custom',
    data: {
      label: 'Supply Chain: Delivery/Shipping (Disruptions)',
      vertical: 'SCI',
      subtype: 'Delivery/Shipping',
      config: {
        dataSource: {
          type: 'api',
          endpoint: 'https://api.vesseltracking.example.com/positions',
          notes: 'Port congestion and ETA variance'
        }
      }
    }
  },
  {
    id: 'bi-market-volatility',
    position: { x: 980, y: 120 },
    type: 'custom',
    data: {
      label: 'BI: Market Volatility',
      vertical: 'BI',
      subtype: 'Reporting',
      config: {
        dataSource: {
          type: 'api',
          endpoint: 'https://api.stockfeed.example.com/ticks',
          notes: 'Real-time price variance and VIX proxy'
        }
      }
    }
  }
];

const seedEdges: any[] = [
  { id: 'e-policy-fundraising', source: 'policy-implementation', target: 'fundraising-screening', animated: true, data: { kind: 'data' }, style: { stroke: '#9a9a9a', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const } },
  { id: 'e-fundraising-sci', source: 'fundraising-screening', target: 'sci-shipping', animated: true, data: { kind: 'data' }, style: { stroke: '#9a9a9a', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const } },
  { id: 'e-sci-bi', source: 'sci-shipping', target: 'bi-market-volatility', animated: true, data: { kind: 'data' }, style: { stroke: '#9a9a9a', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const } }
];

// React Flow-specific canvas removed for Inferno port. Use simple GraphView.
function WorkflowCanvas({ nodes, edges }: { nodes: any[]; edges: any[] }) {
  return (
    <GraphView nodes={nodes} edges={edges} />
  );
}

export default function WorkflowBuilder() {
  // Temporary simple state replacements for React Flow hooks
  const [nodes, setNodes] = useState<any[]>([]);
  const onNodesChange = useCallback((cbOrNodes: any) => {
    if (typeof cbOrNodes === 'function') setNodes((curr) => (cbOrNodes(curr) ?? curr));
    else setNodes(cbOrNodes || []);
  }, []);
  const [edges, setEdges] = useState<any[]>(seedEdges);
  const onEdgesChange = useCallback((cbOrEdges: any) => {
    if (typeof cbOrEdges === 'function') setEdges((curr) => (cbOrEdges(curr) ?? curr));
    else setEdges(cbOrEdges || []);
  }, []);
  const [saving, setSaving] = useState(false);
  const [workflowId, setWorkflowId] = useState('default');
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(() => {
    const v = localStorage.getItem('wfSidebarOpen');
    return v === null ? true : v === 'true';
  });
  const [libraryCategory, setLibraryCategory] = useState<NodeCategory>('Data');
  const initialLoadedRef = useRef(false);
  const nodeTypes = useMemo(() => ({ custom: CustomNode }), []);

  const apiUrl = `${API_BASE}/flow/${workflowId}`;

  const attachCallbacks = useCallback((nds: any[]) => {
    return nds.map((n) => ({
      ...n,
      type: 'custom',
      data: {
        ...n.data,
        onChange: (partial: Partial<NodeData>) => {
          setNodes((curr: any[]) => curr.map((m) => (m.id === n.id ? { ...m, data: { ...(m.data as any), ...partial } } : m)));
        }
      }
    }));
  }, [setNodes]);

  // Helpers for port kinds and cycle checks
  type PortKind = 'data' | 'meta';
  const parseKind = useCallback((handleId?: string | null): PortKind =>
    (handleId && handleId.toLowerCase().includes('meta')) ? 'meta' : 'data', []);
  const edgeStyleFor = useCallback((k: PortKind) =>
    k === 'meta'
      ? { stroke: '#e05555', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
      : { stroke: '#9a9a9a', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }, []);
  const isFeedbackNode = useCallback((n?: any) =>
    !!n && ((n.data?.vertical === 'Connectivity' && /feedback/i.test(String(n.data?.subtype))) ||
            /feedback/i.test(String(n.data?.label))), []);
  const wouldCreateCycle = useCallback((allEdges: any[], trySource: string, tryTarget: string) => {
    const adj = new Map<string, string[]>();
    for (const e of allEdges) {
      const list = adj.get(e.source) || [];
      list.push(e.target);
      adj.set(e.source, list);
    }
    const seen = new Set<string>();
    const stack = [tryTarget];
    while (stack.length) {
      const n = stack.pop()!;
      if (n === trySource) return true;
      if (seen.has(n)) continue;
      seen.add(n);
      for (const nxt of (adj.get(n) || [])) stack.push(nxt);
    }
    return false;
  }, []);

  // initial load with seed fallback
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(apiUrl);
        if (res.ok) {
          const data = await res.json();
      if (Array.isArray(data.nodes) && data.nodes.length) {
            // migrate legacy data (ensure Connectivity is logic-only)
            const migratedNodes: any[] = (data.nodes as any[]).map((n) => {
              const cat = ((n.data as any)?.category ?? (['Connectivity','Transformation','Output'].includes(String((n.data as any)?.vertical)) ? (n.data as any).vertical : 'Data')) as NodeCategory;
              const cfg = { ...((n.data as any)?.config || {}) } as any;
              if (cat === 'Connectivity') {
                delete cfg.dataSource; delete cfg.transforms; delete cfg.outputs;
                cfg.logic = cfg.logic || {};
              }
              return {
                ...n,
                data: { ...(n.data || {}), category: cat, config: cfg }
              } as Node<NodeData>;
            });
            const migratedEdges: any[] = (Array.isArray(data.edges) ? data.edges : []).map((e: any) => ({
              ...e,
              data: { ...(e.data || {}), kind: (e.data && e.data.kind) || 'data' },
              style: e.style || edgeStyleFor((e.data && e.data.kind) || 'data')
            }));
            // snap positions and sizes to grid on load
            const snapped = migratedNodes.map((n) => ({
              ...n,
              position: { x: roundToGridOffset(n.position.x), y: roundToGridOffset(n.position.y) },
              width: n.width ? roundToGrid(n.width) : n.width,
              height: n.height ? roundToGrid(n.height) : n.height,
            }));
            setNodes(attachCallbacks(snapped));
            setEdges(migratedEdges || []);
            initialLoadedRef.current = true;
            return;
          }
        }
      } catch {}
      // seed and persist once if empty
      const seededNodes = attachCallbacks(seedNodes.map((n) => ({
        ...n,
        position: { x: roundToGridOffset(n.position.x), y: roundToGridOffset(n.position.y) }
      })));
  setNodes(seededNodes);
  setEdges(seedEdges || []);
      try {
        await fetch(apiUrl, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nodes: seededNodes.map((n) => ({ ...n, data: { ...(n.data as any), onChange: undefined } })), edges: seedEdges })
        });
      } catch {}
      initialLoadedRef.current = true;
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workflowId, attachCallbacks, setNodes, setEdges]);

  const sanitizeNodes = useCallback((nds: any[]) => nds.map((n) => {
    const d = { ...(n.data || {}) } as any;
    if (d.onChange) delete d.onChange;
    const cat = (d.category ?? (['Connectivity','Transformation','Output'].includes(String(d.vertical)) ? d.vertical : 'Data'));
    if (cat === 'Connectivity') {
      const cfg = { ...(d.config || {}) };
      delete cfg.dataSource; delete cfg.transforms; delete cfg.outputs;
      d.config = { ...cfg, logic: cfg.logic || (Object.keys(cfg).length ? cfg : {}) };
    }
    return { ...n, data: d };
  }), []);

  const saveFlow = useCallback(async (opts?: { silent?: boolean }) => {
    setSaving(true);
    try {
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nodes: sanitizeNodes(nodes), edges })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Save failed');
      }
      if (!opts?.silent) { console.log('Saved'); }
    } catch (e) {
      console.error(`Save failed: ${String(e)}`);
    } finally {
      setSaving(false);
    }
  }, [nodes, edges, apiUrl, sanitizeNodes]);

  const loadFlow = useCallback(async () => {
    try {
      const res = await fetch(apiUrl);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Load failed');
      }
      const data = await res.json();
      const migratedNodes: Node<NodeData>[] = (data.nodes || []).map((n: Node<NodeData>) => {
        const cat = ((n.data as any)?.category ?? (['Connectivity','Transformation','Output'].includes(String((n.data as any)?.vertical)) ? (n.data as any).vertical : 'Data')) as NodeCategory;
        const cfg = { ...((n.data as any)?.config || {}) } as any;
        if (cat === 'Connectivity') {
          delete cfg.dataSource; delete cfg.transforms; delete cfg.outputs;
          cfg.logic = cfg.logic || {};
        }
        return { ...n, data: { ...(n.data || {}), category: cat, config: cfg } } as Node<NodeData>;
      });
      const migratedEdges: Edge[] = (data.edges || []).map((e: any) => ({
        ...e,
        data: { ...(e.data || {}), kind: (e.data && e.data.kind) || 'data' },
        style: e.style || edgeStyleFor((e.data && e.data.kind) || 'data')
      }));
      const snapped = migratedNodes.map((n) => ({
        ...n,
        position: { x: roundToGridOffset(n.position.x), y: roundToGridOffset(n.position.y) },
        width: n.width ? roundToGrid(n.width) : n.width,
        height: n.height ? roundToGrid(n.height) : n.height,
      }));
      setNodes(attachCallbacks(snapped));
      setEdges(migratedEdges || []);
    } catch (e) {
      console.error(`Load failed: ${String(e)}`);
    }
  }, [apiUrl, attachCallbacks, setNodes, setEdges]);

  const onConnect = useCallback((connection: any) => {
    const { source, target, sourceHandle, targetHandle } = connection;
    if (!source || !target) return;
    const kindS = parseKind(sourceHandle);
    const kindT = parseKind(targetHandle);
    if (kindS !== kindT) {
      console.error('Port kinds must match (data↔data, meta↔meta).');
      return;
    }
    const allowCycle =
      isFeedbackNode(nodes.find(n => n.id === source)) ||
      isFeedbackNode(nodes.find(n => n.id === target));
    if (!allowCycle && wouldCreateCycle(edges, source, target)) {
      toast.error('Connection would create a cycle. Use a Feedback Connector for loops.', { icon: false });
      return;
    }
    const kind: PortKind = kindS;
    // simple addEdge behaviour
    setEdges((eds) => {
      const next = (eds || []).concat([{ ...connection, animated: true, data: { ...(connection as any).data, kind }, style: edgeStyleFor(kind) }]);
      return next;
    });
  }, [edges, nodes, setEdges]);

  // autosave a short time after nodes/edges change, only after initial load (silent)
  useEffect(() => {
    if (!initialLoadedRef.current) return;
    const t = setTimeout(() => { void saveFlow({ silent: true }); }, 1500);
    return () => clearTimeout(t);
  }, [nodes, edges, saveFlow]);

  // persist sidebar state
  useEffect(() => {
    localStorage.setItem('wfSidebarOpen', String(sidebarOpen));
  }, [sidebarOpen]);

  const defaultEdgeOptions = useMemo(() => ({
    type: 'bezier' as const,
    animated: true,
    style: { stroke: '#9a9a9a', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const },
    markerEnd: { type: 'arrowclosed' as const, color: '#9a9a9a' }
  }), []);

  // Non-Data catalogs for NodeLibrary
  const connectivityItems: BaseItem[] = useMemo(() => [
    { vertical: 'Connectivity' as any, label: 'Causal Router', subtype: 'Causal Router', sampleConfig: { type: 'router', params: { strategy: 'causal', threshold: 0.6 } } },
    { vertical: 'Connectivity' as any, label: 'Correlation Router', subtype: 'Correlation Router', sampleConfig: { type: 'router', params: { strategy: 'correlation', metric: 'pearson', min: 0.5 } } },
    { vertical: 'Connectivity' as any, label: 'Dependency Router', subtype: 'Dependency Router', sampleConfig: { type: 'join', params: { algorithm: 'bfs', maxHops: 5 } } },
    { vertical: 'Connectivity' as any, label: 'Feedback Connector', subtype: 'Feedback Connector', sampleConfig: { type: 'feedback', params: { iterations: 10 } } },
  ], []);
  const transformationItems: BaseItem[] = useMemo(() => [
    { vertical: 'Transformation' as any, label: 'Aggregation Transformer', subtype: 'Aggregation Transformer', sampleConfig: { fn: 'mean', groupBy: ['region'] } },
    { vertical: 'Transformation' as any, label: 'Normalization Transformer', subtype: 'Normalization Transformer', sampleConfig: { method: 'zscore' } },
    { vertical: 'Transformation' as any, label: 'Enrichment Transformer', subtype: 'Enrichment Transformer', sampleConfig: { source: 'sentiment-api', merge: 'left' } },
    { vertical: 'Transformation' as any, label: 'Filtering Transformer', subtype: 'Filtering Transformer', sampleConfig: { where: 'risk > 0.15', op: 'AND' } },
  ], []);
  const outputItems: BaseItem[] = useMemo(() => [
    { vertical: 'Output' as any, label: 'Dashboard Generator', subtype: 'Dashboard Generator', sampleConfig: { frequency: '10m', layout: 'grid' } },
    { vertical: 'Output' as any, label: 'Visualization Exporter', subtype: 'Visualization Exporter', sampleConfig: { frequency: '1h', format: 'png' } },
    { vertical: 'Output' as any, label: 'Report Compiler', subtype: 'Report Compiler', sampleConfig: { frequency: 'weekly', format: 'pdf' } },
    { vertical: 'Output' as any, label: 'Alert/Export', subtype: 'Alert/Export', sampleConfig: { frequency: 'on-change', format: 'csv' } },
  ], []);

  const addFromLibrary = useCallback((item: BaseItem & { category?: NodeCategory }) => {
    const idBase = `${item.vertical.toLowerCase()}-${item.subtype.toLowerCase().replace(/[^a-z0-9]+/gi, '-')}`;
    const id = `${idBase}-${Date.now()}`;
    const newNode: Node<NodeData> = {
      id,
  position: { x: roundToGridOffset(120 + Math.round(Math.random() * 80)), y: roundToGridOffset(120 + Math.round(Math.random() * 80)) },
      type: 'custom',
      data: (() => {
        const isConn = (item.category ?? item.vertical) === 'Connectivity';
        const base: any = {
          label: isConn ? String(item.subtype) : `${item.vertical}: ${item.subtype}`,
          vertical: item.vertical as NodeData['vertical'],
          subtype: item.subtype,
          category: isConn ? 'Connectivity' : (item.category ?? 'Data'),
          config: isConn ? { logic: (item as any).sampleConfig ?? {} } : ((item as any).sampleConfig ?? {})
        };
        if (isConn) {
          // Explicit default ports for connectivity nodes so handles render reliably
          base.ports = [
            { id: 'data-in-a', direction: 'in', kind: 'data' },
            { id: 'data-in-b', direction: 'in', kind: 'data' },
            { id: 'data-out', direction: 'out', kind: 'data' },
            { id: 'meta-in', direction: 'in', kind: 'meta' },
            { id: 'meta-out', direction: 'out', kind: 'meta' },
          ];
        }
        return base;
      })()
    };
    unstable_batchedUpdates(() => {
      setNodes((curr) => curr.concat(attachCallbacks([newNode])));
    });
  }, [setNodes, attachCallbacks]);

  const duplicateSelected = useCallback(() => {
    const selected = nodes.filter((n) => n.selected);
    if (!selected.length) return;
    const idMap = new Map<string, string>();
    const clones: Node<NodeData>[] = selected.map((n) => {
      const newId = `${n.id}-copy-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      idMap.set(n.id, newId);
      return {
        ...n,
        id: newId,
  position: { x: roundToGridOffset(n.position.x + 30), y: roundToGridOffset(n.position.y + 30) },
        selected: false,
      } as Node<NodeData>;
    });
    const newEdges: Edge[] = edges
      .filter((e) => selected.some((n) => n.id === e.source) && selected.some((n) => n.id === e.target))
      .map((e) => ({
        ...e,
        id: `${e.id}-copy-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        source: idMap.get(e.source) || e.source,
        target: idMap.get(e.target) || e.target,
        selected: false,
      }));
    unstable_batchedUpdates(() => {
      setNodes((curr) => curr.concat(attachCallbacks(clones)));
      setEdges((curr) => curr.concat(newEdges));
    });
  }, [nodes, edges, attachCallbacks, setNodes, setEdges]);

  const deleteSelected = useCallback(() => {
    const selectedIds = new Set(nodes.filter((n) => n.selected).map((n) => n.id));
    if (!selectedIds.size) return;
    unstable_batchedUpdates(() => {
      setNodes((curr) => curr.filter((n) => !selectedIds.has(n.id)));
      setEdges((curr) => curr.filter((e) => !selectedIds.has(e.source) && !selectedIds.has(e.target)));
    });
  }, [nodes, setNodes, setEdges]);

  // keyboard shortcuts
  useEffect(() => {
    const isEditing = (el: Element | null) => {
      if (!el || !(el instanceof HTMLElement)) return false;
      const tag = el.tagName.toLowerCase();
      return el.isContentEditable || tag === 'input' || tag === 'textarea' || tag === 'select';
    };
    const onKey = (e: KeyboardEvent) => {
      if (isEditing(document.activeElement)) return; // ignore shortcuts while typing
      const isDup = (e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'd');
      const isDel = e.key === 'Delete' || e.key === 'Backspace';
      if (isDup) {
        e.preventDefault();
        duplicateSelected();
      } else if (isDel) {
        e.preventDefault();
        deleteSelected();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [duplicateSelected, deleteSelected]);

  return (
    <div style={{ height: '100%', 'min-height': 500, position: 'relative', background: '#000' }}>
      <div style={{ position: 'relative', height: '100%' }}>
      <div className="workflow-controls" style={{ position: 'absolute', zIndex: 5, right: 12, top: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
        <label style={{ fontSize: 12 }}>
          Workflow ID:
          <input
            value={workflowId}
            onChange={(e) => setWorkflowId(e.target.value || 'default')}
            style={{ marginLeft: 4, width: 100 }}
          />
        </label>
  <button onClick={() => void saveFlow()} disabled={saving} title="Save to disk">{saving ? 'Saving…' : 'Save'}</button>
        <button onClick={() => void loadFlow()} title="Load from disk">Load</button>
      </div>
      {nodes.some((n) => n.selected) && (
        <div style={{ position: 'absolute', zIndex: 5, left: 12, top: 12, display: 'flex', gap: 8 }}>
          <button className="icon-btn" title="Duplicate (Ctrl+D)" onClick={duplicateSelected}>Duplicate</button>
          <button className="icon-btn" title="Delete (Del/Backspace)" onClick={deleteSelected}>Delete</button>
        </div>
      )}
      <GraphView
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        defaultEdgeOptions={defaultEdgeOptions}
        sidebarOpen={sidebarOpen}
      />
      </div>
    </div>
  );
}
