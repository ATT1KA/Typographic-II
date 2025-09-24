import { useState, useEffect } from 'react';
import { X, Settings, Save, RotateCcw } from 'lucide-react';
import { WidgetConfig, getWidgetByType } from '../types/dashboard';

interface WidgetConfigModalProps {
  widget: WidgetConfig;
  isOpen: boolean;
  onClose: () => void;
  onSave: (widgetId: string, updates: Partial<WidgetConfig>) => void;
}

interface ConfigFieldProps {
  field: {
    key: string;
    type: 'string' | 'number' | 'boolean' | 'select' | 'color' | 'range';
    label: string;
    required: boolean;
    defaultValue: any;
    options?: { label: string; value: any }[];
    min?: number;
    max?: number;
  };
  value: any;
  onChange: (value: any) => void;
}

function ConfigField({ field, value, onChange }: ConfigFieldProps) {
  const inputId = `config-${field.key}`;

  const renderInput = () => {
    switch (field.type) {
      case 'string':
        return (
          <input
            id={inputId}
            type="text"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.defaultValue}
            className="config-input"
          />
        );

      case 'number':
        return (
          <input
            id={inputId}
            type="number"
            value={value || field.defaultValue}
            onChange={(e) => onChange(Number(e.target.value))}
            min={field.min}
            max={field.max}
            className="config-input"
          />
        );

      case 'boolean':
        return (
          <div className="config-checkbox-wrapper">
            <input
              id={inputId}
              type="checkbox"
              checked={value ?? field.defaultValue}
              onChange={(e) => onChange(e.target.checked)}
              className="config-checkbox"
            />
            <label htmlFor={inputId} className="config-checkbox-label">
              {field.label}
            </label>
          </div>
        );

      case 'select':
        return (
          <select
            id={inputId}
            value={value ?? field.defaultValue}
            onChange={(e) => onChange(e.target.value)}
            className="config-select"
          >
            {field.options?.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case 'color':
        return (
          <div className="config-color-wrapper">
            <input
              id={inputId}
              type="color"
              value={value || field.defaultValue}
              onChange={(e) => onChange(e.target.value)}
              className="config-color"
            />
            <input
              type="text"
              value={value || field.defaultValue}
              onChange={(e) => onChange(e.target.value)}
              placeholder={field.defaultValue}
              className="config-input"
            />
          </div>
        );

      case 'range':
        return (
          <div className="config-range-wrapper">
            <input
              id={inputId}
              type="range"
              value={value ?? field.defaultValue}
              onChange={(e) => onChange(Number(e.target.value))}
              min={field.min || 0}
              max={field.max || 100}
              className="config-range"
            />
            <span className="config-range-value">
              {value ?? field.defaultValue}
            </span>
          </div>
        );

      default:
        return (
          <input
            id={inputId}
            type="text"
            value={String(value || field.defaultValue)}
            onChange={(e) => onChange(e.target.value)}
            className="config-input"
          />
        );
    }
  };

  return (
    <div className="config-field">
      <label htmlFor={inputId} className="config-label">
        {field.label}
        {field.required && <span className="config-required">*</span>}
      </label>
      {renderInput()}
      {field.type !== 'boolean' && (
        <div className="config-help">
          {field.type === 'range' && `${field.min || 0} - ${field.max || 100}`}
          {field.type === 'color' && 'Click to select color'}
        </div>
      )}
    </div>
  );
}

export default function WidgetConfigModal({
  widget,
  isOpen,
  onClose,
  onSave
}: WidgetConfigModalProps) {
  const [config, setConfig] = useState<Partial<WidgetConfig>>({});
  const [activeTab, setActiveTab] = useState<'basic' | 'style' | 'data'>('basic');

  const widgetLibraryItem = getWidgetByType(widget.type as any);

  useEffect(() => {
    if (widget) {
      setConfig({
        title: widget.title,
        description: widget.description,
        settings: { ...widget.settings },
        style: { ...widget.style }
      });
    }
  }, [widget]);

  const handleSave = () => {
    onSave(widget.id, config);
    onClose();
  };

  const handleReset = () => {
    if (widgetLibraryItem) {
      setConfig({
        title: widgetLibraryItem.name,
        description: widgetLibraryItem.description,
        settings: { ...widgetLibraryItem.defaultSettings },
        style: {
          backgroundColor: undefined,
          borderColor: undefined,
          textColor: undefined,
          borderRadius: undefined,
          opacity: undefined
        }
      });
    }
  };

  const updateConfig = (updates: Partial<WidgetConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  };

  const updateSettings = (updates: Record<string, any>) => {
    setConfig(prev => ({
      ...prev,
      settings: { ...prev.settings, ...updates }
    }));
  };

  const updateStyle = (updates: Partial<NonNullable<WidgetConfig['style']>>) => {
    setConfig(prev => ({
      ...prev,
      style: { ...prev.style, ...updates }
    }));
  };

  if (!isOpen || !widget) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <Settings size={20} style={{ marginRight: '8px' }} />
            Configure {widget.type} Widget
          </div>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {/* Tab Navigation */}
          <div className="config-tabs">
            {['basic', 'style', 'data'].map(tab => (
              <button
                key={tab}
                className={`config-tab ${activeTab === tab ? 'active' : ''}`}
                onClick={() => setActiveTab(tab as any)}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="config-content">
            {activeTab === 'basic' && (
              <div className="config-section">
                <h4 className="config-section-title">Basic Settings</h4>

                <ConfigField
                  field={{
                    key: 'title',
                    type: 'string',
                    label: 'Widget Title',
                    required: true,
                    defaultValue: widgetLibraryItem?.name || ''
                  }}
                  value={config.title}
                  onChange={(value) => updateConfig({ title: value })}
                />

                <ConfigField
                  field={{
                    key: 'description',
                    type: 'string',
                    label: 'Description',
                    required: false,
                    defaultValue: ''
                  }}
                  value={config.description}
                  onChange={(value) => updateConfig({ description: value })}
                />

                {/* Widget-specific settings */}
                {widgetLibraryItem?.configOptions.map(field => (
                  <ConfigField
                    key={field.key}
                    field={field}
                    value={config.settings?.[field.key]}
                    onChange={(value) => updateSettings({ [field.key]: value })}
                  />
                ))}
              </div>
            )}

            {activeTab === 'style' && (
              <div className="config-section">
                <h4 className="config-section-title">Visual Style</h4>

                <ConfigField
                  field={{
                    key: 'backgroundColor',
                    type: 'color',
                    label: 'Background Color',
                    required: false,
                    defaultValue: '#1b1b1b'
                  }}
                  value={config.style?.backgroundColor}
                  onChange={(value) => updateStyle({ backgroundColor: value })}
                />

                <ConfigField
                  field={{
                    key: 'borderColor',
                    type: 'color',
                    label: 'Border Color',
                    required: false,
                    defaultValue: '#2e2e2e'
                  }}
                  value={config.style?.borderColor}
                  onChange={(value) => updateStyle({ borderColor: value })}
                />

                <ConfigField
                  field={{
                    key: 'textColor',
                    type: 'color',
                    label: 'Text Color',
                    required: false,
                    defaultValue: '#f0f0f0'
                  }}
                  value={config.style?.textColor}
                  onChange={(value) => updateStyle({ textColor: value })}
                />

                <ConfigField
                  field={{
                    key: 'borderRadius',
                    type: 'range',
                    label: 'Border Radius',
                    required: false,
                    defaultValue: 8,
                    min: 0,
                    max: 20
                  }}
                  value={config.style?.borderRadius}
                  onChange={(value) => updateStyle({ borderRadius: value })}
                />

                <ConfigField
                  field={{
                    key: 'opacity',
                    type: 'range',
                    label: 'Opacity',
                    required: false,
                    defaultValue: 1,
                    min: 0.1,
                    max: 1
                  }}
                  value={config.style?.opacity}
                  onChange={(value) => updateStyle({ opacity: value })}
                />
              </div>
            )}

            {activeTab === 'data' && (
              <div className="config-section">
                <h4 className="config-section-title">Data Connection</h4>
                <div className="config-info">
                  <p style={{ margin: '0 0 12px 0', fontSize: '13px', color: 'var(--muted)' }}>
                    Connect this widget to workflow output nodes to display live data.
                  </p>
                  <div style={{
                    padding: '12px',
                    background: 'var(--bg-elev-2)',
                    borderRadius: '4px',
                    border: '1px solid var(--control-border)'
                  }}>
                    <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
                      No data connections configured yet.
                    </div>
                    <button
                      style={{
                        marginTop: '8px',
                        padding: '4px 8px',
                        background: 'var(--accent)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '11px',
                        cursor: 'pointer'
                      }}
                    >
                      Connect to Workflow
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <div className="modal-actions">
            <button className="btn-secondary" onClick={handleReset}>
              <RotateCcw size={16} style={{ marginRight: '4px' }} />
              Reset
            </button>
            <div style={{ flex: 1 }} />
            <button className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button className="btn-primary" onClick={handleSave}>
              <Save size={16} style={{ marginRight: '4px' }} />
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
