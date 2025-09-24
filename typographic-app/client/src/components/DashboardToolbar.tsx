import { Save, FolderOpen, Plus, Trash2, Copy, Download, Upload, Settings } from 'lucide-react';
import { Dashboard } from '../types/dashboard';

interface DashboardToolbarProps {
  dashboard: Dashboard;
  isSaving: boolean;
  isDirty: boolean;
  selectedWidgetsCount: number;
  onSave: () => void;
  onNew: () => void;
  onExport: () => void;
  onImport: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onDuplicate: () => void;
  onDeleteSelected: () => void;
  onSettings: () => void;
}

export default function DashboardToolbar({
  dashboard,
  isSaving,
  isDirty,
  selectedWidgetsCount,
  onSave,
  onNew,
  onExport,
  onImport,
  onDuplicate,
  onDeleteSelected,
  onSettings
}: DashboardToolbarProps) {
  const handleImportClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => onImport(e as any);
    input.click();
  };

  return (
    <div
      className="dashboard-toolbar"
      style={{
        height: '48px',
        background: 'var(--bg-elev)',
        borderBottom: '1px solid var(--control-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        zIndex: 50
      }}
    >
      {/* Left section - Dashboard info and primary actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {/* Dashboard name and status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--text)' }}>
            {dashboard.name}
          </div>
          {isDirty && (
            <div style={{
              fontSize: '10px',
              color: 'white',
              background: 'var(--accent)',
              padding: '2px 6px',
              borderRadius: '2px'
            }}>
              UNSAVED
            </div>
          )}
          {isSaving && (
            <div style={{
              fontSize: '10px',
              color: 'var(--muted)',
              padding: '2px 6px'
            }}>
              Saving...
            </div>
          )}
        </div>

        {/* Primary actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button
            onClick={onSave}
            disabled={isSaving}
            style={{
              padding: '6px 12px',
              background: isSaving ? 'var(--bg-elev-2)' : 'var(--accent)',
              color: isSaving ? 'var(--muted)' : 'white',
              border: '1px solid var(--control-border)',
              borderRadius: '4px',
              cursor: isSaving ? 'not-allowed' : 'pointer',
              fontSize: '12px',
              fontFamily: 'var(--font-mono)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
            title="Save dashboard (Ctrl+S)"
          >
            <Save size={14} />
            {isSaving ? 'Saving...' : 'Save'}
          </button>

          <button
            onClick={onNew}
            style={{
              padding: '6px 12px',
              background: 'var(--control-bg)',
              color: 'var(--text)',
              border: '1px solid var(--control-border)',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px',
              fontFamily: 'var(--font-mono)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
            title="New dashboard (Ctrl+N)"
          >
            <Plus size={14} />
            New
          </button>
        </div>
      </div>

      {/* Center section - Dashboard management */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <button
          style={{
            padding: '6px 12px',
            background: 'var(--control-bg)',
            color: 'var(--text)',
            border: '1px solid var(--control-border)',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px',
            fontFamily: 'var(--font-mono)',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
          title="Open dashboard menu"
        >
          <FolderOpen size={14} />
          Dashboards
        </button>

        <button
          onClick={onExport}
          style={{
            padding: '6px 12px',
            background: 'var(--control-bg)',
            color: 'var(--text)',
            border: '1px solid var(--control-border)',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px',
            fontFamily: 'var(--font-mono)',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
          title="Export dashboard"
        >
          <Download size={14} />
          Export
        </button>

        <button
          onClick={handleImportClick}
          style={{
            padding: '6px 12px',
            background: 'var(--control-bg)',
            color: 'var(--text)',
            border: '1px solid var(--control-border)',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px',
            fontFamily: 'var(--font-mono)',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
          title="Import dashboard"
        >
          <Upload size={14} />
          Import
        </button>
      </div>

      {/* Right section - Widget actions and settings */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        {selectedWidgetsCount > 0 && (
          <>
            <div style={{
              fontSize: '11px',
              color: 'var(--muted)',
              marginRight: '8px'
            }}>
              {selectedWidgetsCount} selected
            </div>

            <button
              onClick={onDuplicate}
              style={{
                padding: '6px 12px',
                background: 'var(--control-bg)',
                color: 'var(--text)',
                border: '1px solid var(--control-border)',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px',
                fontFamily: 'var(--font-mono)',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
              title="Duplicate selected widgets (Ctrl+D)"
            >
              <Copy size={14} />
              Duplicate
            </button>

            <button
              onClick={onDeleteSelected}
              style={{
                padding: '6px 12px',
                background: 'var(--accent-3)',
                color: 'white',
                border: '1px solid var(--control-border)',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px',
                fontFamily: 'var(--font-mono)',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
              title="Delete selected widgets (Del)"
            >
              <Trash2 size={14} />
              Delete
            </button>
          </>
        )}

        <button
          onClick={onSettings}
          style={{
            padding: '6px 12px',
            background: 'var(--control-bg)',
            color: 'var(--text)',
            border: '1px solid var(--control-border)',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px',
            fontFamily: 'var(--font-mono)',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
          title="Dashboard settings"
        >
          <Settings size={14} />
          Settings
        </button>
      </div>

      {/* Keyboard shortcuts hint */}
      <div style={{
        position: 'absolute',
        bottom: '-20px',
        right: '16px',
        fontSize: '10px',
        color: 'var(--muted)',
        background: 'var(--bg-elev-2)',
        padding: '2px 6px',
        borderRadius: '2px',
        border: '1px solid var(--control-border)'
      }}>
        Ctrl+S Save • Ctrl+N New • Del Delete
      </div>
    </div>
  );
}
