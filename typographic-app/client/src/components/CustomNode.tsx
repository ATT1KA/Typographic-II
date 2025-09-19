import { Handle, Position, type NodeProps } from '@xyflow/react';
import { useState } from 'react';

export type NodeData = {
  label: string;
  vertical: 'BI' | 'Political' | 'Policymaking' | 'Fundraising' | 'OSINT' | 'SCI';
  subtype: string;
  config?: {
    dataSource?: {
      type?: 'api' | 'db' | 'file';
      endpoint?: string;
      notes?: string;
    };
    transforms?: Array<
      | { type: 'lm-studio-summary'; params: { endpoint: string; prompt: string } }
      | { type: 'aggregation'; params?: Record<string, unknown> }
      | { type: 'anomaly-detection'; params?: Record<string, unknown> }
    >;
    outputs?: string[];
  };
  onChange?: (partial: Partial<NodeData>) => void;
};

const headerColor: Record<NodeData['vertical'], string> = {
  BI: '#6c5ce7',
  Political: '#0984e3',
  Policymaking: '#d63031',
  Fundraising: '#e17055',
  OSINT: '#00b894',
  SCI: '#fdcb6e'
};

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

  return (
    <div style={{ minWidth: 280, border: selected ? '2px solid #333' : '1px solid #aaa', borderRadius: 8, background: '#fff' }}>
      <div style={{ padding: '8px 10px', borderTopLeftRadius: 8, borderTopRightRadius: 8, background: headerColor[data.vertical], color: data.vertical === 'SCI' ? '#000' : '#fff' }}>
        <div style={{ fontWeight: 700 }}>{data.label}</div>
        <div style={{ fontSize: 12, opacity: 0.9 }}>{data.vertical} • {data.subtype}</div>
      </div>

      <div style={{ padding: 10 }}>
        <button onClick={() => setOpen((v) => !v)} style={{ fontSize: 12 }}>
          {open ? 'Hide config' : 'Edit config'}
        </button>
        {open && (
          <div style={{ marginTop: 8, display: 'grid', gap: 8 }}>
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
                style={{ width: '100%' }}
                type="text"
                value={ds.endpoint || ''}
                placeholder="https://api.example.com/endpoint"
                onChange={(e) => validateAndUpdate('endpoint', e.target.value, validateUrl)}
              />
            </label>
            <label style={{ fontSize: 12 }}>
              Notes
              <textarea
                style={{ width: '100%', minHeight: 40 }}
                value={ds.notes || ''}
                onChange={(e) => validateAndUpdate('notes', e.target.value)}
              />
            </label>
            <div>
              <label style={{ fontSize: 12 }}>Transforms</label>
              {transforms.map((t: any, idx: number) => (
                <div key={idx} style={{ marginBottom: 8, padding: 4, border: '1px solid #ccc' }}>
                  <select value={t.type} onChange={(e) => updateTransform(idx, { type: e.target.value })}>
                    <option value="aggregation">Aggregation</option>
                    <option value="anomaly-detection">Anomaly Detection</option>
                    <option value="lm-studio-summary">LM Studio Summary</option>
                  </select>
                  {t.type === 'lm-studio-summary' && (
                    <>
                      <input
                        style={{ width: '100%', marginTop: 4 }}
                        placeholder="LM Endpoint"
                        value={t.params?.endpoint || ''}
                        onChange={(e) => updateTransform(idx, { params: { ...(t.params || {}), endpoint: e.target.value } })}
                      />
                      <textarea
                        style={{ width: '100%', minHeight: 40, marginTop: 4 }}
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
                style={{ width: '100%', minHeight: 60 }}
                value={outputs.join('\n')}
                placeholder="dashboard: /dash/markets\nalerts: slack://#markets"
                onChange={(e) => validateAndUpdate('outputs', e.target.value)}
              />
            </label>
          </div>
        )}
      </div>

      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </div>
  );
}
