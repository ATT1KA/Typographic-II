import { useMemo, useState } from 'react';
import ReactFlow, { addEdge, Background, Controls, MiniMap, type Connection, type Edge, type Node } from 'reactflow';
import 'reactflow/dist/style.css';

export default function WorkflowBuilder() {
  const initialNodes = useMemo<Node[]>(() => ([
    { id: '1', data: { label: 'Policy Node' }, position: { x: 100, y: 100 }, type: 'input' },
    { id: '2', data: { label: 'Funding Impact' }, position: { x: 400, y: 200 } },
    { id: '3', data: { label: 'Market Projection' }, position: { x: 700, y: 100 }, type: 'output' },
  ]), []);
  const initialEdges = useMemo<Edge[]>(() => ([{ id: 'e1-2', source: '1', target: '2' }]), []);
  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);

  const onConnect = (connection: Connection) => setEdges((eds) => addEdge(connection, eds));

  return (
    <div style={{ height: '70vh' }} className="card">
      <ReactFlow nodes={nodes} edges={edges} onNodesChange={setNodes as any} onEdgesChange={setEdges as any} onConnect={onConnect}>
        <MiniMap />
        <Controls />
        <Background />
      </ReactFlow>
    </div>
  );
}
