import { Handle, Position, type NodeProps, NodeResizer, useUpdateNodeInternals, useReactFlow } from '@xyflow/react';
import { roundToGrid } from '../constants/grid';
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { linkEvent } from 'inferno';
import { type NodeData, verticalColors, type NodeCategory } from '../types/flow';
import '../styles/nodes.css';

const validateUrl = (url: string) => /^https?:\/\/.+/.test(url);

export default function CustomNode(props: NodeProps) {
  const { selected } = props;
  const data = props.data as NodeData;
  const [open, setOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const config = data.config ?? {};
  const ds = config.dataSource ?? {};
  const transforms = config.transforms ?? [];
  const outputs = config.outputs ?? [];
  const isConnectivity = (data.category ?? (data.vertical as any)) === 'Connectivity';
  const updateNodeInternals = useUpdateNodeInternals();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const bodyRef = useRef<HTMLDivElement | null>(null);
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

  // When selected (clicked), expand node height to fit content without changing width.
  useEffect(() => {
    const root = rootRef.current;
    const body = bodyRef.current;
    if (!root || !body) return;
    if (selected) {
      // Capture pre-expansion height/width once when entering selected state
      if (lastUnselectedHeight.current == null) {
        lastUnselectedHeight.current = root.offsetHeight;
      }
      const lockWidth = lastUnselectedWidth.current ?? root.offsetWidth;
      root.style.width = `${lockWidth}px`; // lock to pre-selection width
      const prevOverflow = body.style.overflowY;
      body.style.overflowY = 'visible';
      // Allow layout to settle before measuring
      requestAnimationFrame(() => {
        // Set height to content height
        root.style.height = 'auto';
        const targetHeight = root.scrollHeight; // include open form, etc.
        root.style.height = `${targetHeight}px`;
        updateNodeInternals((props as any).id ?? '');
      });
      return () => { body.style.overflowY = prevOverflow; };
    } else {
      // restore when deselected: width auto and height to pre-selection value
      root.style.width = '';
      const restoreH = lastUnselectedHeight.current;
      if (restoreH && Number.isFinite(restoreH)) {
        root.style.height = `${restoreH}px`;
      } else {
        root.style.height = '';
      }
      body.style.overflowY = '';
      updateNodeInternals((props as any).id ?? '');
    }
  }, [selected, open, config, updateNodeInternals, props]);

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

  const updateConfig = (key: keyof typeof config, value: any) => {
    data.onChange?.({ config: { ...config, [key]: value } });
    setErrors((prev) => ({ ...prev, [key]: '' })); // Clear error on change
  };

  const addTransform = () => {
    updateConfig('transforms', [...transforms, { type: 'aggregation' }]);
  };

  const removeTransform = (idx: number) => {
    updateConfig('transforms', transforms.filter((_, i) => i !== idx));
  };

  const updateTransform = (idx: number, partial: any) => {
    const newTransforms = [...transforms];
    newTransforms[idx] = { ...newTransforms[idx], ...partial };
    updateConfig('transforms', newTransforms);
  };

  const validateAndUpdate = (key: string, value: string, validator?: (v: string) => boolean) => {
    if (validator && !validator(value)) {
      setErrors((prev) => ({ ...prev, [key]: 'Invalid format' }));
      return;
    }
    if (key === 'endpoint') updateConfig('dataSource', { ...ds, endpoint: value });
    else if (key === 'notes') updateConfig('dataSource', { ...ds, notes: value });
    else if (key === 'outputs') updateConfig('outputs', value.split('\n').filter(Boolean));
  };

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
        minWidth={isConnectivity ? 144 : 288}
        minHeight={isConnectivity ? 96 : 192}
        keepAspectRatio={false}
        lineStyle={{ stroke: '#3d4557' }}
        handleStyle={{ width: 8, height: 8, borderRadius: 2 }}
      />

      <div className="node-head" style={headStyle}>
        <div className="node-title">{isConnectivity ? String(data.subtype || '').toLowerCase() : data.label}</div>
        {!isConnectivity && (
          <div className="node-sub">{data.vertical} • {data.subtype}</div>
        )}
      </div>

  <div ref={bodyRef} className="node-body" onKeyDownCapture={(e) => e.stopPropagation()}>
        <button className="node-toggle" onClick={linkEvent(() => setOpen((v) => !v), null)}>
          {open ? 'Hide config' : 'Edit config'}
        </button>
        {open && (
          <div className="node-form">
            {isConnectivity ? (
              <>
                <label style={{ fontSize: 12 }}>
                  Logic Type
                  <select
                    value={(config.logic?.type as string) || 'router'}
                    onChange={linkEvent((e) => updateConfig('logic', { ...(config.logic || {}), type: e.target.value }), null)}
                  >
                    <option value="router">Router</option>
                    <option value="join">Join</option>
                    <option value="split">Split</option>
                    <option value="feedback">Feedback</option>
                    <option value="causal-graph">Causal Graph (static)</option>
                  </select>
                </label>
                <label style={{ fontSize: 12 }}>
                  Parameters (JSON)
                  <textarea
                    value={JSON.stringify(config.logic?.params || {}, null, 2)}
                    onChange={linkEvent((e) => {
                      try {
                        const v = JSON.parse(e.target.value || '{}');
                        updateConfig('logic', { ...(config.logic || {}), params: v });
                        setErrors((prev) => ({ ...prev, logic: '' }));
                      } catch {
                        setErrors((prev) => ({ ...prev, logic: 'Invalid JSON' }));
                      }
                    }, null)}
                    style={{ resize: 'vertical', whiteSpace: 'pre-wrap' }}
                  />
                </label>
                {errors.logic && <div style={{ color: 'red', fontSize: 12 }}>{errors.logic}</div>}
                <div style={{ fontSize: 11, opacity: 0.8 }}>
                  Connectivity nodes are logical routers only. They do not fetch data or call models.
                </div>
              </>
            ) : (
              <>
                <label style={{ fontSize: 12 }}>
                  Data Source Type
                  <select value={ds.type || 'api'} onChange={linkEvent((e) => updateConfig('dataSource', { ...ds, type: e.target.value }), null)}>
                    <option value="api">API</option>
                    <option value="db">Database</option>
                    <option value="file">File</option>
                  </select>
                </label>
                <label style={{ fontSize: 12 }}>
                  Endpoint {errors.endpoint && <span style={{ color: 'red' }}>{errors.endpoint}</span>}
                  <input
                    type="text"
                    value={ds.endpoint || ''}
                    placeholder="https://api.example.com/endpoint"
                    onChange={linkEvent((e) => validateAndUpdate('endpoint', e.target.value, validateUrl), null)}
                  />
                </label>
                <label style={{ fontSize: 12 }}>
                  Notes
                  <textarea
                    value={ds.notes || ''}
                    onChange={linkEvent((e) => validateAndUpdate('notes', e.target.value), null)}
                  />
                </label>
                <div>
                  <label style={{ fontSize: 12 }}>Transforms</label>
                  {transforms.map((t: any, idx: number) => (
                    <div key={idx} style={{ marginBottom: 8, padding: 8, border: '1px solid var(--control-border)', borderRadius: 8, background: 'var(--control-bg)' }}>
                      <select value={t.type} onChange={linkEvent((e) => updateTransform(idx, { type: e.target.value }), null)}>
                        <option value="aggregation">Aggregation</option>
                        <option value="anomaly-detection">Anomaly Detection</option>
                        <option value="lm-studio-summary">LM Studio Summary</option>
                      </select>
                      {t.type === 'lm-studio-summary' && (
                        <>
                          <input
                            placeholder="LM Endpoint"
                            value={t.params?.endpoint || ''}
                            onChange={linkEvent((e) => updateTransform(idx, { params: { ...(t.params || {}), endpoint: e.target.value } }), null)}
                          />
                          <textarea
                            placeholder="Prompt"
                            value={t.params?.prompt || ''}
                            onChange={linkEvent((e) => updateTransform(idx, { params: { ...(t.params || {}), prompt: e.target.value } }), null)}
                          />
                        </>
                      )}
                      <button onClick={linkEvent(() => removeTransform(idx), null)} style={{ marginTop: 4 }}>Remove</button>
                    </div>
                  ))}
                  <button onClick={linkEvent(addTransform, null)} style={{ fontSize: 12 }}>Add Transform</button>
                </div>
                <label style={{ fontSize: 12 }}>
                  Outputs (one per line)
                  <textarea
                    value={outputs.join('\n')}
                    placeholder="dashboard: /dash/markets\nalerts: slack://#markets"
                    onChange={linkEvent((e) => validateAndUpdate('outputs', e.target.value), null)}
                  />
                </label>
              </>
            )}
          </div>
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
          const offset = 12 + i * 14;
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
