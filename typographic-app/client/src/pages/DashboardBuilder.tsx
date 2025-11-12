import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import {
  Plus,
  Search,
  LayoutDashboard,
  Loader2,
  Star,
  RefreshCw
} from 'lucide-react';
import DashboardCanvas from '../components/DashboardCanvas';
import DashboardSidebar from '../components/DashboardSidebar';
import DashboardToolbar from '../components/DashboardToolbar';
import WidgetConfigModal from '../components/WidgetConfigModal';
import BuilderShell from '../components/BuilderShell';
import {
  Dashboard,
  DashboardSummary,
  WidgetConfig,
  DEFAULT_DASHBOARD,
  WIDGET_SIZES,
  WidgetType,
  parseDashboard,
  parseDashboardSummary,
  serializeDashboard,
  createWidgetFromLibrary,
  getWidgetByType,
  WidgetLibraryItem
} from '../types/dashboard';

const API_BASE: string = (import.meta as any).env?.VITE_API_BASE ?? '/api';
const DEFAULT_WORKFLOW_ID = 'default';

interface DashboardState {
  dashboard: Dashboard | null;
  isLoading: boolean;
  isSaving: boolean;
  isDirty: boolean;
  isNew: boolean;
}

interface SidebarState {
  isOpen: boolean;
  selectedCategory: string;
  searchQuery: string;
}

interface DashboardMenuState {
  isOpen: boolean;
  search: string;
  isLoading: boolean;
}

type WorkflowOutput = {
  id: string;
  nodeId: string;
  label: string;
  summary?: string;
  workflowId: string;
  vertical?: string;
  subtype?: string;
};

function generateDashboardId() {
  return `dash_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function cloneDefaultDashboard(name?: string): Dashboard {
  const now = new Date();
  return {
    ...DEFAULT_DASHBOARD,
    id: generateDashboardId(),
    name: name ?? 'New Dashboard',
    createdAt: now,
    updatedAt: now,
    metadata: DEFAULT_DASHBOARD.metadata ? { ...DEFAULT_DASHBOARD.metadata } : undefined
  };
}

export default function DashboardBuilder() {
  const [dashboardState, setDashboardState] = useState<DashboardState>({
    dashboard: null,
    isLoading: true,
    isSaving: false,
    isDirty: false,
    isNew: true
  });

  const [dashboardSummaries, setDashboardSummaries] = useState<DashboardSummary[]>([]);
  const [sidebarState, setSidebarState] = useState<SidebarState>({
    isOpen: true,
    selectedCategory: 'Data',
    searchQuery: ''
  });
  const [menuState, setMenuState] = useState<DashboardMenuState>({
    isOpen: false,
    search: '',
    isLoading: false
  });
  const [selectedWidgets, setSelectedWidgets] = useState<Set<string>>(new Set());
  const [isRenaming, setIsRenaming] = useState(false);
  const [workflowId, setWorkflowId] = useState<string>(DEFAULT_WORKFLOW_ID);
  const [workflowOutputs, setWorkflowOutputs] = useState<WorkflowOutput[]>([]);
  const [workflowOutputsLoading, setWorkflowOutputsLoading] = useState<boolean>(false);
  const [widgetConfigTarget, setWidgetConfigTarget] = useState<WidgetConfig | null>(null);

  const activeDashboard = dashboardState.dashboard;
  const dashboardId = activeDashboard?.id ?? ''; 

  const filteredSummaries = useMemo(() => {
    if (!menuState.search.trim()) return dashboardSummaries;
    const query = menuState.search.toLowerCase();
    return dashboardSummaries.filter(summary =>
      summary.name.toLowerCase().includes(query) ||
      (summary.description ?? '').toLowerCase().includes(query) ||
      (summary.metadata?.tags ?? []).some(tag => tag.toLowerCase().includes(query))
    );
  }, [dashboardSummaries, menuState.search]);

  const createNewDashboard = useCallback((name?: string) => {
    const draft = cloneDefaultDashboard(name);
    setDashboardState({
      dashboard: draft,
      isLoading: false,
      isSaving: false,
      isDirty: true,
      isNew: true
    });
    setSelectedWidgets(new Set());
    setWorkflowId(draft.metadata?.defaultWorkflowId ?? DEFAULT_WORKFLOW_ID);
  }, []);

  const loadDashboardList = useCallback(async () => {
    setMenuState(prev => ({ ...prev, isLoading: true }));
    try {
      const response = await fetch(`${API_BASE}/dashboards`);
      if (!response.ok) throw new Error('Failed to load dashboards');
      const payload = await response.json();
      const parsed = Array.isArray(payload)
        ? payload.map((item: any) => parseDashboardSummary(item))
        : [];
      setDashboardSummaries(parsed);
    } catch (error) {
      console.error('Failed to load dashboard list:', error);
      toast.error('Unable to load dashboards');
    } finally {
      setMenuState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  const loadDashboard = useCallback(async (id: string) => {
    setDashboardState(prev => ({ ...prev, isLoading: true }));
    setSelectedWidgets(new Set());
    try {
      const response = await fetch(`${API_BASE}/dashboards/${id}`);
      if (!response.ok) {
        throw new Error('Failed to load dashboard');
      }
      const payload = await response.json();
      const parsed = parseDashboard(payload);
      setDashboardState({
        dashboard: parsed,
        isLoading: false,
        isSaving: false,
        isDirty: false,
        isNew: false
      });
      setWorkflowId(parsed.metadata?.lastViewedWorkflowId ?? parsed.metadata?.defaultWorkflowId ?? DEFAULT_WORKFLOW_ID);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
      toast.error('Failed to load dashboard');
      setDashboardState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  const fetchWorkflowOutputs = useCallback(async (targetWorkflowId: string) => {
    setWorkflowOutputsLoading(true);
    try {
      const response = await fetch(`${API_BASE}/flow/${targetWorkflowId}`);
      if (!response.ok) throw new Error('Failed to load workflow outputs');
      const payload = await response.json();
      const nodes = Array.isArray(payload?.nodes) ? payload.nodes : [];
      const outputs: WorkflowOutput[] = nodes
        .filter((node: any) => {
          const vertical = node?.data?.vertical ?? node?.data?.category;
          return String(vertical).toLowerCase() === 'output';
        })
        .map((node: any) => ({
          id: `${targetWorkflowId}:${node.id}`,
          nodeId: String(node.id),
          label: node?.data?.label ?? node?.data?.title ?? node.id,
          summary: node?.data?.config?.notes ?? node?.data?.subtype,
          workflowId: targetWorkflowId,
          vertical: node?.data?.vertical,
          subtype: node?.data?.subtype
        }));
      setWorkflowOutputs(outputs);
    } catch (error) {
      console.error('Failed to load workflow outputs:', error);
      toast.error('Unable to load workflow outputs');
      setWorkflowOutputs([]);
    } finally {
      setWorkflowOutputsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardList();
    const urlParams = new URLSearchParams(window.location.search);
    const dashboardIdParam = urlParams.get('id');
    if (dashboardIdParam) {
      void loadDashboard(dashboardIdParam);
    } else {
      createNewDashboard('Untitled Dashboard');
    }
  }, [createNewDashboard, loadDashboard, loadDashboardList]);

  useEffect(() => {
    if (!workflowId) return;
    void fetchWorkflowOutputs(workflowId);
  }, [workflowId, fetchWorkflowOutputs]);

  const saveDashboard = useCallback(async (opts?: { silent?: boolean }) => {
    const dashboard = dashboardState.dashboard;
    if (!dashboard) return;
    setDashboardState(prev => ({ ...prev, isSaving: true }));
    try {
      const updated = {
        ...dashboard,
        updatedAt: new Date()
      };
      const method = dashboardState.isNew ? 'POST' : 'PUT';
      const url = dashboardState.isNew
        ? `${API_BASE}/dashboards`
        : `${API_BASE}/dashboards/${dashboard.id}`;
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(serializeDashboard(updated))
      });
      if (!response.ok) throw new Error('Failed to save dashboard');
      const payload = await response.json();
      const parsed = parseDashboard(payload);
      setDashboardState({
        dashboard: parsed,
        isLoading: false,
        isSaving: false,
        isDirty: false,
        isNew: false
      });
      setWorkflowId(parsed.metadata?.lastViewedWorkflowId ?? parsed.metadata?.defaultWorkflowId ?? workflowId);
      if (!opts?.silent) {
        toast.success('Dashboard saved');
      }
      void loadDashboardList();
    } catch (error) {
      console.error('Failed to save dashboard:', error);
      toast.error('Failed to save dashboard');
      setDashboardState(prev => ({ ...prev, isSaving: false }));
    }
  }, [dashboardState.dashboard, dashboardState.isNew, loadDashboardList, workflowId]);

  useEffect(() => {
    if (!dashboardState.dashboard || !dashboardState.isDirty) return;
    const timer = setTimeout(() => {
      void saveDashboard({ silent: true });
    }, 2000);
    return () => clearTimeout(timer);
  }, [dashboardState.dashboard, dashboardState.isDirty, saveDashboard]);

  const updateDashboard = useCallback((updater: (dashboard: Dashboard) => Dashboard) => {
    setDashboardState(prev => {
      if (!prev.dashboard) return prev;
      const nextDashboard = updater(prev.dashboard);
      return {
        ...prev,
        dashboard: nextDashboard,
        isDirty: true
      };
    });
  }, []);

  const handleWidgetSelect = useCallback((widgetId: string, multiSelect = false) => {
    setSelectedWidgets(prev => {
      const next = new Set(prev);
      if (!widgetId) {
        next.clear();
        return next;
      }
      if (multiSelect) {
        if (next.has(widgetId)) {
          next.delete(widgetId);
        } else {
          next.add(widgetId);
        }
      } else {
        next.clear();
        next.add(widgetId);
      }
      return next;
    });
  }, []);

  const handleAddWidget = useCallback((widgetType: WidgetType, position: { x: number; y: number }) => {
    const template = getWidgetByType(widgetType);
    updateDashboard((dashboard) => {
      const widget = template
        ? createWidgetFromLibrary(template as WidgetLibraryItem, position)
        : {
            id: `${widgetType}-${Date.now()}`,
            type: widgetType,
            title: `${widgetType} Widget`,
            size: 'medium',
            position: {
              x: position.x,
              y: position.y,
              width: WIDGET_SIZES.medium.width + 1,
              height: WIDGET_SIZES.medium.height + 1
            },
            settings: {},
            style: {},
            filters: []
          } as WidgetConfig;
      widget.position.width = Math.max(widget.position.width, 2);
      widget.position.height = Math.max(widget.position.height, 2);
      return {
        ...dashboard,
        widgets: [...dashboard.widgets, widget],
        updatedAt: new Date()
      };
    });
  }, [updateDashboard]);

  const handleWidgetUpdate = useCallback((widgetId: string, updates: Partial<WidgetConfig>) => {
    updateDashboard((dashboard) => ({
      ...dashboard,
      widgets: dashboard.widgets.map(widget =>
        widget.id === widgetId ? { ...widget, ...updates, settings: { ...widget.settings, ...(updates.settings ?? {}) } } : widget
      ),
      updatedAt: new Date()
    }));
  }, [updateDashboard]);

  const handleWidgetDelete = useCallback((widgetId: string) => {
    updateDashboard((dashboard) => ({
      ...dashboard,
      widgets: dashboard.widgets.filter(widget => widget.id !== widgetId),
      updatedAt: new Date()
    }));
    setSelectedWidgets(prev => {
      const next = new Set(prev);
      next.delete(widgetId);
      return next;
    });
  }, [updateDashboard]);

  const handleWidgetDuplicate = useCallback((widgetId: string) => {
    updateDashboard((dashboard) => {
      const widget = dashboard.widgets.find(w => w.id === widgetId);
      if (!widget) return dashboard;
      const duplicated: WidgetConfig = {
        ...widget,
        id: `${widget.type}-${Date.now()}`,
        title: `${widget.title} (Copy)`,
        position: {
          ...widget.position,
          x: widget.position.x + 2,
          y: widget.position.y + 2
        }
      };
      return {
        ...dashboard,
        widgets: [...dashboard.widgets, duplicated],
        updatedAt: new Date()
      };
    });
  }, [updateDashboard]);

  const handleWidgetConfigure = useCallback((widgetId: string) => {
    if (!dashboardState.dashboard) return;
    const widget = dashboardState.dashboard.widgets.find(w => w.id === widgetId);
    if (!widget) return;
    setWidgetConfigTarget(widget);
  }, [dashboardState.dashboard]);

  const handleWidgetConfigSave = useCallback((widgetId: string, updates: Partial<WidgetConfig>) => {
    handleWidgetUpdate(widgetId, updates);
    setWidgetConfigTarget(null);
  }, [handleWidgetUpdate]);

  const handleWidgetConfigClose = useCallback(() => {
    setWidgetConfigTarget(null);
  }, []);

  const handleDashboardRename = useCallback((name: string) => {
    updateDashboard((dashboard) => ({
      ...dashboard,
      name,
      updatedAt: new Date()
    }));
  }, [updateDashboard]);

  const handleDashboardMetadataToggleFavorite = useCallback(() => {
    updateDashboard((dashboard) => ({
      ...dashboard,
      metadata: {
        ...dashboard.metadata,
        favorite: !dashboard.metadata?.favorite
      },
      updatedAt: new Date()
    }));
  }, [updateDashboard]);

  const handleDashboardDelete = useCallback(async (id: string) => {
    try {
      const response = await fetch(`${API_BASE}/dashboards/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete dashboard');
      toast.success('Dashboard deleted');
      void loadDashboardList();
      if (dashboardId === id) {
        createNewDashboard('Untitled Dashboard');
      }
    } catch (error) {
      console.error('Failed to delete dashboard:', error);
      toast.error('Failed to delete dashboard');
    }
  }, [dashboardId, createNewDashboard, loadDashboardList]);

  // Duplicate dashboard feature reserved for future use

  const handleDashboardMenuOpen = useCallback(() => {
    setMenuState(prev => ({ ...prev, isOpen: true }));
  }, []);

  const handleDashboardMenuClose = useCallback(() => {
    setMenuState(prev => ({ ...prev, isOpen: false, search: '' }));
  }, []);

  const handleDashboardSelect = useCallback((id: string) => {
    void loadDashboard(id);
    setMenuState(prev => ({ ...prev, isOpen: false }));
  }, [loadDashboard]);

  // (reserved) workflow change handler not used yet

  const handleDashboardSettings = useCallback(() => {
    toast.info('Dashboard settings coming soon');
  }, []);

  const renderDashboardMenu = () => {
    if (!menuState.isOpen) return null;
    return (
      <div className="dashboard-menu-overlay" onClick={handleDashboardMenuClose}>
        <div className="dashboard-menu" onClick={(event) => event.stopPropagation()}>
          <div className="dashboard-menu-header">
            <div className="dashboard-menu-lead">
              <span className="dashboard-menu-icon">
                <LayoutDashboard size={18} />
              </span>
              <div className="dashboard-menu-copy">
                <h2 className="dashboard-menu-title">Dashboards</h2>
                <p className="dashboard-menu-subtitle">Manage saved layouts spanning all workflows</p>
              </div>
            </div>
            <button
              type="button"
              className="btn-secondary dashboard-menu-close"
              onClick={handleDashboardMenuClose}
            >
              Close
            </button>
          </div>

          <div className="dashboard-menu-toolbar">
            <div className="dashboard-menu-search">
              <Search size={14} className="dashboard-menu-search-icon" />
              <input
                className="dashboard-menu-search-input"
                value={menuState.search}
                onChange={(event) => setMenuState(prev => ({ ...prev, search: event.target.value }))}
                placeholder="Search dashboards"
              />
            </div>
            <div className="dashboard-menu-toolbar-actions">
              <button
                type="button"
                className="btn-primary dashboard-menu-action"
                onClick={() => createNewDashboard('Untitled Dashboard')}
              >
                <Plus size={14} /> New Dashboard
              </button>
              <button
                type="button"
                className="btn-secondary dashboard-menu-action"
                onClick={() => void loadDashboardList()}
              >
                <RefreshCw size={14} /> Refresh
              </button>
            </div>
          </div>

          <div className="dashboard-menu-results">
            {menuState.isLoading ? (
              <div className="dashboard-menu-loading">
                <Loader2 size={18} className="spin" />
                <span>Loading dashboards...</span>
              </div>
            ) : filteredSummaries.length === 0 ? (
              <div className="dashboard-menu-empty">
                No dashboards found. Create a new layout to get started.
              </div>
            ) : (
              <ul className="dashboard-menu-list">
                {filteredSummaries.map(summary => {
                  const isActive = summary.id === dashboardId;
                  return (
                    <li
                      key={summary.id}
                      className={`dashboard-menu-item${isActive ? ' active' : ''}`}
                      onClick={() => handleDashboardSelect(summary.id)}
                    >
                      <div className="dashboard-menu-item-main">
                        <div className="dashboard-menu-item-header">
                          <span
                            className="dashboard-menu-item-avatar"
                            style={{ background: summary.metadata?.color ?? 'rgba(108,92,231,0.22)' }}
                          >
                            {summary.metadata?.icon ?? '📊'}
                          </span>
                          <div className="dashboard-menu-item-copy">
                            <div className="dashboard-menu-item-title">
                              <span className="dashboard-menu-item-name">{summary.name}</span>
                              {summary.metadata?.favorite && (
                                <Star size={14} className="dashboard-menu-item-favorite" />
                              )}
                            </div>
                            <div className="dashboard-menu-item-meta">
                              {summary.widgetCount} widgets • Updated {summary.lastModified.toLocaleString()}
                            </div>
                            {summary.metadata?.tags && summary.metadata.tags.length > 0 && (
                              <div className="dashboard-menu-item-tags">
                                {summary.metadata.tags.map(tag => (
                                  <span key={tag} className="dashboard-menu-tag">
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                        {summary.description && (
                          <p className="dashboard-menu-item-description">{summary.description}</p>
                        )}
                      </div>
                      <div className="dashboard-menu-item-actions">
                        <button
                          type="button"
                          className="btn-secondary dashboard-menu-action"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleDashboardSelect(summary.id);
                          }}
                        >
                          Open
                        </button>
                        <button
                          type="button"
                          className="btn-secondary dashboard-menu-action dashboard-menu-action-danger"
                          onClick={(event) => {
                            event.stopPropagation();
                            void handleDashboardDelete(summary.id);
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (dashboardState.isLoading && !activeDashboard) {
    return (
      <div style={{
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: 12,
        color: 'var(--muted)'
      }}>
        <Loader2 size={18} className="spin" /> Loading dashboard...
      </div>
    );
  }

  return (
    <BuilderShell
      className="dashboard-page"
      mainClassName="dashboard-main"
      overlays={(
        <>
          <ToastContainer
            position="bottom-right"
            autoClose={2800}
            hideProgressBar
            closeButton={false}
            toastClassName="toast-acrylic toast-compact"
            className="toast-container-dashboard"
          />
          <DashboardSidebar
            isOpen={sidebarState.isOpen}
            onToggle={() => setSidebarState(prev => ({ ...prev, isOpen: !prev.isOpen }))}
            selectedCategory={sidebarState.selectedCategory}
            onCategoryChange={(category) => setSidebarState(prev => ({ ...prev, selectedCategory: category }))}
            searchQuery={sidebarState.searchQuery}
            onSearchChange={(query) => setSidebarState(prev => ({ ...prev, searchQuery: query }))}
            onWidgetAdd={handleAddWidget}
            dashboard={activeDashboard ?? cloneDefaultDashboard('Preview')}
            workflowOutputs={workflowOutputs}
            workflowOutputsLoading={workflowOutputsLoading}
          />
          {renderDashboardMenu()}
          {widgetConfigTarget && activeDashboard && (
            <WidgetConfigModal
              widget={widgetConfigTarget}
              isOpen={Boolean(widgetConfigTarget)}
              onClose={handleWidgetConfigClose}
              onSave={handleWidgetConfigSave}
              availableOutputs={workflowOutputs}
              workflowId={workflowId}
            />
          )}
        </>
      )}
    >
      {activeDashboard && (
        <DashboardToolbar
          dashboard={activeDashboard}
          isSaving={dashboardState.isSaving}
          isDirty={dashboardState.isDirty}
          selectedWidgetsCount={selectedWidgets.size}
          onSave={() => saveDashboard()}
          onNew={() => createNewDashboard('Untitled Dashboard')}
          onExport={() => toast.info('Export coming soon')}
          onImport={(event) => toast.info(`Import not yet implemented (${event.type})`)}
          onDuplicate={() => selectedWidgets.forEach(handleWidgetDuplicate)}
          onDeleteSelected={() => selectedWidgets.forEach(handleWidgetDelete)}
          onSettings={handleDashboardSettings}
          onOpenMenu={handleDashboardMenuOpen}
          isRenaming={isRenaming}
          onRenameToggle={() => setIsRenaming(value => !value)}
          onRename={handleDashboardRename}
          onToggleFavorite={handleDashboardMetadataToggleFavorite}
          favorite={Boolean(activeDashboard.metadata?.favorite)}
          workflowId={workflowId}
        />
      )}

      <div className="dashboard-canvas-shell">
        {activeDashboard ? (
          <DashboardCanvas
            dashboard={activeDashboard}
            selectedWidgets={selectedWidgets}
            onWidgetSelect={handleWidgetSelect}
            onWidgetUpdate={handleWidgetUpdate}
            onWidgetDelete={handleWidgetDelete}
            onWidgetDuplicate={handleWidgetDuplicate}
            onWidgetConfigure={handleWidgetConfigure}
          />
        ) : (
          <div className="dashboard-empty-state">
            No dashboard selected
          </div>
        )}
      </div>
    </BuilderShell>
  );
}
