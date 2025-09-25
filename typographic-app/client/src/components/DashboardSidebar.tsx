import { useMemo } from 'react';
import { Search, X, ChevronRight, ChevronDown, Zap, Database } from 'lucide-react';
import {
  Dashboard,
  WidgetCategory,
  getWidgetsByCategory,
  WIDGET_CATEGORIES,
  WidgetType,
  WidgetLibraryItem
} from '../types/dashboard';

type WidgetLibraryByCategory = Record<string, WidgetLibraryItem[]>;

type WorkflowOutput = {
  id: string;
  nodeId: string;
  label: string;
  summary?: string;
  workflowId: string;
  vertical?: string;
  subtype?: string;
};

interface DashboardSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onWidgetAdd: (widgetType: WidgetType, position: { x: number; y: number }) => void;
  dashboard: Dashboard;
  workflowOutputs: WorkflowOutput[];
  workflowOutputsLoading?: boolean;
}

const SIDEBAR_WIDTH = 340;
const APP_HEADER_HEIGHT = 84;
const TOGGLE_VERTICAL_CENTER = `calc(${APP_HEADER_HEIGHT}px + (100vh - ${APP_HEADER_HEIGHT}px) / 2)`;
export default function DashboardSidebar({
  isOpen,
  onToggle,
  selectedCategory,
  onCategoryChange,
  searchQuery,
  onSearchChange,
  onWidgetAdd,
  dashboard,
  workflowOutputs,
  workflowOutputsLoading
}: DashboardSidebarProps) {
  const widgetsByCategory = useMemo<WidgetLibraryByCategory>(() => {
    const grouped: WidgetLibraryByCategory = {};
    const normalizedSearch = searchQuery.trim().toLowerCase();
    for (const category of WIDGET_CATEGORIES) {
      const catalog = getWidgetsByCategory(category as WidgetCategory);
      const filtered = normalizedSearch
        ? catalog.filter(widget =>
            widget.name.toLowerCase().includes(normalizedSearch) ||
            widget.description.toLowerCase().includes(normalizedSearch) ||
            widget.type.toLowerCase().includes(normalizedSearch)
          )
        : catalog;
      if (filtered.length > 0) {
        grouped[category] = filtered;
      }
    }
    return grouped;
  }, [searchQuery]);

  const handleWidgetClick = (widgetType: WidgetType) => {
    const canvasRect = document.querySelector('.dashboard-canvas')?.getBoundingClientRect();
    const grid = dashboard.settings.gridSize || 48;
    const defaultPosition = { x: 4, y: 3 };
    if (!canvasRect) {
      onWidgetAdd(widgetType, defaultPosition);
      return;
    }
    const centerX = Math.max(0, (canvasRect.width / 2) - grid * 1.5);
    const centerY = Math.max(0, (canvasRect.height / 2) - grid * 1.5);
    onWidgetAdd(widgetType, {
      x: Math.round(centerX / grid),
      y: Math.round(centerY / grid)
    });
  };

  const activeWidgets = widgetsByCategory[selectedCategory] ?? [];
  const hasResults = activeWidgets.length > 0;
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const category of WIDGET_CATEGORIES) {
      counts[category] = widgetsByCategory[category]?.length ?? 0;
    }
    return counts;
  }, [widgetsByCategory]);

  return (
    <>
      <button
        className="sidebar-toggle"
        onClick={onToggle}
        style={{
          position: 'fixed',
          left: isOpen ? `${SIDEBAR_WIDTH}px` : '0',
          top: TOGGLE_VERTICAL_CENTER,
          transform: 'translateY(-50%)',
          width: 28,
          height: 56,
          background: 'var(--bg-elev)',
          border: '1px solid var(--control-border)',
          borderRadius: '0 12px 12px 0',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 180,
          transition: 'left 0.18s ease',
          boxShadow: '0 6px 16px rgba(0,0,0,0.28)'
        }}
        title={isOpen ? 'Collapse library (Ctrl+B)' : 'Expand library (Ctrl+B)'}
      >
        {isOpen ? <ChevronRight size={18} /> : <ChevronDown size={18} />}
      </button>

      <aside
        className="dashboard-sidebar"
        style={{
          position: 'fixed',
          top: APP_HEADER_HEIGHT,
          bottom: 0,
          left: 0,
          width: isOpen ? `${SIDEBAR_WIDTH}px` : '0px',
          background: 'transparent',
          borderRight: isOpen ? '1px solid var(--control-border)' : 'none',
          overflow: 'hidden',
          transition: 'width 0.18s ease',
          zIndex: 170,
          pointerEvents: isOpen ? 'auto' : 'none'
        }}
      >
        <div
          style={{
            width: `${SIDEBAR_WIDTH}px`,
            height: '100%',
            display: 'grid',
            gridTemplateRows: 'auto auto 1fr auto',
            background: 'linear-gradient(180deg, rgba(19,19,22,0.9), rgba(15,15,18,0.94))',
            boxSizing: 'border-box',
            borderRight: '1px solid var(--control-border)',
            boxShadow: '0 18px 44px rgba(0,0,0,0.42)',
            backdropFilter: 'blur(18px) saturate(135%)',
            WebkitBackdropFilter: 'blur(18px) saturate(135%)',
            pointerEvents: 'auto'
          }}
        >
          <header style={{
            padding: '20px 20px 12px 24px',
            borderBottom: '1px solid var(--control-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>Widget Library</div>
              <div style={{ fontSize: 11, color: 'var(--muted)' }}>Curated visualization modules</div>
            </div>
            <button
              onClick={onToggle}
              style={{
                background: 'var(--control-bg)',
                border: '1px solid var(--control-border)',
                borderRadius: 6,
                color: 'var(--text)',
                width: 28,
                height: 28,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="Close sidebar"
            >
              <X size={14} />
            </button>
          </header>

          <div style={{ padding: '12px 24px', borderBottom: '1px solid var(--control-border)', display: 'grid', gap: 14 }}>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{
                position: 'absolute',
                left: 10,
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--muted)'
              }} />
              <input
                type="text"
                placeholder="Search widgets..."
                value={searchQuery}
                onChange={(event) => onSearchChange(event.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 10px 8px 30px',
                  background: 'var(--control-bg)',
                  border: '1px solid var(--control-border)',
                  borderRadius: 6,
                  color: 'var(--text)',
                  fontSize: 12
                }}
              />
            </div>
            <div className="lib-tabs">
              {WIDGET_CATEGORIES.map((category) => {
                const isActive = category === selectedCategory;
                return (
                  <button
                    key={category}
                    className={`lib-tab ${isActive ? 'active' : ''}`}
                    onClick={() => onCategoryChange(category)}
                    title={`${category} widgets`}
                  >
                    <span className="lib-tab-label">{category}</span>
                    <span className="lib-tab-count">{categoryCounts[category] ?? 0}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{
            padding: '16px 20px 20px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            overflow: 'hidden'
          }}>
            {!hasResults ? (
              <div style={{ textAlign: 'center', color: 'var(--muted)', fontSize: 13, padding: 32 }}>
                No widgets found
              </div>
            ) : (
              <div style={{ flex: 1, overflowY: 'auto', paddingRight: 4 }}>
                <div className="rail-list" style={{ marginTop: 0, gap: 14 }}>
                  {activeWidgets.map((widget) => (
                    <button
                      key={widget.id}
                      className="rail-item widget-card"
                      onClick={() => handleWidgetClick(widget.type)}
                      title={widget.description}
                    >
                      <div className="widget-card-main">
                        <span className="widget-card-icon">{widget.icon}</span>
                        <div className="widget-card-copy">
                          <span className="widget-card-title">{widget.name}</span>
                          <span className="widget-card-description">{widget.description}</span>
                        </div>
                      </div>
                      <div className="widget-card-meta">
                        <span className="widget-card-size">{widget.defaultSize}</span>
                        <span className="widget-card-type">
                          <Zap size={12} /> {widget.type}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <footer style={{
            padding: '16px 22px 20px 24px',
            borderTop: '1px solid var(--control-border)',
            display: 'grid',
            gap: 12,
            background: 'rgba(12,12,14,0.82)'
          }}>
            <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Workflow Outputs</div>
            {workflowOutputsLoading ? (
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>Loading outputs...</div>
            ) : workflowOutputs.length === 0 ? (
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                No workflow outputs detected. Configure Output nodes in the Workflow builder to populate live data here.
              </div>
            ) : (
              <div style={{ display: 'grid', gap: 10, maxHeight: 180, overflow: 'auto' }}>
                {workflowOutputs.map(output => (
                  <div key={output.id} style={{
                    border: '1px solid var(--control-border)',
                    borderRadius: 8,
                    padding: 10,
                    background: 'rgba(20,20,24,0.82)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Database size={12} color="var(--accent)" />
                        <span style={{ fontSize: 12, color: 'var(--text)' }}>{output.label}</span>
                      </div>
                      <span style={{ fontSize: 10, color: 'var(--muted)' }}>{output.workflowId}</span>
                    </div>
                    {output.summary && (
                      <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 6 }}>
                        {output.summary}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            <div style={{ fontSize: 11, color: 'var(--muted)' }}>
              Dashboard: {dashboard.name} • Widgets {dashboard.widgets.length}
            </div>
          </footer>
        </div>
      </aside>

      {isOpen && (
        <div
          style={{
            position: 'fixed',
            top: APP_HEADER_HEIGHT,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.42)',
            zIndex: 90,
            display: window.innerWidth <= 900 ? 'block' : 'none'
          }}
          onClick={onToggle}
        />
      )}
    </>
  );
}

