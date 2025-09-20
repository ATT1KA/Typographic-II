import { ReactFlow, ReactFlowProvider, useReactFlow } from '@xyflow/react';
import { useCallback, useEffect, useMemo, useRef, useState, lazy, Suspense } from 'react';
import { unstable_batchedUpdates } from 'react-dom';
import {
  Background,
  Controls,
  addEdge,
  Connection,
  Edge,
  MiniMap,
  useEdgesState,
  useNodesState,
  type Node,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import CustomNode from '../components/CustomNode';
import { type LibraryItem as BaseItem } from '../components/NodeLibrary';
const NodeLibrary = lazy(() => import('../components/NodeLibrary'));
import { type NodeData, verticalColors, type NodeCategory } from '../types/flow';
import { GRID_SIZE, roundToGrid, roundToGridOffset, GRID_OFFSET } from '../constants/grid';

const API_BASE: string = (import.meta as any).env?.VITE_API_BASE ?? '/api';

const seedNodes: Node<NodeData>[] = [
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

const seedEdges: Edge[] = [
  { id: 'e-policy-fundraising', source: 'policy-implementation', target: 'fundraising-screening', animated: true, data: { kind: 'data' }, style: { stroke: '#9a9a9a', strokeWidth: 2 } },
  { id: 'e-fundraising-sci', source: 'fundraising-screening', target: 'sci-shipping', animated: true, data: { kind: 'data' }, style: { stroke: '#9a9a9a', strokeWidth: 2 } },
  { id: 'e-sci-bi', source: 'sci-shipping', target: 'bi-market-volatility', animated: true, data: { kind: 'data' }, style: { stroke: '#9a9a9a', strokeWidth: 2 } }
];

function WorkflowCanvas({
  nodes,
  edges,
  nodeTypes,
  onNodesChange,
  onEdgesChange,
  onConnect,
  defaultEdgeOptions,
  sidebarOpen,
}: {
  nodes: Node<NodeData>[];
  edges: Edge[];
  nodeTypes: any;
  onNodesChange: any;
  onEdgesChange: any;
  onConnect: any;
  defaultEdgeOptions: any;
  sidebarOpen: boolean;
}) {
  const rf = useReactFlow();
  const wrapperRef = useRef<HTMLElement | null>(null);
  const minimapRef = useRef<HTMLElement | null>(null);

  // Simple throttle function
  const throttle = (func: Function, limit: number) => {
    let inThrottle: boolean;
    return function(this: any, ...args: any[]) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  };

  // fit view on sidebar toggle
  useEffect(() => {
    const t = setTimeout(() => {
      try { rf.fitView({ padding: 0.2 }); } catch {}
    }, 50);
    return () => clearTimeout(t);
  }, [sidebarOpen, rf]);

  // position the controls wrapper to the left of the minimap with an 8px gap
  useEffect(() => {
  const gap = 1;
    wrapperRef.current = document.querySelector('.reactflow-controls-left-of-minimap') as HTMLElement | null;
    minimapRef.current = document.querySelector('.react-flow__minimap') as HTMLElement | null;
    function position() {
      const wrapper = wrapperRef.current;
      const minimap = minimapRef.current;
      if (!wrapper || !minimap) return;
      const mmRect = minimap.getBoundingClientRect();
      // position wrapper left of minimap, vertically centered
      const left = Math.max(8, mmRect.left - gap - wrapper.offsetWidth);
      const desiredTop = mmRect.top + (mmRect.height / 2) - (wrapper.offsetHeight / 2);
      const minTop = mmRect.top;
      const maxTop = mmRect.bottom - wrapper.offsetHeight;
      const clampedTop = Math.max(minTop, Math.min(desiredTop, maxTop));
      wrapper.style.left = `${left}px`;
      wrapper.style.top = `${clampedTop}px`;
    }
    const throttledPosition = throttle(position, 200);
    throttledPosition();
    const ro = new ResizeObserver(throttledPosition);
    try { if (minimapRef.current) ro.observe(minimapRef.current); } catch {}
    window.addEventListener('resize', throttledPosition);
    // also reposition on scroll so the wrapper stays vertically centered relative to viewport minimap
    window.addEventListener('scroll', throttledPosition, { passive: true });
    return () => {
      window.removeEventListener('resize', throttledPosition);
      window.removeEventListener('scroll', throttledPosition);
      try { ro.disconnect(); } catch {}
    };
  }, [sidebarOpen]);

  const onNodeDragStop = useCallback((_e: any, n: Node<NodeData>) => {
    const snapped = { x: roundToGridOffset(n.position.x, GRID_SIZE, GRID_OFFSET), y: roundToGridOffset(n.position.y, GRID_SIZE, GRID_OFFSET) };
    if (snapped.x !== n.position.x || snapped.y !== n.position.y) {
      rf.setNodes((nds) => nds.map((m) => (m.id === n.id ? { ...m, position: snapped } : m)));
    }
  }, [rf]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      defaultEdgeOptions={defaultEdgeOptions}
      nodeOrigin={[0, 0]}
      onNodeDragStop={onNodeDragStop}
      connectionLineStyle={{ stroke: 'var(--accent)', strokeWidth: 2 }}
      fitView={false}
    >
      <MiniMap
        nodeColor={useCallback((n: Node) => {
          const v = (n as any)?.data?.vertical as keyof typeof verticalColors | undefined;
          return (v && verticalColors[v]) || '#5a5a5a';
        }, [])}
        nodeStrokeColor="#0a0a0a"
        maskColor="rgba(0,0,0,0.55)"
        pannable
        zoomable
      />
      <div className="reactflow-controls-left-of-minimap">
        <Controls />
      </div>
  <Background gap={GRID_SIZE} size={2} color="#303030" />
    </ReactFlow>
  );
}

export default function WorkflowBuilder() {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<NodeData>>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState(seedEdges);
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

  const attachCallbacks = useCallback((nds: Node<NodeData>[]) => {
    return nds.map((n) => ({
      ...n,
      type: 'custom',
      data: {
        ...n.data,
        onChange: (partial: Partial<NodeData>) => {
          setNodes((curr) => curr.map((m) => (m.id === n.id ? { ...m, data: { ...(m.data as NodeData), ...partial } } : m)));
        }
      }
    }));
  }, [setNodes]);

  // Helpers for port kinds and cycle checks
  type PortKind = 'data' | 'meta';
  const parseKind = useCallback((handleId?: string | null): PortKind =>
    (handleId && handleId.toLowerCase().includes('meta')) ? 'meta' : 'data', []);
  const edgeStyleFor = useCallback((k: PortKind) =>
    k === 'meta' ? { stroke: '#e05555', strokeWidth: 2 } : { stroke: '#9a9a9a', strokeWidth: 2 }, []);
  const isFeedbackNode = useCallback((n?: Node<NodeData>) =>
    !!n && ((n.data?.vertical === 'Connectivity' && /feedback/i.test(String(n.data?.subtype))) ||
            /feedback/i.test(String(n.data?.label))), []);
  const wouldCreateCycle = useCallback((allEdges: Edge[], trySource: string, tryTarget: string) => {
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
            const migratedNodes: Node<NodeData>[] = (data.nodes as Node<NodeData>[]).map((n) => {
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
            const migratedEdges: Edge[] = (Array.isArray(data.edges) ? data.edges : []).map((e: any) => ({
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
            setEdges(migratedEdges);
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
      setEdges(seedEdges);
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

  const sanitizeNodes = useCallback((nds: Node<NodeData>[]) => nds.map((n) => {
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
      if (!opts?.silent) { toast.success('Saved', { icon: false }); }
    } catch (e) {
      toast.error(`Save failed: ${String(e)}`);
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
      setEdges(migratedEdges);
    } catch (e) {
      toast.error(`Load failed: ${String(e)}`);
    }
  }, [apiUrl, attachCallbacks, setNodes, setEdges]);

  const onConnect = useCallback((connection: Connection) => {
    const { source, target, sourceHandle, targetHandle } = connection;
    if (!source || !target) return;
    const kindS = parseKind(sourceHandle);
    const kindT = parseKind(targetHandle);
    if (kindS !== kindT) {
      toast.error('Port kinds must match (data↔data, meta↔meta).', { icon: false });
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
    setEdges((eds) => addEdge({
      ...connection,
      animated: true,
      data: { ...(connection as any).data, kind },
      style: edgeStyleFor(kind),
      markerEnd: { type: 'arrowclosed', color: kind === 'meta' ? '#e05555' : '#9a9a9a' }
    }, eds));
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
    type: 'smoothstep' as const,
    animated: true,
    style: { stroke: '#9a9a9a', strokeWidth: 2 },
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
      data: {
        label: item.category === 'Connectivity' ? String(item.subtype) : `${item.vertical}: ${item.subtype}`,
        vertical: item.vertical as NodeData['vertical'],
        subtype: item.subtype,
            category: item.category ?? 'Data',
            config: (item.category === 'Connectivity')
              ? { logic: (item as any).sampleConfig ?? {} }
              : ((item as any).sampleConfig ?? {})
      }
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
  <div style={{ height: '100%', minHeight: 500, position: 'relative', background: '#000' }}>
    <ToastContainer
      position="bottom-right"
      autoClose={1600}
      hideProgressBar
      closeButton={false}
      toastClassName="toast-acrylic toast-compact"
      className="toast-container-flow"
    />
      <Suspense fallback={<div>Loading...</div>}>
      <NodeLibrary
        open={sidebarOpen}
        onToggle={() => setSidebarOpen((v) => !v)}
        onAdd={addFromLibrary}
        category={libraryCategory}
        onCategoryChange={setLibraryCategory}
        connectivityItems={connectivityItems}
        transformationItems={transformationItems}
        outputItems={outputItems}
      />
      </Suspense>
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
      <ReactFlowProvider>
        <WorkflowCanvas
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          defaultEdgeOptions={defaultEdgeOptions}
          sidebarOpen={sidebarOpen}
        />
      </ReactFlowProvider>
      </div>
    </div>
  );
}
