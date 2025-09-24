import { useMemo, useRef } from 'react';
import {
  Copy,
  Download,
  Loader2,
  MoreHorizontal,
  Plus,
  Save,
  Settings,
  Trash2,
  Upload
} from 'lucide-react';
import { Dashboard } from '../types/dashboard';

type ToolbarStatus = 'idle' | 'loading' | 'saving';

type DashboardToolbarProps = {
  dashboard: Dashboard;
  status: ToolbarStatus;
  isDirty: boolean;
  selectedWidgetsCount: number;
  onRename: (name: string) => void;
  onSave: () => void;
  onNew: () => void;
  onToggleMenu: () => void;
  onDuplicateDashboard: () => void;
  onDeleteDashboard: () => void;
  onExport: () => void;
  onImport: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onDuplicateWidgets: () => void;
  onDeleteWidgets: () => void;
  onSettings: () => void;
};

export default function DashboardToolbar({
  dashboard,
  status,
  isDirty,
  selectedWidgetsCount,
  onRename,
  onSave,
  onNew,
  onToggleMenu,
  onDuplicateDashboard,
  onDeleteDashboard,
  onExport,
  onImport,
  onDuplicateWidgets,
  onDeleteWidgets,
  onSettings
}: DashboardToolbarProps) {
  const importRef = useRef<HTMLInputElement | null>(null);
  const isSaving = status === 'saving';

  const statusLabel = useMemo(() => {
    if (status === 'loading') return 'Loading…';
    if (status === 'saving') return 'Saving…';
    if (isDirty) return 'Unsaved changes';
    return 'Up to date';
  }, [status, isDirty]);

  const handleImportClick = () => {
    if (!importRef.current) {
      importRef.current = document.createElement('input');
      importRef.current.type = 'file';
      importRef.current.accept = '.json';
      importRef.current.onchange = (event: any) => onImport(event as React.ChangeEvent<HTMLInputElement>);
    }
    importRef.current.value = '';
    importRef.current.click();
  };

  return (
    <header className="dashboard-toolbar">
      <div className="toolbar-main">
        <div className="toolbar-title-group">
          <input
            className="dashboard-name-input"
            value={dashboard.name}
            onChange={event => onRename(event.target.value)}
            placeholder="Untitled dashboard"
          />
          <div className={`dashboard-status ${status}`}>{statusLabel}</div>
        </div>
        <div className="toolbar-primary-actions">
          <button className="btn-primary" onClick={onSave} disabled={isSaving}>
            {isSaving ? <Loader2 size={14} className="spin" /> : <Save size={14} />}
            {isSaving ? 'Saving…' : 'Save'}
          </button>
          <button className="btn-secondary" onClick={onNew}>
            <Plus size={14} />
            New
          </button>
          <button className="btn-secondary" onClick={onToggleMenu}>
            <MoreHorizontal size={14} />
            Dashboards
          </button>
        </div>
      </div>

      <div className="toolbar-secondary">
        <div className="secondary-group">
          <button className="btn-secondary" onClick={onDuplicateDashboard}>
            <Copy size={14} />
            Duplicate
          </button>
          <button className="btn-secondary danger" onClick={onDeleteDashboard}>
            <Trash2 size={14} />
            Delete
          </button>
        </div>
        <div className="secondary-group">
          <button className="btn-secondary" onClick={onExport}>
            <Download size={14} />
            Export
          </button>
          <button className="btn-secondary" onClick={handleImportClick}>
            <Upload size={14} />
            Import
          </button>
        </div>
        <div className="secondary-group">
          {selectedWidgetsCount > 0 && (
            <>
              <button className="btn-secondary" onClick={onDuplicateWidgets}>
                <Copy size={14} />
                Duplicate {selectedWidgetsCount}
              </button>
              <button className="btn-secondary danger" onClick={onDeleteWidgets}>
                <Trash2 size={14} />
                Delete {selectedWidgetsCount}
              </button>
            </>
          )}
          <button className="btn-secondary" onClick={onSettings}>
            <Settings size={14} />
            Settings
          </button>
        </div>
      </div>
    </header>
  );
}
