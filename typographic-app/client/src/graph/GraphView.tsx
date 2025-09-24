import { useCallback } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  BackgroundVariant,
  Panel,
  ReactFlowProvider,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { NodeData, Vertical, verticalColors, NodeCategory } from '../types/flow';

// Custom Node Component
function CustomNode({ data }: { data: NodeData }) {
  const bgColor = verticalColors[data.vertical] || '#e2e8f0';

  return (
    <div
      style={{
        background: bgColor,
        color: 'white',
        padding: '10px 15px',
        borderRadius: '8px',
        border: '2px solid #4a5568',
        minWidth: '120px',
        fontSize: '12px',
        textAlign: 'center',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      }}
    >
      <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
        {data.label}
      </div>
      <div style={{ fontSize: '10px', opacity: 0.8 }}>
        {data.vertical}
      </div>
      {data.subtype && (
        <div style={{ fontSize: '9px', opacity: 0.7, marginTop: '2px' }}>
          {data.subtype}
        </div>
      )}
    </div>
  );
}

const nodeTypes = {
  custom: CustomNode,
};

// Sample initial nodes and edges
const initialNodes: Node[] = [
  {
    id: '1',
    type: 'custom',
    position: { x: 100, y: 100 },
    data: {
      label: 'Data Source',
      vertical: 'BI' as Vertical,
      subtype: 'API Endpoint',
      category: 'Data' as NodeCategory,
    },
  },
  {
    id: '2',
    type: 'custom',
    position: { x: 400, y: 100 },
    data: {
      label: 'Transform',
      vertical: 'Transformation' as Vertical,
      subtype: 'Aggregation',
      category: 'Transformation' as NodeCategory,
    },
  },
  {
    id: '3',
    type: 'custom',
    position: { x: 700, y: 100 },
    data: {
      label: 'Output',
      vertical: 'Output' as Vertical,
      subtype: 'Dashboard',
      category: 'Output' as NodeCategory,
    },
  },
];

const initialEdges: Edge[] = [
  {
    id: 'e1-2',
    source: '1',
    target: '2',
    type: 'smoothstep',
    style: { stroke: '#64748b', strokeWidth: 2 },
  },
  {
    id: 'e2-3',
    source: '2',
    target: '3',
    type: 'smoothstep',
    style: { stroke: '#64748b', strokeWidth: 2 },
  },
];

function GraphViewContent() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params: Edge | Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  const addNode = useCallback((type: NodeCategory, vertical: Vertical) => {
    const newNode: Node = {
      id: `${nodes.length + 1}`,
      type: 'custom',
      position: {
        x: Math.random() * 400 + 100,
        y: Math.random() * 300 + 100
      },
      data: {
        label: `${type} Node`,
        vertical,
        subtype: 'New Node',
        category: type,
      },
    };
    setNodes((nds) => [...nds, newNode]);
  }, [nodes.length, setNodes]);

  return (
    <div style={{ height: '100%', width: '100%' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="bottom-left"
      >
        <Panel position="top-left">
          <div style={{
            background: 'var(--bg-secondary)',
            padding: '10px',
            borderRadius: '8px',
            display: 'flex',
            gap: '8px',
            flexWrap: 'wrap'
          }}>
            <button
              onClick={() => addNode('Data', 'BI')}
              style={{
                padding: '6px 12px',
                background: verticalColors.BI,
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '11px'
              }}
            >
              Add Data Node
            </button>
            <button
              onClick={() => addNode('Transformation', 'Transformation')}
              style={{
                padding: '6px 12px',
                background: verticalColors.Transformation,
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '11px'
              }}
            >
              Add Transform Node
            </button>
            <button
              onClick={() => addNode('Output', 'Output')}
              style={{
                padding: '6px 12px',
                background: verticalColors.Output,
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '11px'
              }}
            >
              Add Output Node
            </button>
          </div>
        </Panel>

        <Controls style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          borderRadius: '8px'
        }} />
        <MiniMap
          style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)'
          }}
          nodeColor={(node) => verticalColors[(node.data as NodeData).vertical] || '#e2e8f0'}
        />
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          style={{ background: 'var(--bg)' }}
        />
      </ReactFlow>
    </div>
  );
}

export default function GraphView() {
  return (
    <div style={{
      height: '100%',
      width: '100%',
      background: 'var(--bg)',
      color: 'var(--text)'
    }}>
      <ReactFlowProvider>
        <GraphViewContent />
      </ReactFlowProvider>
    </div>
  );
}
