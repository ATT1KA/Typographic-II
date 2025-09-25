import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import {
  Plus,
  Search,
  LayoutDashboard,
  Loader2,
  FolderOpen,
  Copy,
  Trash2,
  Star,
  RefreshCw
} from 'lucide-react';
import DashboardCanvas from '../components/DashboardCanvas';
import DashboardSidebar from '../components/DashboardSidebar';
import DashboardToolbar from '../components/DashboardToolbar';
import WidgetConfigModal from '../components/WidgetConfigModal';
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
  const gridSize = activeDashboard?.settings.gridSize ?? 48;

  const dashboardName = activeDashboard?.name ?? 'Dashboard';
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
              width: WIDGET_SIZES.medium.width,
              height: WIDGET_SIZES.medium.height
            },
            settings: {},
            style: {},
            filters: []
          } as WidgetConfig;
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

  const handleDashboardDuplicate = useCallback(() => {
    if (!activeDashboard) return;
    const duplicate = {
      ...activeDashboard,
      id: generateDashboardId(),
      name: `${activeDashboard.name} Copy`,
      createdAt: new Date(),
      updatedAt: new Date(),
      widgets: activeDashboard.widgets.map(widget => ({
        ...widget,
        id: `${widget.id}-copy-${Date.now()}`
      }))
    };
    setDashboardState({
      dashboard: duplicate,
      isLoading: false,
      isSaving: false,
      isDirty: true,
      isNew: true
    });
    setSelectedWidgets(new Set());
    setWorkflowId(duplicate.metadata?.defaultWorkflowId ?? workflowId);
    toast.success('Dashboard duplicated');
  }, [activeDashboard, workflowId]);

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

  const handleWorkflowChange = useCallback((nextWorkflowId: string) => {
    setWorkflowId(nextWorkflowId);
    updateDashboard((dashboard) => ({
      ...dashboard,
      metadata: {
        ...dashboard.metadata,
        lastViewedWorkflowId: nextWorkflowId
      }
    }));
  }, [updateDashboard]);

  const handleDashboardSettings = useCallback(() => {
    toast.info('Dashboard settings coming soon');
  }, []);

  const renderDashboardMenu = () => {
    if (!menuState.isOpen) return null;
    return (
      <div className="dashboard-menu-overlay" style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0, 0, 0, 0.55)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1400
      }}>
        <div className="dashboard-menu" style={{
          background: 'var(--bg-elev)',
          border: '1px solid var(--control-border)',
          borderRadius: 12,
          padding: 24,
          width: 'min(640px, 86vw)',
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          boxShadow: 'var(--shadow-2)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <LayoutDashboard size={18} color="var(--accent)" />
              <div>
                <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--text)' }}>Dashboards</div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>Manage saved layouts spanning all workflows</div>
              </div>
            </div>
            <button
              onClick={handleDashboardMenuClose}
              style={{
                background: 'var(--control-bg)',
                border: '1px solid var(--control-border)',
                borderRadius: 6,
                padding: '6px 12px',
                fontSize: 12,
                color: 'var(--text)'
              }}
            >
              Close
            </button>
          </div>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <div style={{
              position: 'relative',
              flex: '1 1 220px',
              minWidth: 180
            }}>
              <Search size={14} style={{
                position: 'absolute',
                left: 10,
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--muted)'
              }} />
              <input
                value={menuState.search}
                onChange={(event) => setMenuState(prev => ({ ...prev, search: event.target.value }))}
                placeholder="Search dashboards"
                style={{
                  width: '100%',
                  padding: '8px 8px 8px 30px',
                  background: 'var(--control-bg)',
                  border: '1px solid var(--control-border)',
                  borderRadius: 6,
                  color: 'var(--text)',
                  fontSize: 13
                }}
              />
            </div>
            <button
              onClick={() => createNewDashboard('Untitled Dashboard')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 14px',
                background: 'var(--accent)',
                border: 'none',
                borderRadius: 6,
                color: '#fff',
                fontSize: 13,
                fontFamily: 'var(--font-mono)'
              }}
            >
              <Plus size={14} /> New Dashboard
            </button>
            <button
              onClick={() => loadDashboardList()}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 12px',
                background: 'var(--control-bg)',
                border: '1px solid var(--control-border)',
                borderRadius: 6,
                color: 'var(--text)',
                fontSize: 13
              }}
            >
              <RefreshCw size={14} /> Refresh
            </button>
          </div>

          <div style={{
            flex: 1,
            overflow: 'auto',
            border: '1px solid var(--control-border)',
            borderRadius: 10,
            padding: 6,
            background: 'var(--bg-elev-2)'
          }}>
            {menuState.isLoading ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40, color: 'var(--muted)' }}>
                <Loader2 size={18} className="spin" style={{ marginRight: 8 }} /> Loading dashboards...
              </div>
            ) : filteredSummaries.length === 0 ? (
              <div style={{ padding: 36, textAlign: 'center', color: 'var(--muted)', fontSize: 14 }}>
                No dashboards found. Create a new layout to get started.
              </div>
            ) : (
              <div style={{ display: 'grid', gap: 8 }}>
                {filteredSummaries.map(summary => {
                  const isActive = summary.id === dashboardId;
                  return (
                    <div
                      key={summary.id}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr auto',
                        gap: 12,
                        padding: 14,
                        borderRadius: 10,
                        border: `1px solid ${isActive ? 'var(--accent)' : 'var(--control-border)'}`,
                        background: isActive ? 'rgba(108, 92, 231, 0.12)' : 'rgba(19,19,19,0.75)',
                        cursor: 'pointer',
                        transition: 'border 120ms ease, background 120ms ease'
                      }}
                      onClick={() => handleDashboardSelect(summary.id)}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{
                            width: 26,
                            height: 26,
                            borderRadius: 8,
                            background: summary.metadata?.color ?? 'rgba(108,92,231,0.22)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 14
                          }}>
                            {summary.metadata?.icon ?? '📊'}
                          </div>
                          <div style={{
                            fontWeight: 600,
                            color: 'var(--text)',
                            fontSize: 14
                          }}>
                            {summary.name}
                          </div>
                          {summary.metadata?.favorite && <Star size={14} color="var(--accent)" fill="var(--accent)" />}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6 }}>
                          {summary.widgetCount} widgets • Updated {summary.lastModified.toLocaleString()}
                        </div>
                        {summary.metadata?.tags && summary.metadata.tags.length > 0 && (
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
                            {summary.metadata.tags.map(tag => (
                              <span key={tag} style={{
                                padding: '2px 6px',
                                borderRadius: 999,
                                border: '1px solid var(--control-border)',
                                fontSize: 10,
                                color: 'var(--muted)'
                              }}>{tag}</span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <button
                          onClick={(event) => {
                            event.stopPropagation();
                            handleDashboardSelect(summary.id);
                          }}
                          style={{
                            padding: '6px 10px',
                            background: 'var(--control-bg)',
                            border: '1px solid var(--control-border)',
                            borderRadius: 6,
                            color: 'var(--text)',
                            fontSize: 12
                          }}
                        >
                          Open
                        </button>
                        <button
                          onClick={(event) => {
                            event.stopPropagation();
                            void handleDashboardDelete(summary.id);
                          }}
                          style={{
                            padding: '6px 10px',
                            background: 'rgba(214,48,49,0.18)',
                            border: '1px solid rgba(214,48,49,0.35)',
                            borderRadius: 6,
                            color: '#ff6b6b',
                            fontSize: 12
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
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
    <div className={`dashboard-page ${sidebarState.isOpen ? 'sidebar-open' : 'sidebar-closed'}`} style={{
      height: '100%',
      display: 'flex',
      background: 'radial-gradient(1200px 600px at 80% -10%, rgba(108,92,231,0.08), transparent 40%), radial-gradient(800px 400px at -10% 110%, rgba(0,184,148,0.07), transparent 45%), var(--bg)',
      position: 'relative'
    }}>
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

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        minWidth: 0,
        minHeight: 0,
        position: 'relative'
      }}>
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

        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
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
            <div style={{
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--muted)'
            }}>
              No dashboard selected
      </div>
          )}
          </div>
      </div>

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
    </div>
  );
}
