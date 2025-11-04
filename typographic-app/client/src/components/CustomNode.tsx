import { Handle, Position, type NodeProps, NodeResizer, useUpdateNodeInternals, useReactFlow } from '@xyflow/react';
import { roundToGrid } from '../constants/grid';
import { useEffect, useLayoutEffect, useMemo, useRef, type CSSProperties } from 'react';
import { type NodeData, verticalColors, type NodeCategory } from '../types/flow';
import '../styles/nodes.css';

// Helper function to remove redundant vertical prefixes from labels
function cleanLabel(label: string, vertical: string): string {
  if (!label || !vertical) return label;
  
  // Map vertical names to their common label prefixes
  const verticalPrefixes: Record<string, string[]> = {
    'BI': ['BI:', 'BI '],
    'SCI': ['Supply Chain:', 'Supply Chain ', 'SCI:', 'SCI '],
    'Fundraising': ['Fundraising:', 'Fundraising '],
    'Policymaking': ['Policymaking:', 'Policymaking ', 'Policy:', 'Policy '],
    'Political': ['Political:', 'Political '],
    'OSINT': ['OSINT:', 'OSINT '],
  };
  
  const prefixes = verticalPrefixes[vertical] || [`${vertical}:`, `${vertical} `];
  
  // Try each prefix (case-insensitive)
  for (const prefix of prefixes) {
    const regex = new RegExp(`^${prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i');
    if (regex.test(label)) {
      return label.replace(regex, '').trim();
    }
  }
  
  return label;
}

export default function CustomNode(props: NodeProps) {
  const { selected } = props;
  const data = props.data as NodeData;
  const isConnectivity = (data.category ?? (data.vertical as any)) === 'Connectivity';
  
  // Clean the label to remove redundant vertical prefix
  const cleanedLabel = useMemo(() => {
    if (isConnectivity) return String(data.subtype || '').toLowerCase();
    return cleanLabel(data.label, data.vertical);
  }, [data.label, data.vertical, data.subtype, isConnectivity]);
  const updateNodeInternals = useUpdateNodeInternals();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const lastUnselectedWidth = useRef<number | null>(null);
  const lastUnselectedHeight = useRef<number | null>(null);
  const rf = useReactFlow();
  // compute which handles on this node are currently connected
  const connectedHandles = useMemo(() => {
    try {
      const all = rf.getEdges() as any[];
      const id = (props as any).id as string;
      const set = new Set<string>();
      for (const e of all) {
        if (e.source === id && e.sourceHandle) set.add(e.sourceHandle);
        if (e.target === id && e.targetHandle) set.add(e.targetHandle);
      }
      return set;
    } catch {
      return new Set<string>();
    }
  }, [rf, props]);

  // Track the node's width while unselected so we can lock to it on selection
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (!selected) {
      // Use offsetWidth for layout width excluding transforms
      lastUnselectedWidth.current = root.offsetWidth;
      lastUnselectedHeight.current = root.offsetHeight;
    }
  }, [selected]);

  // Maintain consistent node sizing (no expansion needed since there's no body content)
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (!selected) {
      // Reset to natural size when deselected
      root.style.width = '';
      root.style.height = '';
      updateNodeInternals((props as any).id ?? '');
    }
  }, [selected, updateNodeInternals, props]);

  // Snap node dimensions to GRID on resize end
  useEffect(() => {
    if (!selected) return;
    const root = rootRef.current;
    if (!root) return;
    const onMouseUp = () => {
      const id = (props as any).id as string;
      const w = roundToGrid(root.offsetWidth);
      const h = roundToGrid(root.offsetHeight);
      rf.setNodes((nds) => nds.map((n) => (n.id === id ? { ...n, width: w, height: h } : n)));
      updateNodeInternals(id);
    };
    window.addEventListener('mouseup', onMouseUp, { once: true });
    return () => { window.removeEventListener('mouseup', onMouseUp); };
  }, [selected, rf, updateNodeInternals, props]);

  const headStyle = useMemo((): CSSProperties => {
    if (isConnectivity) {
      return {
        background: 'linear-gradient(180deg, color-mix(in oklab, var(--bg-elev), black 8%), color-mix(in oklab, var(--bg-elev), black 18%))',
        color: 'var(--text)'
      };
    }
    return { background: verticalColors[data.vertical as keyof typeof verticalColors], color: 'var(--text)' };
  }, [isConnectivity, data.vertical]);

  return (
    <div ref={rootRef} className={`node-card ${selected ? 'selected' : ''} vertical-${String(data.vertical || '').toLowerCase()} ${isConnectivity ? 'node-connectivity' : ''}`}>
      <NodeResizer
        isVisible={!!selected}
        minWidth={isConnectivity ? 144 : 200}
        minHeight={isConnectivity ? 96 : 120}
        keepAspectRatio={false}
        lineStyle={{ stroke: '#3d4557' }}
        handleStyle={{ width: 8, height: 8, borderRadius: 2 }}
      />

      <div className="node-head" style={headStyle}>
        {!isConnectivity && (
          <div className="node-vertical">{data.vertical}</div>
        )}
        <div className="node-title">{cleanedLabel}</div>
        {!isConnectivity && data.subtype && (
          <div className="node-sub">{data.subtype}</div>
        )}
      </div>


      {(() => {
        // Infer category for legacy nodes
        const category: NodeCategory = data.category ?? (
          (['Connectivity','Transformation','Output'] as const).includes(data.vertical as any)
            ? (data.vertical as NodeCategory)
            : 'Data'
        );

        // Defaults per category
        const defaults =
          category === 'Connectivity'
            ? [
                { id: 'data-in-a', direction: 'in' as const, kind: 'data' as const },
                { id: 'data-in-b', direction: 'in' as const, kind: 'data' as const },
                { id: 'data-out', direction: 'out' as const, kind: 'data' as const },
                { id: 'meta-in', direction: 'in' as const, kind: 'meta' as const },
                { id: 'meta-out', direction: 'out' as const, kind: 'meta' as const },
              ]
            : category === 'Transformation'
            ? [
                { id: 'data-in', direction: 'in' as const, kind: 'data' as const },
                { id: 'data-out', direction: 'out' as const, kind: 'data' as const },
                { id: 'meta-in', direction: 'in' as const, kind: 'meta' as const },
                { id: 'meta-out', direction: 'out' as const, kind: 'meta' as const },
              ]
            : category === 'Output'
            ? [
                { id: 'data-in', direction: 'in' as const, kind: 'data' as const },
                { id: 'meta-in', direction: 'in' as const, kind: 'meta' as const },
                { id: 'meta-out', direction: 'out' as const, kind: 'meta' as const },
              ]
            : [
                { id: 'data-in', direction: 'in' as const, kind: 'data' as const },
                { id: 'data-out', direction: 'out' as const, kind: 'data' as const },
                { id: 'meta-out', direction: 'out' as const, kind: 'meta' as const },
              ];

        const ports = (data.ports && data.ports.length ? data.ports : defaults) as Array<{
          id: string; direction: 'in' | 'out'; kind: 'data' | 'meta';
        }>;

        return ports.map((p, i) => {
          const isIn = p.direction === 'in';
          const offset = 20 + i * 16;
          const color = p.kind === 'meta' ? '#e05555' : '#9a9a9a';
          const tooltip = `${p.kind === 'meta' ? 'Meta' : 'Data'} ${isIn ? 'In' : 'Out'}`;
          const cls = `node-port node-port--${p.kind} node-port--${p.direction}` + (connectedHandles.has(p.id) ? ' connected' : '');
          return (
            <Handle
              key={p.id}
              id={p.id}
              type={isIn ? 'target' : 'source'}
              position={isIn ? Position.Left : Position.Right}
              className={cls}
              data-tooltip={tooltip}
              title={tooltip}
              aria-label={tooltip}
              style={{ top: offset, background: color, border: `1px solid ${color}`, ['--port-top' as any]: `${offset}px` }}
            />
          );
        });
      })()}
    </div>
  );
}
