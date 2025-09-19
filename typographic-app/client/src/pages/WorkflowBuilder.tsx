import { ReactFlow } from '@xyflow/react';
import { useCallback, useEffect, useMemo, useState } from 'react';
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

export default function WorkflowBuilder() {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<NodeData>>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState(seedEdges);
  const [saving, setSaving] = useState(false);
  const [workflowId, setWorkflowId] = useState('default');
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

  // initial load
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(apiUrl);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.nodes) && data.nodes.length) {
            setNodes(attachCallbacks(data.nodes));
            setEdges(Array.isArray(data.edges) ? data.edges : []);
            return;
          }
        }
      } catch {}
      setNodes(attachCallbacks(seedNodes));
      setEdges(seedEdges);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workflowId, attachCallbacks, setNodes, setEdges]);

  const sanitizeNodes = useCallback((nds: Node<NodeData>[]) => nds.map((n) => {
    const d = { ...(n.data || {}) } as any;
    if (d.onChange) delete d.onChange;
    return { ...n, data: d };
  }), []);

  const saveFlow = useCallback(async () => {
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
      toast.success('Flow saved!');
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
      toast.success('Flow loaded!');
    } catch (e) {
      toast.error(`Load failed: ${String(e)}`);
    }
  }, [apiUrl, attachCallbacks, setNodes, setEdges]);

  const onConnect = useCallback((connection: Connection) => {
    setEdges((eds) => addEdge({ ...connection, animated: true }, eds));
  }, [setEdges]);

  // autosave a short time after nodes/edges change
  useEffect(() => {
    const t = setTimeout(() => { void saveFlow(); }, 800);
    return () => clearTimeout(t);
  }, [nodes, edges, saveFlow]);

  return (
    <div style={{ height: '100%', minHeight: 500, position: 'relative' }} className="card">
      <ToastContainer position="top-right" autoClose={3000} />
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
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
      >
        <MiniMap nodeColor={(n) => verticalColors[(n.data as NodeData)?.vertical as NodeData['vertical']] || '#999'} />
        <Controls />
        <Background />
      </ReactFlow>
    </div>
  );
}
