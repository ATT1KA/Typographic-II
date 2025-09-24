import { useCallback, useEffect, useMemo, useState, type ChangeEvent } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import {
  Copy,
  LayoutGrid,
  Loader2,
  Plus,
  Search,
  SlidersHorizontal,
  Star,
  Trash2,
  X
} from 'lucide-react';
import DashboardCanvas from '../components/DashboardCanvas';
import DashboardSidebar from '../components/DashboardSidebar';
import DashboardToolbar from '../components/DashboardToolbar';
import WidgetConfigModal from '../components/WidgetConfigModal';
import {
  Dashboard,
  WidgetConfig,
  WIDGET_SIZES,
  WidgetType,
  DashboardSummary,
  DashboardConnection,
  DEFAULT_DASHBOARD,
  normalizeDashboard,
  createDashboardDraft,
  serializeDashboard
} from '../types/dashboard';

const API_BASE: string = (import.meta as any).env?.VITE_API_BASE ?? '/api';

const FAVORITE_STORAGE_KEY = 'favoriteDashboards';
const SIDEBAR_PIN_STORAGE_KEY = 'dashboardSidebarPinned';

type DashboardStatus = 'idle' | 'loading' | 'saving';
type MenuSort = 'updated' | 'created' | 'alpha';
type MenuFilter = 'all' | 'favorites';

type ConnectionDraft = {
  workflowId: string;
  nodeId: string;
  outputType: 'data' | 'meta';
  refreshInterval?: number;
};

const FALLBACK_DASHBOARD_ID = 'dash_local_preview';

interface DashboardState {
  activeDashboard: Dashboard | null;
  status: DashboardStatus;
  isDirty: boolean;
}

interface SidebarState {
  isOpen: boolean;
  selectedCategory: string;
  searchQuery: string;
}

interface MenuState {
  open: boolean;
  sort: MenuSort;
  filter: MenuFilter;
  search: string;
}

interface WidgetModalState {
  open: boolean;
  widget: WidgetConfig | null;
}

function formatRelativeTime(iso: string | undefined) {
  if (!iso) return 'Unknown';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return 'Unknown';
  }
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.round(diffMs / 60000);
  if (Math.abs(minutes) < 1) return 'just now';
  if (Math.abs(minutes) < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (Math.abs(days) < 7) return `${days}d ago`;
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
  });
}

function createWidgetInstance(type: WidgetType, position: { x: number; y: number }): WidgetConfig {
  const id = `${type}-${Date.now()}`;
  const baseSize = WIDGET_SIZES.medium;
  return {
    id,
    type,
    title: `${type.charAt(0).toUpperCase() + type.slice(1)} Widget`,
    description: '',
    size: 'medium',
    position: {
      x: position.x,
      y: position.y,
      width: baseSize.width,
      height: baseSize.height
    },
    settings: {},
    style: {
      backgroundColor: DEFAULT_DASHBOARD.settings.backgroundColor,
      borderColor: undefined,
      textColor: undefined,
      borderRadius: 8,
      opacity: 1
    }
  };
}

export default function DashboardBuilder() {
  const [dashboardState, setDashboardState] = useState<DashboardState>({
    activeDashboard: null,
    status: 'idle',
    isDirty: false
  });
  const [sidebarState, setSidebarState] = useState<SidebarState>({
    isOpen: true,
    selectedCategory: 'Data',
    searchQuery: ''
  });
  const [menuState, setMenuState] = useState<MenuState>({
    open: false,
    sort: 'updated',
    filter: 'all',
    search: ''
  });
  const [isSidebarPinned, setIsSidebarPinned] = useState<boolean>(() => {
    const stored = localStorage.getItem(SIDEBAR_PIN_STORAGE_KEY);
    if (stored === null) return true;
    return stored === 'true';
  });
  const [summaries, setSummaries] = useState<DashboardSummary[]>([]);
  const [favorites, setFavorites] = useState<Set<string>>(() => {
    try {
      const raw = JSON.parse(localStorage.getItem(FAVORITE_STORAGE_KEY) ?? '[]');
      if (Array.isArray(raw)) {
        return new Set(raw.filter((value): value is string => typeof value === 'string'));
      }
    } catch {}
    return new Set<string>();
  });
  const [selectedWidgets, setSelectedWidgets] = useState<Set<string>>(new Set());
  const [connections, setConnections] = useState<DashboardConnection[]>([]);
  const [widgetModal, setWidgetModal] = useState<WidgetModalState>({ open: false, widget: null });
  const [connectionDraft, setConnectionDraft] = useState<ConnectionDraft>({
    workflowId: '',
    nodeId: '',
    outputType: 'data',
    refreshInterval: DEFAULT_DASHBOARD.settings.refreshInterval
  });

  const activeDashboard = dashboardState.activeDashboard;
  const selectedWidgetId = useMemo(() => {
    const [first] = Array.from(selectedWidgets);
    return first ?? null;
  }, [selectedWidgets]);
  const activeWidget = useMemo(() => {
    if (!activeDashboard || !selectedWidgetId) return undefined;
    return activeDashboard.widgets.find(widget => widget.id === selectedWidgetId);
  }, [activeDashboard, selectedWidgetId]);
  const activeConnection = useMemo(() => {
    if (!selectedWidgetId) return null;
    return connections.find(connection => connection.widgetId === selectedWidgetId) ?? null;
  }, [connections, selectedWidgetId]);

  const filteredSummaries = useMemo(() => {
    const query = menuState.search.trim().toLowerCase();
    const base = summaries.filter(summary => {
      if (menuState.filter === 'favorites' && !favorites.has(summary.id)) {
        return false;
      }
      if (!query) return true;
      return (
        summary.name.toLowerCase().includes(query) ||
        (summary.description ?? '').toLowerCase().includes(query)
      );
    });

    const sorted = [...base].sort((a, b) => {
      if (menuState.sort === 'alpha') {
        return a.name.localeCompare(b.name);
      }
      const aDate = new Date(menuState.sort === 'created' ? a.createdAt : a.lastModified).getTime();
      const bDate = new Date(menuState.sort === 'created' ? b.createdAt : b.lastModified).getTime();
      return bDate - aDate;
    });

    return sorted;
  }, [summaries, menuState, favorites]);

  const syncDashboardToUrl = useCallback((dashboardId: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set('id', dashboardId);
    window.history.replaceState({}, '', url.toString());
  }, []);

  const loadDashboardSummaries = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/dashboards`);
      if (!response.ok) {
        throw new Error('Failed to fetch dashboards');
      }
      const payload: DashboardSummary[] = await response.json();
      const normalized = payload.map(summary => ({
        ...summary,
        lastModified: summary.lastModified ?? summary.createdAt
      }));
      setSummaries(normalized);
    } catch (error) {
      console.error('Failed to load dashboard summaries', error);
      toast.error('Unable to load dashboards');
    }
  }, []);

  const loadConnections = useCallback(async (dashboardId: string) => {
    try {
      const response = await fetch(`${API_BASE}/dashboards/${dashboardId}/connections`);
      if (!response.ok) {
        throw new Error('Failed to fetch connections');
      }
      const data: DashboardConnection[] = await response.json();
      setConnections(data);
    } catch (error) {
      console.error('Failed to load connections', error);
      setConnections([]);
    }
  }, []);

  const loadDashboard = useCallback(async (id: string, opts?: { silent?: boolean }) => {
    setDashboardState(prev => ({
      ...prev,
      status: opts?.silent ? prev.status : 'loading'
    }));
    try {
      const response = await fetch(`${API_BASE}/dashboards/${id}`);
      if (!response.ok) {
        throw new Error('Failed to load dashboard');
      }
      const payload = await response.json();
      const normalized = normalizeDashboard(payload);
      setDashboardState({
        activeDashboard: normalized,
        status: 'idle',
        isDirty: false
      });
      syncDashboardToUrl(normalized.id);
      setSelectedWidgets(new Set());
      void loadConnections(normalized.id);
    } catch (error) {
      console.error('Failed to load dashboard', error);
      if (!opts?.silent) {
        toast.error('Unable to load dashboard');
      }
      setDashboardState(prev => ({ ...prev, status: 'idle' }));
    }
  }, [loadConnections, syncDashboardToUrl]);

  const createNewDashboard = useCallback((name?: string) => {
    const draft = createDashboardDraft(name ?? 'Untitled Dashboard');
    setDashboardState({
      activeDashboard: draft,
      status: 'idle',
      isDirty: true
    });
    setSelectedWidgets(new Set());
    setConnections([]);
    syncDashboardToUrl(draft.id);
  }, [syncDashboardToUrl]);

  const duplicateDashboard = useCallback(() => {
    if (!activeDashboard) return;
    const duplicate = normalizeDashboard({
      ...activeDashboard,
      id: `dash_local_${Date.now()}`,
      name: `${activeDashboard.name} Copy`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    setDashboardState({ activeDashboard: duplicate, status: 'idle', isDirty: true });
    setSelectedWidgets(new Set());
    setConnections([]);
    syncDashboardToUrl(duplicate.id);
    toast.success('Duplicated dashboard');
  }, [activeDashboard, syncDashboardToUrl]);

  const deleteDashboard = useCallback(async (id?: string) => {
    const targetId = id ?? activeDashboard?.id;
    if (!targetId) return;
    const confirmation = window.confirm('Delete this dashboard? This action cannot be undone.');
    if (!confirmation) return;
    try {
      const response = await fetch(`${API_BASE}/dashboards/${targetId}`, { method: 'DELETE' });
      if (!response.ok) {
        throw new Error('Failed to delete dashboard');
      }
      setSummaries(prev => prev.filter(summary => summary.id !== targetId));
      setFavorites(prev => {
        const next = new Set(prev);
        next.delete(targetId);
        return next;
      });
      if (activeDashboard?.id === targetId) {
        createNewDashboard('Untitled Dashboard');
      }
      toast.success('Dashboard deleted');
    } catch (error) {
      console.error('Failed to delete dashboard', error);
      toast.error('Unable to delete dashboard');
    }
  }, [activeDashboard, createNewDashboard]);

  const saveDashboard = useCallback(async (options?: { showToast?: boolean }) => {
    if (!activeDashboard) return;
    setDashboardState(prev => ({ ...prev, status: 'saving' }));
    try {
      const isNew = activeDashboard.id.startsWith('dash_local_');
      const endpoint = isNew
        ? `${API_BASE}/dashboards`
        : `${API_BASE}/dashboards/${activeDashboard.id}`;
      const response = await fetch(endpoint, {
        method: isNew ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(serializeDashboard(activeDashboard))
      });
      if (!response.ok) {
        throw new Error('Failed to save dashboard');
      }
      const payload = await response.json();
      if (isNew) {
        const newId = (payload as DashboardSummary).id;
        await loadDashboard(newId, { silent: true });
      } else {
        setDashboardState(prev => {
          if (!prev.activeDashboard) return prev;
          return {
            activeDashboard: {
              ...prev.activeDashboard,
              updatedAt: new Date().toISOString()
            },
            status: 'idle',
            isDirty: false
          };
        });
        void loadConnections(activeDashboard.id);
      }
      await loadDashboardSummaries();
      if (options?.showToast !== false) {
        toast.success('Dashboard saved');
      }
    } catch (error) {
      console.error('Failed to save dashboard', error);
      toast.error('Unable to save dashboard');
      setDashboardState(prev => ({ ...prev, status: 'idle' }));
    }
  }, [activeDashboard, loadConnections, loadDashboard, loadDashboardSummaries]);

  const handleRename = useCallback((name: string) => {
    setDashboardState(prev => {
      if (!prev.activeDashboard) return prev;
      const nextName = name.trim() || 'Untitled Dashboard';
      return {
        ...prev,
        activeDashboard: {
          ...prev.activeDashboard,
          name: nextName
        },
        isDirty: true
      };
    });
  }, []);

  const addWidget = useCallback((widgetType: string, position: { x: number; y: number }) => {
    if (!activeDashboard) return;
    const type = widgetType as WidgetType;
    const widget = createWidgetInstance(type, position);
    setDashboardState(prev => {
      if (!prev.activeDashboard) return prev;
      return {
        ...prev,
        activeDashboard: {
          ...prev.activeDashboard,
          widgets: [...prev.activeDashboard.widgets, widget],
          updatedAt: new Date().toISOString()
        },
        isDirty: true
      };
    });
    setSelectedWidgets(new Set([widget.id]));
  }, [activeDashboard]);

  const updateWidget = useCallback((widgetId: string, updates: Partial<WidgetConfig>) => {
    setDashboardState(prev => {
      if (!prev.activeDashboard) return prev;
      const updatedWidgets = prev.activeDashboard.widgets.map(widget => {
        if (widget.id !== widgetId) return widget;
        const nextPosition = updates.position
          ? { ...widget.position, ...updates.position }
          : widget.position;
        return {
          ...widget,
          ...updates,
          position: nextPosition,
          settings: updates.settings ? { ...widget.settings, ...updates.settings } : widget.settings,
          style: updates.style ? { ...widget.style, ...updates.style } : widget.style
        };
      });
      return {
        ...prev,
        activeDashboard: {
          ...prev.activeDashboard,
          widgets: updatedWidgets,
          updatedAt: new Date().toISOString()
        },
        isDirty: true
      };
    });
  }, []);

  const deleteWidget = useCallback((widgetId: string) => {
    setDashboardState(prev => {
      if (!prev.activeDashboard) return prev;
      return {
        ...prev,
        activeDashboard: {
          ...prev.activeDashboard,
          widgets: prev.activeDashboard.widgets.filter(widget => widget.id !== widgetId),
          updatedAt: new Date().toISOString()
        },
        isDirty: true
      };
    });
    setSelectedWidgets(prev => {
      const next = new Set(prev);
      next.delete(widgetId);
      return next;
    });
  }, []);

  const duplicateWidget = useCallback((widgetId: string) => {
    if (!activeDashboard) return;
    const source = activeDashboard.widgets.find(widget => widget.id === widgetId);
    if (!source) return;
    const clone: WidgetConfig = {
      ...source,
      id: `${source.type}-${Date.now()}`,
      title: `${source.title} Copy`,
      position: {
        ...source.position,
        x: source.position.x + 24,
        y: source.position.y + 24
      }
    };
    setDashboardState(prev => {
      if (!prev.activeDashboard) return prev;
      return {
        ...prev,
        activeDashboard: {
          ...prev.activeDashboard,
          widgets: [...prev.activeDashboard.widgets, clone],
          updatedAt: new Date().toISOString()
        },
        isDirty: true
      };
    });
    setSelectedWidgets(new Set([clone.id]));
  }, [activeDashboard]);

  const handleWidgetSelect = useCallback((widgetId: string, multiSelect = false) => {
    if (!widgetId) {
      setSelectedWidgets(new Set());
      return;
    }
    setSelectedWidgets(prev => {
      const next = new Set(prev);
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

  const handleWidgetConfigSave = useCallback((widgetId: string, updates: Partial<WidgetConfig>) => {
    updateWidget(widgetId, updates);
    setWidgetModal({ open: false, widget: null });
  }, [updateWidget]);

  const handleWidgetConfigure = useCallback((widgetId: string) => {
    if (!activeDashboard) return;
    const widget = activeDashboard.widgets.find(item => item.id === widgetId);
    if (!widget) return;
    setWidgetModal({ open: true, widget });
  }, [activeDashboard]);

  const exportDashboard = useCallback(() => {
    if (!activeDashboard) return;
    const payload = {
      ...activeDashboard,
      connections,
      exportedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${activeDashboard.name.replace(/\s+/g, '_')}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    toast.success('Dashboard exported');
  }, [activeDashboard, connections]);

  const importDashboard = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const payload = JSON.parse(String(e.target?.result || '{}'));
        const imported = normalizeDashboard(payload);
        const draft = {
          ...imported,
          id: `dash_local_${Date.now()}`,
          name: imported.name ? `${imported.name} (Imported)` : 'Imported Dashboard',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        setDashboardState({
          activeDashboard: draft,
          status: 'idle',
          isDirty: true
        });
        setConnections(Array.isArray(payload.connections) ? payload.connections : []);
        setSelectedWidgets(new Set());
        toast.success('Dashboard imported. Save to persist.');
        syncDashboardToUrl(draft.id);
      } catch (error) {
        console.error('Failed to import dashboard', error);
        toast.error('Invalid dashboard file');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  }, [syncDashboardToUrl]);

  const handleConnectionDraftChange = useCallback((field: keyof ConnectionDraft, value: string | number) => {
    setConnectionDraft(prev => ({
      ...prev,
      [field]: field === 'refreshInterval' ? Number(value) || undefined : value
    }));
  }, []);

  const applyConnection = useCallback(async () => {
    if (!activeDashboard || !activeWidget) return;
    const workflowId = connectionDraft.workflowId.trim();
    const nodeId = connectionDraft.nodeId.trim();
    if (!workflowId || !nodeId) {
      toast.error('Workflow ID and node ID are required');
      return;
    }
    updateWidget(activeWidget.id, {
      dataSource: {
        workflowId,
        nodeId,
        outputType: connectionDraft.outputType,
        refreshInterval: connectionDraft.refreshInterval
      }
    });
    if (!activeDashboard.id.startsWith('dash_local_')) {
      try {
        const response = await fetch(`${API_BASE}/dashboards/${activeDashboard.id}/connections`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            dashboardId: activeDashboard.id,
            workflowId,
            nodeId,
            widgetId: activeWidget.id,
            connectionType: connectionDraft.outputType
          })
        });
        if (!response.ok) {
          throw new Error('Failed to persist connection');
        }
        const savedConnection: DashboardConnection = await response.json();
        setConnections(prev => {
          const filtered = prev.filter(conn => conn.widgetId !== activeWidget.id);
          return [...filtered, savedConnection];
        });
        toast.success('Connection linked');
      } catch (error) {
        console.error('Failed to persist connection', error);
        toast.error('Unable to save connection');
      }
    } else {
      toast.info('Connection stored locally. Save dashboard to persist.');
    }
  }, [activeDashboard, activeWidget, connectionDraft, updateWidget]);

  const clearConnection = useCallback(async () => {
    if (!activeDashboard || !activeWidget) return;
    updateWidget(activeWidget.id, { dataSource: undefined });
    setConnectionDraft({
      workflowId: '',
      nodeId: '',
      outputType: 'data',
      refreshInterval: activeDashboard.settings.refreshInterval
    });
    if (!activeDashboard.id.startsWith('dash_local_')) {
      try {
        const response = await fetch(`${API_BASE}/dashboards/${activeDashboard.id}/connections/${activeWidget.id}`, {
          method: 'DELETE'
        });
        if (!response.ok) {
          throw new Error('Failed to remove connection');
        }
        setConnections(prev => prev.filter(conn => conn.widgetId !== activeWidget.id));
        toast.success('Connection removed');
      } catch (error) {
        console.error('Failed to remove connection', error);
        toast.error('Unable to remove connection');
      }
    }
  }, [activeDashboard, activeWidget, updateWidget]);

  const toggleFavorite = useCallback((id: string) => {
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const toggleMenu = useCallback(() => {
    setMenuState(prev => ({ ...prev, open: !prev.open }));
    void loadDashboardSummaries();
  }, [loadDashboardSummaries]);

  const handleMenuSearch = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setMenuState(prev => ({ ...prev, search: event.target.value }));
  }, []);

  const handleMenuSortChange = useCallback((sort: MenuSort) => {
    setMenuState(prev => ({ ...prev, sort }));
  }, []);

  const handleMenuFilterChange = useCallback((filter: MenuFilter) => {
    setMenuState(prev => ({ ...prev, filter }));
  }, []);

  const duplicateSelectedWidgets = useCallback(() => {
    selectedWidgets.forEach(id => duplicateWidget(id));
  }, [selectedWidgets, duplicateWidget]);

  const deleteSelectedWidgets = useCallback(() => {
    selectedWidgets.forEach(id => deleteWidget(id));
  }, [selectedWidgets, deleteWidget]);

  useEffect(() => {
    localStorage.setItem(FAVORITE_STORAGE_KEY, JSON.stringify(Array.from(favorites)));
  }, [favorites]);

  useEffect(() => {
    localStorage.setItem(SIDEBAR_PIN_STORAGE_KEY, String(isSidebarPinned));
  }, [isSidebarPinned]);

  useEffect(() => {
    void loadDashboardSummaries();
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    if (id) {
      void loadDashboard(id);
    } else {
      createNewDashboard('New Dashboard');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!activeWidget) {
      setConnectionDraft({
        workflowId: '',
        nodeId: '',
        outputType: 'data',
        refreshInterval: activeDashboard?.settings.refreshInterval
      });
      return;
    }
    setConnectionDraft({
      workflowId: activeWidget.dataSource?.workflowId ?? '',
      nodeId: activeWidget.dataSource?.nodeId ?? '',
      outputType: activeWidget.dataSource?.outputType ?? 'data',
      refreshInterval: activeWidget.dataSource?.refreshInterval ?? activeDashboard?.settings.refreshInterval
    });
  }, [activeWidget, activeDashboard?.settings.refreshInterval]);

  useEffect(() => {
    if (!dashboardState.isDirty || dashboardState.status !== 'idle') return;
    if (!activeDashboard || activeDashboard.id.startsWith('dash_local_')) return;
    const timer = window.setTimeout(() => {
      void saveDashboard({ showToast: false });
    }, 2500);
    return () => window.clearTimeout(timer);
  }, [dashboardState.isDirty, dashboardState.status, activeDashboard, saveDashboard]);

  const renderMenuOverlay = () => {
    if (!menuState.open) return null;
    return (
      <div className="dashboard-menu-overlay" onClick={toggleMenu}>
        <div className="dashboard-menu-panel" onClick={event => event.stopPropagation()}>
          <header className="dashboard-menu-header">
            <div>
              <h2>Dashboards</h2>
              <p>Switch, organize, or curate your dashboards</p>
            </div>
            <button className="icon-btn" onClick={toggleMenu} title="Close">
              <X size={16} />
            </button>
          </header>

          <div className="dashboard-menu-actions">
            <button className="btn-primary" onClick={() => createNewDashboard('Untitled Dashboard')}>
              <Plus size={16} />
              New Dashboard
            </button>
            <button className="btn-secondary" onClick={() => duplicateDashboard()} disabled={!activeDashboard}>
              <Copy size={16} />
              Duplicate Current
            </button>
          </div>

          <div className="dashboard-menu-filters">
            <div className="menu-search">
              <Search size={14} />
              <input
                type="search"
                placeholder="Search dashboards"
                value={menuState.search}
                onChange={handleMenuSearch}
              />
            </div>
            <div className="menu-sort">
              <span className="menu-label">
                <SlidersHorizontal size={14} />
                Sort
              </span>
              {(['updated', 'created', 'alpha'] as MenuSort[]).map(option => (
                <button
                  key={option}
                  className={`menu-chip ${menuState.sort === option ? 'active' : ''}`}
                  onClick={() => handleMenuSortChange(option)}
                >
                  {option === 'updated' ? 'Updated' : option === 'created' ? 'Created' : 'A → Z'}
                </button>
              ))}
            </div>
            <div className="menu-filter">
              <span className="menu-label">View</span>
              {(['all', 'favorites'] as MenuFilter[]).map(option => (
                <button
                  key={option}
                  className={`menu-chip ${menuState.filter === option ? 'active' : ''}`}
                  onClick={() => handleMenuFilterChange(option)}
                >
                  {option === 'all' ? 'All' : 'Favorites'}
                </button>
              ))}
            </div>
          </div>

          <div className="dashboard-menu-list">
            {filteredSummaries.map(summary => {
              const isActive = activeDashboard?.id === summary.id;
              const isFavorite = favorites.has(summary.id);
              return (
                <div key={summary.id} className={`dashboard-menu-item ${isActive ? 'active' : ''}`}>
                  <button className="dashboard-menu-main" onClick={() => void loadDashboard(summary.id)}>
                    <div className="menu-item-header">
                      <span className="menu-item-name">{summary.name}</span>
                      <button
                        className={`favorite-toggle ${isFavorite ? 'favorited' : ''}`}
                        onClick={event => {
                          event.stopPropagation();
                          toggleFavorite(summary.id);
                        }}
                        title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                      >
                        <Star size={14} />
                      </button>
                    </div>
                    <div className="menu-item-meta">
                      <span>{summary.widgetCount} widgets</span>
                      <span>Updated {formatRelativeTime(summary.lastModified)}</span>
                    </div>
                    {summary.connectedWorkflows?.length ? (
                      <div className="menu-item-workflows">
                        {summary.connectedWorkflows.slice(0, 3).map(workflow => (
                          <span key={workflow} className="workflow-chip">{workflow}</span>
                        ))}
                        {summary.connectedWorkflows.length > 3 && <span className="workflow-chip">+{summary.connectedWorkflows.length - 3}</span>}
                      </div>
                    ) : null}
                  </button>
                  <div className="menu-item-actions">
                    <button onClick={() => void loadDashboard(summary.id)} title="Load">
                      <LayoutGrid size={14} />
                    </button>
                    <button onClick={() => duplicateDashboard()} title="Duplicate" disabled={activeDashboard?.id !== summary.id}>
                      <Copy size={14} />
                    </button>
                    <button onClick={() => deleteDashboard(summary.id)} title="Delete" className="danger">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
            {!filteredSummaries.length && (
              <div className="dashboard-menu-empty">No dashboards found</div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderInspector = () => {
    if (!activeWidget) {
      return (
        <div className="dashboard-inspector empty">
          <p>Select a widget to configure data connections and appearance.</p>
        </div>
      );
    }
    return (
      <div className="dashboard-inspector">
        <header>
          <h3>{activeWidget.title}</h3>
          <p>{activeWidget.description || 'Widget configuration'}</p>
        </header>

        <section>
          <h4>Data Connection</h4>
          <div className="form-field">
            <label htmlFor="workflow-id">Workflow ID</label>
            <input
              id="workflow-id"
              value={connectionDraft.workflowId}
              onChange={event => handleConnectionDraftChange('workflowId', event.target.value)}
              placeholder="e.g. risk-monitoring"
            />
          </div>
          <div className="form-field">
            <label htmlFor="node-id">Output Node ID</label>
            <input
              id="node-id"
              value={connectionDraft.nodeId}
              onChange={event => handleConnectionDraftChange('nodeId', event.target.value)}
              placeholder="e.g. portfolio-health"
            />
          </div>
          <div className="form-grid">
            <div className="form-field">
              <label htmlFor="output-type">Output Type</label>
              <select
                id="output-type"
                value={connectionDraft.outputType}
                onChange={event => handleConnectionDraftChange('outputType', event.target.value)}
              >
                <option value="data">Data</option>
                <option value="meta">Meta</option>
              </select>
            </div>
            <div className="form-field">
              <label htmlFor="refresh-interval">Refresh (seconds)</label>
              <input
                id="refresh-interval"
                type="number"
                min={15}
                value={connectionDraft.refreshInterval ?? ''}
                onChange={event => handleConnectionDraftChange('refreshInterval', event.target.value)}
                placeholder="60"
              />
            </div>
          </div>
          <div className="inspector-actions">
            <button className="btn-primary" onClick={() => void applyConnection()}>
              Link Workflow Output
            </button>
            <button className="btn-secondary" onClick={() => void clearConnection()} disabled={!activeWidget.dataSource}>
              Clear Connection
            </button>
          </div>
          {activeConnection && (
            <div className="connection-meta">
              <span>Linked to workflow {activeConnection.workflowId}</span>
              <span>Node {activeConnection.nodeId}</span>
              <span>Status: {activeConnection.status}</span>
            </div>
          )}
        </section>

        <section>
          <h4>Appearance</h4>
          <button className="btn-secondary" onClick={() => handleWidgetConfigure(activeWidget.id)}>
            Open Visual Config
          </button>
        </section>

        <section>
          <h4>Widget Actions</h4>
          <div className="inspector-actions">
            <button className="btn-secondary" onClick={() => duplicateWidget(activeWidget.id)}>
              <Copy size={14} /> Duplicate Widget
            </button>
            <button className="btn-secondary danger" onClick={() => deleteWidget(activeWidget.id)}>
              <Trash2 size={14} /> Remove Widget
            </button>
          </div>
        </section>
      </div>
    );
  };

  return (
    <div className="dashboard-page">
      <ToastContainer
        position="bottom-right"
        autoClose={2500}
        hideProgressBar
        closeButton={false}
        toastClassName="toast-acrylic toast-compact"
        className="toast-container-dashboard"
      />

      {renderMenuOverlay()}

      <DashboardSidebar
        isOpen={sidebarState.isOpen || isSidebarPinned}
        isPinned={isSidebarPinned}
        onPinToggle={() => setIsSidebarPinned(value => !value)}
        onToggle={() => setSidebarState(prev => ({ ...prev, isOpen: !prev.isOpen }))}
        selectedCategory={sidebarState.selectedCategory}
        onCategoryChange={category => setSidebarState(prev => ({ ...prev, selectedCategory: category }))}
        searchQuery={sidebarState.searchQuery}
        onSearchChange={query => setSidebarState(prev => ({ ...prev, searchQuery: query }))}
        onWidgetAdd={addWidget}
        dashboard={activeDashboard ?? DEFAULT_DASHBOARD as Dashboard}
      />

      <main className="dashboard-main">
        <DashboardToolbar
          dashboard={activeDashboard ?? createDashboardDraft('Loading...')}
          status={dashboardState.status}
          isDirty={dashboardState.isDirty}
          selectedWidgetsCount={selectedWidgets.size}
          onRename={handleRename}
          onSave={() => void saveDashboard()}
          onNew={() => createNewDashboard('Untitled Dashboard')}
          onToggleMenu={toggleMenu}
          onDuplicateDashboard={duplicateDashboard}
          onDeleteDashboard={() => void deleteDashboard()}
          onExport={exportDashboard}
          onImport={importDashboard}
          onDuplicateWidgets={duplicateSelectedWidgets}
          onDeleteWidgets={deleteSelectedWidgets}
          onSettings={() => toast.info('Dashboard settings coming soon')}
        />

        <section className="dashboard-workspace">
          <div className="dashboard-canvas-wrapper">
            {dashboardState.status === 'loading' && !activeDashboard ? (
              <div className="dashboard-loading-state">
                <Loader2 size={18} className="spin" /> Loading dashboard...
              </div>
            ) : null}
            {activeDashboard ? (
              <DashboardCanvas
                dashboard={activeDashboard}
                selectedWidgets={selectedWidgets}
                onWidgetSelect={handleWidgetSelect}
                onWidgetUpdate={updateWidget}
                onWidgetDelete={deleteWidget}
                onWidgetDuplicate={duplicateWidget}
                onWidgetConfigure={handleWidgetConfigure}
                onWidgetCreate={addWidget}
              />
            ) : (
              <div className="dashboard-loading-state">
                <Loader2 size={18} className="spin" /> Preparing dashboard...
              </div>
            )}
          </div>
          {renderInspector()}
        </section>
      </main>

      {widgetModal.open && widgetModal.widget && (
        <WidgetConfigModal
          widget={widgetModal.widget}
          isOpen={widgetModal.open}
          onClose={() => setWidgetModal({ open: false, widget: null })}
          onSave={handleWidgetConfigSave}
        />
      )}
    </div>
  );
}
