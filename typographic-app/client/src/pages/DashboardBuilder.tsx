import { useEffect, useState, useCallback } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import { Plus } from 'lucide-react';
import DashboardCanvas from '../components/DashboardCanvas';
import DashboardSidebar from '../components/DashboardSidebar';
import DashboardToolbar from '../components/DashboardToolbar';
import {
  Dashboard,
  WidgetConfig,
  DEFAULT_DASHBOARD,
  WIDGET_SIZES,
  WidgetType
} from '../types/dashboard';

const API_BASE: string = (import.meta as any).env?.VITE_API_BASE ?? '/api';

// Types for component state
interface DashboardState {
  dashboard: Dashboard | null;
  isLoading: boolean;
  isSaving: boolean;
  isDirty: boolean;
}

interface SidebarState {
  isOpen: boolean;
  selectedCategory: string;
  searchQuery: string;
}

export default function DashboardBuilder() {
  // Main dashboard state
  const [dashboardState, setDashboardState] = useState<DashboardState>({
    dashboard: null,
    isLoading: false,
    isSaving: false,
    isDirty: false
  });

  // UI state
  const [sidebarState, setSidebarState] = useState<SidebarState>({
    isOpen: true,
    selectedCategory: 'Data',
    searchQuery: ''
  });

  const [showDashboardMenu, setShowDashboardMenu] = useState(false);
  const [dashboardList, setDashboardList] = useState<Dashboard[]>([]);
  const [selectedWidgets, setSelectedWidgets] = useState<Set<string>>(new Set());


  // Initialize with a new dashboard or load existing one
  useEffect(() => {
    loadDashboardList();
    const urlParams = new URLSearchParams(window.location.search);
    const dashboardId = urlParams.get('id');

    if (dashboardId) {
      loadDashboard(dashboardId);
    } else {
      createNewDashboard();
    }
  }, []);

  // Load dashboard list
  const loadDashboardList = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/dashboards`);
      if (response.ok) {
        const dashboards = await response.json();
        setDashboardList(dashboards);
      }
    } catch (error) {
      console.error('Failed to load dashboard list:', error);
    }
  }, []);

  // Create new dashboard
  const createNewDashboard = useCallback(async (name?: string) => {
    const newDashboard = {
      ...DEFAULT_DASHBOARD,
      name: name || 'New Dashboard',
      id: `dash_${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    setDashboardState(prev => ({
      ...prev,
      dashboard: newDashboard,
      isDirty: true
    }));

    setSelectedWidgets(new Set());
  }, []);

  // Load existing dashboard
  const loadDashboard = useCallback(async (id: string) => {
    setDashboardState(prev => ({ ...prev, isLoading: true }));

    try {
      const response = await fetch(`${API_BASE}/dashboards/${id}`);
      if (response.ok) {
        const dashboard = await response.json();
        setDashboardState(prev => ({
          ...prev,
          dashboard,
          isLoading: false,
          isDirty: false
        }));
        setSelectedWidgets(new Set());
      } else {
        throw new Error('Failed to load dashboard');
      }
    } catch (error) {
      console.error('Failed to load dashboard:', error);
      toast.error('Failed to load dashboard');
      setDashboardState(prev => ({ ...prev, isLoading: false }));
      // Fall back to creating new dashboard
      createNewDashboard('Untitled Dashboard');
    }
  }, [createNewDashboard]);

  // Save current dashboard
  const saveDashboard = useCallback(async () => {
    if (!dashboardState.dashboard) return;

    setDashboardState(prev => ({ ...prev, isSaving: true }));

    try {
      const method = dashboardState.dashboard.id.startsWith('dash_') ? 'POST' : 'PUT';
      const url = method === 'POST'
        ? `${API_BASE}/dashboards`
        : `${API_BASE}/dashboards/${dashboardState.dashboard.id}`;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dashboardState.dashboard)
      });

      if (response.ok) {
        const savedDashboard = await response.json();
        setDashboardState(prev => ({
          ...prev,
          dashboard: savedDashboard,
          isSaving: false,
          isDirty: false
        }));
        toast.success('Dashboard saved successfully');
        loadDashboardList(); // Refresh the list
      } else {
        throw new Error('Failed to save dashboard');
      }
    } catch (error) {
      console.error('Failed to save dashboard:', error);
      toast.error('Failed to save dashboard');
      setDashboardState(prev => ({ ...prev, isSaving: false }));
    }
  }, [dashboardState.dashboard, loadDashboardList]);



  // Add widget to dashboard
  const addWidget = useCallback((widgetType: string, position: { x: number; y: number }) => {
    if (!dashboardState.dashboard) return;

    const widgetId = `${widgetType.toLowerCase()}-${Date.now()}`;
    const newWidget: WidgetConfig = {
      id: widgetId,
      type: widgetType as WidgetType,
      title: `${widgetType} Widget`,
      description: '',
      size: 'medium',
      position: {
        x: position.x,
        y: position.y,
        width: WIDGET_SIZES.medium.width,
        height: WIDGET_SIZES.medium.height
      },
      settings: {}
    };

    setDashboardState(prev => ({
      ...prev,
      dashboard: {
        ...prev.dashboard!,
        widgets: [...prev.dashboard!.widgets, newWidget],
        updatedAt: new Date()
      },
      isDirty: true
    }));

    setSelectedWidgets(new Set([widgetId]));
  }, [dashboardState.dashboard]);

  // Update widget
  const updateWidget = useCallback((widgetId: string, updates: Partial<WidgetConfig>) => {
    if (!dashboardState.dashboard) return;

    setDashboardState(prev => ({
      ...prev,
      dashboard: {
        ...prev.dashboard!,
        widgets: prev.dashboard!.widgets.map(widget =>
          widget.id === widgetId ? { ...widget, ...updates } : widget
        ),
        updatedAt: new Date()
      },
      isDirty: true
    }));
  }, [dashboardState.dashboard]);

  // Delete widget
  const deleteWidget = useCallback((widgetId: string) => {
    if (!dashboardState.dashboard) return;

    setDashboardState(prev => ({
      ...prev,
      dashboard: {
        ...prev.dashboard!,
        widgets: prev.dashboard!.widgets.filter(widget => widget.id !== widgetId),
        updatedAt: new Date()
      },
      isDirty: true
    }));

    setSelectedWidgets(prev => {
      const newSet = new Set(prev);
      newSet.delete(widgetId);
      return newSet;
    });
  }, [dashboardState.dashboard]);

  // Duplicate widget
  const duplicateWidget = useCallback((widgetId: string) => {
    if (!dashboardState.dashboard) return;

    const widgetToDuplicate = dashboardState.dashboard.widgets.find(w => w.id === widgetId);
    if (!widgetToDuplicate) return;

    const duplicatedWidget: WidgetConfig = {
      ...widgetToDuplicate,
      id: `${widgetToDuplicate.type.toLowerCase()}-${Date.now()}`,
      title: `${widgetToDuplicate.title} (Copy)`,
      position: {
        ...widgetToDuplicate.position,
        x: widgetToDuplicate.position.x + 20,
        y: widgetToDuplicate.position.y + 20
      }
    };

    setDashboardState(prev => ({
      ...prev,
      dashboard: {
        ...prev.dashboard!,
        widgets: [...prev.dashboard!.widgets, duplicatedWidget],
        updatedAt: new Date()
      },
      isDirty: true
    }));
  }, [dashboardState.dashboard]);

  // Handle widget selection
  const handleWidgetSelect = useCallback((widgetId: string, multiSelect = false) => {
    setSelectedWidgets(prev => {
      const newSet = new Set(prev);
      if (multiSelect) {
        if (newSet.has(widgetId)) {
          newSet.delete(widgetId);
        } else {
          newSet.add(widgetId);
        }
      } else {
        newSet.clear();
        newSet.add(widgetId);
      }
      return newSet;
    });
  }, []);

  // Export dashboard
  const exportDashboard = useCallback(() => {
    if (!dashboardState.dashboard) return;

    const exportData = {
      ...dashboardState.dashboard,
      exportedAt: new Date().toISOString(),
      version: '1.0'
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${dashboardState.dashboard.name.replace(/\s+/g, '_')}_dashboard.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success('Dashboard exported successfully');
  }, [dashboardState.dashboard]);

  // Import dashboard
  const importDashboard = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const dashboardData = JSON.parse(e.target?.result as string);

        // Validate basic structure
        if (!dashboardData.name || !dashboardData.widgets) {
          throw new Error('Invalid dashboard file format');
        }

        // Create new dashboard from imported data
        const importedDashboard = {
          ...dashboardData,
          id: `dash_${Date.now()}`,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        setDashboardState(prev => ({
          ...prev,
          dashboard: importedDashboard,
          isDirty: true
        }));

        toast.success('Dashboard imported successfully');
      } catch (error) {
        console.error('Failed to import dashboard:', error);
        toast.error('Failed to import dashboard: Invalid file format');
      }
    };
    reader.readAsText(file);
  }, []);

  // Auto-save functionality
  useEffect(() => {
    if (!dashboardState.isDirty || !dashboardState.dashboard) return;

    const timer = setTimeout(() => {
      saveDashboard();
    }, 2000); // Auto-save after 2 seconds of inactivity

    return () => clearTimeout(timer);
  }, [dashboardState.isDirty, dashboardState.dashboard, saveDashboard]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case 's':
            event.preventDefault();
            saveDashboard();
            break;
          case 'n':
            event.preventDefault();
            createNewDashboard();
            break;
          case 'd':
            if (selectedWidgets.size > 0) {
              event.preventDefault();
              selectedWidgets.forEach(duplicateWidget);
            }
            break;
          case 'Delete':
          case 'Backspace':
            if (selectedWidgets.size > 0) {
              event.preventDefault();
              selectedWidgets.forEach(deleteWidget);
            }
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [saveDashboard, createNewDashboard, duplicateWidget, deleteWidget, selectedWidgets]);

  if (!dashboardState.dashboard) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100%',
        fontSize: '18px',
        color: 'var(--muted)'
      }}>
        Loading dashboard...
      </div>
    );
  }

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      background: 'var(--bg)',
      position: 'relative'
    }}>
      <ToastContainer
        position="bottom-right"
        autoClose={3000}
        hideProgressBar
        closeButton={false}
        toastClassName="toast-acrylic toast-compact"
        className="toast-container-flow"
      />

      {/* Sidebar */}
      <DashboardSidebar
        isOpen={sidebarState.isOpen}
        onToggle={() => setSidebarState(prev => ({ ...prev, isOpen: !prev.isOpen }))}
        selectedCategory={sidebarState.selectedCategory}
        onCategoryChange={(category) => setSidebarState(prev => ({ ...prev, selectedCategory: category }))}
        searchQuery={sidebarState.searchQuery}
        onSearchChange={(query) => setSidebarState(prev => ({ ...prev, searchQuery: query }))}
        onWidgetAdd={addWidget}
        dashboard={dashboardState.dashboard}
      />

      {/* Main content */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Toolbar */}
        <DashboardToolbar
          dashboard={dashboardState.dashboard}
          isSaving={dashboardState.isSaving}
          isDirty={dashboardState.isDirty}
          selectedWidgetsCount={selectedWidgets.size}
          onSave={saveDashboard}
          onNew={createNewDashboard}
          onExport={exportDashboard}
          onImport={importDashboard}
          onDuplicate={() => selectedWidgets.forEach(duplicateWidget)}
          onDeleteSelected={() => selectedWidgets.forEach(deleteWidget)}
          onSettings={() => {/* TODO: Implement settings modal */}}
        />

        {/* Canvas area */}
        <div style={{
          flex: 1,
          position: 'relative',
          overflow: 'hidden'
        }}>
          <DashboardCanvas
            dashboard={dashboardState.dashboard}
            selectedWidgets={selectedWidgets}
            onWidgetSelect={handleWidgetSelect}
            onWidgetUpdate={updateWidget}
            onWidgetDelete={deleteWidget}
            onWidgetDuplicate={duplicateWidget}
          />
        </div>
      </div>

      {/* Dashboard menu overlay */}
      {showDashboardMenu && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'var(--bg-elev)',
            border: '1px solid var(--control-border)',
            borderRadius: '8px',
            padding: '20px',
            minWidth: '400px',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <h3 style={{ margin: '0 0 20px 0', color: 'var(--text)' }}>Dashboards</h3>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
              <button
                onClick={() => createNewDashboard()}
                style={{
                  background: 'var(--accent)',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                <Plus size={16} style={{ marginRight: '4px' }} />
                New Dashboard
              </button>
            </div>
            <div style={{ maxHeight: '400px', overflow: 'auto' }}>
              {dashboardList.map(dashboard => (
                <div
                  key={dashboard.id}
                  style={{
                    padding: '12px',
                    border: '1px solid var(--control-border)',
                    borderRadius: '4px',
                    marginBottom: '8px',
                    cursor: 'pointer',
                    background: dashboardState.dashboard?.id === dashboard.id
                      ? 'var(--accent)'
                      : 'var(--bg-elev-2)'
                  }}
                  onClick={() => {
                    loadDashboard(dashboard.id);
                    setShowDashboardMenu(false);
                  }}
                >
                  <div style={{ fontWeight: 'bold', color: 'var(--text)' }}>
                    {dashboard.name}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
                    {dashboard.widgets.length} widgets • Updated {dashboard.updatedAt.toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: '20px', textAlign: 'right' }}>
              <button
                onClick={() => setShowDashboardMenu(false)}
                style={{
                  background: 'var(--control-bg)',
                  color: 'var(--text)',
                  border: '1px solid var(--control-border)',
                  padding: '8px 16px',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
