import {
  Save,
  FolderOpen,
  Plus,
  Trash2,
  Copy,
  Download,
  Upload,
  Settings,
  Layers,
  Star,
  LayoutDashboard,
  Loader2
} from 'lucide-react';
import { Dashboard } from '../types/dashboard';

type DashboardToolbarProps = {
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
  onOpenMenu: () => void;
  isRenaming: boolean;
  onRenameToggle: () => void;
  onRename: (name: string) => void;
  onToggleFavorite: () => void;
  favorite: boolean;
  workflowId: string;
};

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
  onSettings,
  onOpenMenu,
  isRenaming,
  onRenameToggle,
  onRename,
  onToggleFavorite,
  favorite,
  workflowId
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
        height: 68,
        padding: '0 20px',
        display: 'grid',
        gridTemplateColumns: 'auto 1fr auto',
        alignItems: 'center',
        gap: 16,
        background: 'rgba(16,16,18,0.92)',
        borderBottom: '1px solid var(--control-border)',
        boxShadow: '0 12px 24px rgba(0,0,0,0.22)',
        backdropFilter: 'blur(18px)',
        WebkitBackdropFilter: 'blur(18px)',
        zIndex: 120
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <button
          onClick={onOpenMenu}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 38,
            height: 38,
            borderRadius: 12,
            border: '1px solid var(--control-border)',
            background: 'var(--control-bg)',
            color: 'var(--text)'
          }}
          title="Dashboard catalog"
        >
          <LayoutDashboard size={16} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={onToggleFavorite}
            style={{
              width: 32,
              height: 32,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 10,
              border: '1px solid var(--control-border)',
              background: favorite ? 'rgba(108,92,231,0.20)' : 'var(--control-bg)'
            }}
            title={favorite ? 'Unfavorite dashboard' : 'Mark as favorite'}
          >
            <Star size={14} color={favorite ? 'var(--accent)' : 'var(--muted)'} fill={favorite ? 'var(--accent)' : 'transparent'} />
          </button>

          {isRenaming ? (
            <input
              autoFocus
              defaultValue={dashboard.name}
              onBlur={(event) => {
                onRename(event.target.value.trim() || dashboard.name);
                onRenameToggle();
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  onRename((event.target as HTMLInputElement).value.trim() || dashboard.name);
                  onRenameToggle();
                } else if (event.key === 'Escape') {
                  onRenameToggle();
                }
              }}
              style={{
                background: 'rgba(12,12,14,0.62)',
                border: '1px solid var(--control-border)',
                borderRadius: 8,
                padding: '8px 10px',
                color: 'var(--text)',
                fontSize: 14,
                fontFamily: 'var(--font-mono)'
              }}
            />
          ) : (
            <button
              onClick={onRenameToggle}
              title="Rename dashboard"
              style={{
                background: 'none',
                border: 'none',
                fontSize: 18,
                fontWeight: 600,
                color: 'var(--text)',
                cursor: 'text'
              }}
            >
              {dashboard.name}
            </button>
          )}

          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--muted)' }}>
            <Layers size={12} /> {dashboard.widgets.length} widgets
            {isDirty && (
              <span style={{
                padding: '2px 6px',
                borderRadius: 999,
                background: 'rgba(108,92,231,0.18)',
                border: '1px solid rgba(108,92,231,0.35)',
                color: 'var(--accent)',
                fontSize: 10
              }}>
                UNSAVED
              </span>
            )}
            {isSaving && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, color: 'var(--muted)' }}>
                <Loader2 size={12} className="spin" /> Saving
              </span>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridAutoFlow: 'column', alignItems: 'center', gap: 10 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--muted)' }}>
          Linked Workflow
          <span style={{
            padding: '4px 8px',
            borderRadius: 8,
            border: '1px solid var(--control-border)',
            background: 'var(--control-bg)',
            color: 'var(--text)',
            fontFamily: 'var(--font-mono)'
          }}>
            {workflowId || 'default'}
          </span>
        </div>

        <button
          onClick={onSave}
          disabled={isSaving}
          style={{
            padding: '8px 16px',
            background: isSaving ? 'var(--bg-elev-2)' : 'var(--accent)',
            color: isSaving ? 'var(--muted)' : '#fff',
            border: '1px solid var(--control-border)',
            borderRadius: 10,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontFamily: 'var(--font-mono)',
            fontSize: 12
          }}
          title="Save dashboard (Ctrl+S)"
        >
          <Save size={14} /> {isSaving ? 'Saving...' : 'Save'}
        </button>

        <button
          onClick={onNew}
          style={{
            padding: '8px 16px',
            background: 'var(--control-bg)',
            color: 'var(--text)',
            border: '1px solid var(--control-border)',
            borderRadius: 10,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontFamily: 'var(--font-mono)',
            fontSize: 12
          }}
          title="New dashboard (Ctrl+N)"
        >
          <Plus size={14} /> New
        </button>

        <button
          onClick={onSettings}
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            border: '1px solid var(--control-border)',
            background: 'var(--control-bg)',
            color: 'var(--text)'
          }}
          title="Dashboard settings"
        >
          <Settings size={14} />
        </button>
      </div>

      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end' }}>
        {selectedWidgetsCount > 0 && (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <div style={{ fontSize: 11, color: 'var(--muted)' }}>{selectedWidgetsCount} selected</div>
            <button
              onClick={onDuplicate}
              style={{
                padding: '6px 12px',
                background: 'var(--control-bg)',
                border: '1px solid var(--control-border)',
                borderRadius: 10,
                color: 'var(--text)',
                fontSize: 12,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6
              }}
              title="Duplicate selected widgets"
            >
              <Copy size={12} /> Duplicate
            </button>
            <button
              onClick={onDeleteSelected}
              style={{
                padding: '6px 12px',
                background: 'rgba(214,48,49,0.12)',
                border: '1px solid rgba(214,48,49,0.25)',
                borderRadius: 10,
                color: '#ff6b6b',
                fontSize: 12,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6
              }}
              title="Delete selected widgets"
            >
              <Trash2 size={12} /> Delete
            </button>
          </div>
        )}

        <button
          onClick={onOpenMenu}
          style={{
            padding: '6px 12px',
            background: 'var(--control-bg)',
            border: '1px solid var(--control-border)',
            borderRadius: 10,
            color: 'var(--text)',
            fontSize: 12,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6
          }}
          title="Open dashboards menu"
        >
          <FolderOpen size={12} /> Dashboards
        </button>

        <button
          onClick={onExport}
          style={{
            padding: '6px 12px',
            background: 'var(--control-bg)',
            border: '1px solid var(--control-border)',
            borderRadius: 10,
            color: 'var(--text)',
            fontSize: 12,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6
          }}
          title="Export dashboard"
        >
          <Download size={12} /> Export
        </button>

        <button
          onClick={handleImportClick}
          style={{
            padding: '6px 12px',
            background: 'var(--control-bg)',
            border: '1px solid var(--control-border)',
            borderRadius: 10,
            color: 'var(--text)',
            fontSize: 12,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6
          }}
          title="Import dashboard"
        >
          <Upload size={12} /> Import
        </button>
      </div>
    </div>
  );
}
