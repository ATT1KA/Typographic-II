import { ReactFlow, ReactFlowProvider, useReactFlow } from '@xyflow/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import NodeLibrary, { type LibraryItem } from '../components/NodeLibrary';
import { type NodeData, verticalColors } from '../types/flow';

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
  { id: 'e-policy-fundraising', source: 'policy-implementation', target: 'fundraising-screening', animated: true },
  { id: 'e-fundraising-sci', source: 'fundraising-screening', target: 'sci-shipping', animated: true },
  { id: 'e-sci-bi', source: 'sci-shipping', target: 'bi-market-volatility', animated: true }
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
    const wrapper = document.querySelector('.reactflow-controls-left-of-minimap') as HTMLElement | null;
    const minimap = document.querySelector('.react-flow__minimap') as HTMLElement | null;
    function position() {
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
    position();
    const ro = new ResizeObserver(position);
    try { if (minimap) ro.observe(minimap); } catch {}
    window.addEventListener('resize', position);
    // also reposition on scroll so the wrapper stays vertically centered relative to viewport minimap
    window.addEventListener('scroll', position, { passive: true });
    return () => {
      window.removeEventListener('resize', position);
      window.removeEventListener('scroll', position);
      try { ro.disconnect(); } catch {}
    };
  }, [sidebarOpen]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      defaultEdgeOptions={defaultEdgeOptions}
      connectionLineStyle={{ stroke: 'var(--accent)', strokeWidth: 2 }}
      fitView
    >
      <MiniMap
        nodeColor={(n) => {
          const v = (n as any)?.data?.vertical as keyof typeof verticalColors | undefined;
          return (v && verticalColors[v]) || '#5a5a5a';
        }}
        nodeStrokeColor="#0a0a0a"
        maskColor="rgba(0,0,0,0.55)"
        pannable
        zoomable
      />
      <div className="reactflow-controls-left-of-minimap">
        <Controls />
      </div>
  <Background gap={24} size={1} color="#202020" />
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

  // initial load with seed fallback
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(apiUrl);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.nodes) && data.nodes.length) {
            setNodes(attachCallbacks(data.nodes));
            setEdges(Array.isArray(data.edges) ? data.edges : []);
            initialLoadedRef.current = true;
            return;
          }
        }
      } catch {}
      // seed and persist once if empty
      const seededNodes = attachCallbacks(seedNodes);
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
      if (!opts?.silent) {
        toast.success('Saved', { icon: false });
      }
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
  setNodes(attachCallbacks(data.nodes || []));
  setEdges(data.edges || []);
    } catch (e) {
      toast.error(`Load failed: ${String(e)}`);
    }
  }, [apiUrl, attachCallbacks, setNodes, setEdges]);

  const onConnect = useCallback((connection: Connection) => {
    setEdges((eds) => addEdge({ ...connection, animated: true }, eds));
  }, [setEdges]);

  // autosave a short time after nodes/edges change, only after initial load (silent)
  useEffect(() => {
    if (!initialLoadedRef.current) return;
    const t = setTimeout(() => { void saveFlow({ silent: true }); }, 800);
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

  const addFromLibrary = useCallback((item: LibraryItem) => {
    const idBase = `${item.vertical.toLowerCase()}-${item.subtype.toLowerCase().replace(/[^a-z0-9]+/gi, '-')}`;
    const id = `${idBase}-${Date.now()}`;
    const newNode: Node<NodeData> = {
      id,
      position: { x: 120 + Math.round(Math.random() * 80), y: 120 + Math.round(Math.random() * 80) },
      type: 'custom',
      data: {
        label: `${item.vertical}: ${item.subtype}`,
        vertical: item.vertical as NodeData['vertical'],
        subtype: item.subtype,
        config: {}
      }
    };
    setNodes((curr) => curr.concat(attachCallbacks([newNode])));
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
        position: { x: n.position.x + 30, y: n.position.y + 30 },
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
    setNodes((curr) => curr.concat(attachCallbacks(clones)));
    setEdges((curr) => curr.concat(newEdges));
  }, [nodes, edges, attachCallbacks, setNodes, setEdges]);

  const deleteSelected = useCallback(() => {
    const selectedIds = new Set(nodes.filter((n) => n.selected).map((n) => n.id));
    if (!selectedIds.size) return;
    setNodes((curr) => curr.filter((n) => !selectedIds.has(n.id)));
    setEdges((curr) => curr.filter((e) => !selectedIds.has(e.source) && !selectedIds.has(e.target)));
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
      <NodeLibrary open={sidebarOpen} onToggle={() => setSidebarOpen((v) => !v)} onAdd={addFromLibrary} />
      <div style={{ position: 'relative', height: '100%' }}>
      <div style={{ position: 'absolute', zIndex: 5, right: 12, top: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
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
