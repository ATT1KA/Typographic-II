import { useState, useEffect } from 'react';
import { type Node } from '@xyflow/react';
import { type NodeData } from '../types/flow';
import '../styles/nodes.css';

interface NodeConfigPanelProps {
  selectedNode: Node<NodeData> | null;
  isOpen: boolean;
  onClose: () => void;
  onConfigChange: (nodeId: string, partial: Partial<NodeData>) => void;
}

const validateUrl = (url: string) => /^https?:\/\/.+/.test(url);

export default function NodeConfigPanel({
  selectedNode,
  isOpen,
  onClose,
  onConfigChange,
}: NodeConfigPanelProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const nodeData = selectedNode?.data as NodeData | undefined;
  const config = nodeData?.config ?? {};
  const ds = config.dataSource ?? {};
  const transforms = config.transforms ?? [];
  const outputs = config.outputs ?? [];
  
  // Determine if this is a Connectivity node
  const isConnectivity = (nodeData?.category ?? (nodeData?.vertical as any)) === 'Connectivity';

  // Reset errors when node changes
  useEffect(() => {
    setErrors({});
  }, [selectedNode?.id]);

  const updateConfig = (key: keyof typeof config, value: any) => {
    if (!selectedNode) return;
    onConfigChange(selectedNode.id, { config: { ...config, [key]: value } });
    setErrors((prev) => ({ ...prev, [key]: '' }));
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

  if (!isOpen || !selectedNode || !nodeData) {
    return null;
  }

  return (
    <div className={`rail-right ${isOpen ? 'open' : ''}`}>
      {/* Full-viewport dimming backdrop; closes on left- or right-click */}
      <div
        className="rail-right-backdrop"
        onClick={onClose}
        onContextMenu={(e) => { e.preventDefault(); onClose(); }}
      />
      <div className="rail-right-panel">
        {/* Header */}
        <div style={{ fontWeight: 700, marginBottom: 6, color: 'var(--text)', fontSize: '14px' }}>
          {isConnectivity 
            ? String(nodeData.subtype || '').toLowerCase()
            : nodeData.label || 'Node Configuration'}
        </div>
        {!isConnectivity && nodeData.vertical && nodeData.subtype && (
          <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 16 }}>
            {nodeData.vertical} • {nodeData.subtype}
          </div>
        )}

        {/* Configuration Form */}
        <div className="node-form">
          {isConnectivity ? (
            <>
              <label style={{ fontSize: 12 }}>
                Logic Type
                <select
                  value={(config.logic?.type as string) || 'router'}
                  onChange={(e) => updateConfig('logic', { ...(config.logic || {}), type: e.target.value })}
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
                  onChange={(e) => {
                    try {
                      const v = JSON.parse(e.target.value || '{}');
                      updateConfig('logic', { ...(config.logic || {}), params: v });
                      setErrors((prev) => ({ ...prev, logic: '' }));
                    } catch {
                      setErrors((prev) => ({ ...prev, logic: 'Invalid JSON' }));
                    }
                  }}
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
                <select 
                  value={ds.type || 'api'} 
                  onChange={(e) => updateConfig('dataSource', { ...ds, type: e.target.value })}
                >
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
                  <div 
                    key={idx} 
                    style={{ 
                      marginBottom: 8, 
                      padding: 8, 
                      border: '1px solid var(--control-border)', 
                      borderRadius: 8, 
                      background: 'var(--control-bg)' 
                    }}
                  >
                    <select 
                      value={t.type} 
                      onChange={(e) => updateTransform(idx, { type: e.target.value })}
                    >
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
                    <button 
                      onClick={() => removeTransform(idx)} 
                      style={{ marginTop: 4 }}
                    >
                      Remove
                    </button>
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}

