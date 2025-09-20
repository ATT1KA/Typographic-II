import { Handle, Position, type NodeProps, NodeResizer } from '@xyflow/react';
import { useMemo, useState } from 'react';
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

  const headStyle = useMemo(
    () => ({ background: verticalColors[data.vertical as keyof typeof verticalColors], color: 'var(--text)' }),
    [data.vertical]
  );

  return (
    <div className={`node-card ${selected ? 'selected' : ''} vertical-${String(data.vertical || '').toLowerCase()}`}>
      <NodeResizer isVisible={!!selected} minWidth={300} minHeight={200} lineStyle={{ stroke: '#3d4557' }} handleStyle={{ width: 8, height: 8, borderRadius: 2 }} />

      <div className="node-head" style={headStyle}>
        <div className="node-title">{data.label}</div>
        <div className="node-sub">{data.vertical} • {data.subtype}</div>
      </div>

      <div className="node-body" onKeyDownCapture={(e) => e.stopPropagation()}>
        <button className="node-toggle" onClick={() => setOpen((v) => !v)}>
          {open ? 'Hide config' : 'Edit config'}
        </button>
        {open && (
          <div className="node-form">
            <label style={{ fontSize: 12 }}>
              Data Source Type
              <select value={ds.type || 'api'} onChange={(e) => updateConfig('dataSource', { ...ds, type: e.target.value })}>
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
                onChange={(e) => validateAndUpdate('endpoint', e.target.value, validateUrl)}
              />
            </label>
            <label style={{ fontSize: 12 }}>
              Notes
              <textarea
                value={ds.notes || ''}
                onChange={(e) => validateAndUpdate('notes', e.target.value)}
              />
            </label>
            <div>
              <label style={{ fontSize: 12 }}>Transforms</label>
              {transforms.map((t: any, idx: number) => (
                <div key={idx} style={{ marginBottom: 8, padding: 8, border: '1px solid var(--control-border)', borderRadius: 8, background: 'var(--control-bg)' }}>
                  <select value={t.type} onChange={(e) => updateTransform(idx, { type: e.target.value })}>
                    <option value="aggregation">Aggregation</option>
                    <option value="anomaly-detection">Anomaly Detection</option>
                    <option value="lm-studio-summary">LM Studio Summary</option>
                  </select>
                  {t.type === 'lm-studio-summary' && (
                    <>
                      <input
                        placeholder="LM Endpoint"
                        value={t.params?.endpoint || ''}
                        onChange={(e) => updateTransform(idx, { params: { ...(t.params || {}), endpoint: e.target.value } })}
                      />
                      <textarea
                        placeholder="Prompt"
                        value={t.params?.prompt || ''}
                        onChange={(e) => updateTransform(idx, { params: { ...(t.params || {}), prompt: e.target.value } })}
                      />
                    </>
                  )}
                  <button onClick={() => removeTransform(idx)} style={{ marginTop: 4 }}>Remove</button>
                </div>
              ))}
              <button onClick={addTransform} style={{ fontSize: 12 }}>Add Transform</button>
            </div>
            <label style={{ fontSize: 12 }}>
              Outputs (one per line)
              <textarea
                value={outputs.join('\n')}
                placeholder="dashboard: /dash/markets\nalerts: slack://#markets"
                onChange={(e) => validateAndUpdate('outputs', e.target.value)}
              />
            </label>
          </div>
        )}
      </div>

      {(() => {
        // Infer category for legacy nodes
        const category: NodeCategory = (data.category ??
          (['Connectivity','Transformation','Output'] as const).includes(data.vertical as any)
            ? (data.vertical as NodeCategory)
            : 'Data');

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
          return (
            <Handle
              key={p.id}
              id={p.id}
              type={isIn ? 'target' : 'source'}
              position={isIn ? Position.Left : Position.Right}
              style={{ top: offset, background: color, border: `1px solid ${color}` }}
            />
          );
        });
      })()}
    </div>
  );
}
