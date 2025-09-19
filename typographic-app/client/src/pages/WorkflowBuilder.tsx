import { ReactFlow } from '@xyflow/react';
import { useCallback } from 'react';
import {
  Background,
  Controls,
  addEdge,
  Connection,
  Edge,
  MiniMap,
  useEdgesState,
  useNodesState,
  type Node
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

const initialNodes: Node[] = [
  { id: 'policy', position: { x: 100, y: 80 }, data: { label: 'Policymaking' }, type: 'input' },
  { id: 'funding', position: { x: 380, y: 80 }, data: { label: 'Funding Impact' } },
  { id: 'market', position: { x: 660, y: 80 }, data: { label: 'Market Projection' }, type: 'output' }
];

const initialEdges: Edge[] = [{ id: 'e1-2', source: 'policy', target: 'funding' }];

export default function WorkflowBuilder() {
  const [nodes, _setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback((connection: Connection) => {
    setEdges((eds) => addEdge({ ...connection, animated: true }, eds));
  }, [setEdges]);

  return (
    <div style={{ height: '100%', minHeight: 500 }} className="card">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
      >
        <MiniMap />
        <Controls />
        <Background />
      </ReactFlow>
    </div>
  );
}
