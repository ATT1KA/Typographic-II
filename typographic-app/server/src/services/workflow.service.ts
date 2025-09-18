import { randomUUID } from 'crypto';

type NodeParam = { key: string; value: number | string; };
export type WorkflowNode = { id: string; type: string; label: string; params?: NodeParam[] };
export type WorkflowEdge = { id: string; source: string; target: string; weight?: number };
export type Workflow = { id: string; name: string; nodes: WorkflowNode[]; edges: WorkflowEdge[] };

const workflows = new Map<string, Workflow>();

export async function getWorkflows(): Promise<Workflow[]> {
  return Array.from(workflows.values());
}

export async function createWorkflow(data: Partial<Workflow>): Promise<Workflow> {
  const id = data.id ?? randomUUID();
  const wf: Workflow = {
    id,
    name: data.name ?? 'Untitled Workflow',
    nodes: data.nodes ?? [],
    edges: data.edges ?? [],
  };
  workflows.set(id, wf);
  return wf;
}

export async function runWorkflow(id: string): Promise<{ id: string; result: unknown }> {
  const wf = workflows.get(id);
  if (!wf) throw Object.assign(new Error('Workflow not found'), { status: 404 });

  let score = 0;
  for (const edge of wf.edges) {
    score += edge.weight ?? 0.1;
  }
  return { id, result: { score, ranAt: new Date().toISOString() } };
}
