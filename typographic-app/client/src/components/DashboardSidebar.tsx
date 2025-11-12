import { useMemo } from 'react';
import { Search, X, Zap, Database } from 'lucide-react';
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

function mergeClassNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(' ');
}

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
    <div className={mergeClassNames('rail', 'dashboard-rail', isOpen && 'open')}>
      <div className="rail-backdrop" onClick={onToggle} />
      <div className="rail-inner">
        <div className="rail-handle">
          <button className="rail-toggle" onClick={onToggle} title={isOpen ? 'Collapse library (Ctrl+B)' : 'Expand library (Ctrl+B)'}>
            {isOpen ? '←' : '→'}
          </button>
        </div>
        <aside className="rail-panel dashboard-rail-panel">
          <header className="dashboard-library-header">
            <div>
              <div className="dashboard-library-title">Widget Library</div>
              <div className="dashboard-library-subtitle">Curated visualization modules</div>
            </div>
            <button className="dashboard-library-close" onClick={onToggle} title="Close sidebar">
              <X size={14} />
            </button>
          </header>

          <div className="dashboard-library-filters">
            <div className="dashboard-search">
              <Search size={14} className="dashboard-search-icon" />
              <input
                type="text"
                placeholder="Search widgets..."
                value={searchQuery}
                onChange={(event) => onSearchChange(event.target.value)}
                className="dashboard-search-input"
              />
            </div>
            <div className="lib-tabs">
              {WIDGET_CATEGORIES.map((category) => {
                const isActive = category === selectedCategory;
                return (
                  <button
                    key={category}
                    className={mergeClassNames('lib-tab', isActive && 'active')}
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

          <div className="dashboard-library-content">
            {!hasResults ? (
              <div className="dashboard-library-empty">No widgets found</div>
            ) : (
              <div className="dashboard-library-list">
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
            )}
          </div>

          <footer className="dashboard-library-footer">
            <div className="dashboard-outputs-heading">Workflow Outputs</div>
            {workflowOutputsLoading ? (
              <div className="dashboard-outputs-loading">Loading outputs...</div>
            ) : workflowOutputs.length === 0 ? (
              <div className="dashboard-outputs-empty">
                No workflow outputs detected. Configure Output nodes in the Workflow builder to populate live data here.
              </div>
            ) : (
              <div className="dashboard-outputs-list">
                {workflowOutputs.map((output) => (
                  <div key={output.id} className="dashboard-output-card">
                    <div className="dashboard-output-header">
                      <div className="dashboard-output-label">
                        <Database size={12} />
                        <span>{output.label}</span>
                      </div>
                      <span className="dashboard-output-id">{output.workflowId}</span>
                    </div>
                    {output.summary && (
                      <div className="dashboard-output-summary">{output.summary}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
            <div className="dashboard-library-meta">
              Dashboard: {dashboard.name} • Widgets {dashboard.widgets.length}
            </div>
          </footer>
        </aside>
      </div>
    </div>
  );
}

