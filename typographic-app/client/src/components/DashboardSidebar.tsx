import { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, Pin, PinOff, Plus, Search } from 'lucide-react';
import {
  Dashboard,
  WidgetCategory,
  WidgetLibraryItem,
  WidgetType,
  WIDGET_CATEGORIES,
  WIDGET_SIZES,
  getWidgetByType,
  getWidgetsByCategory
} from '../types/dashboard';

interface DashboardSidebarProps {
  isOpen: boolean;
  isPinned: boolean;
  onPinToggle: () => void;
  onToggle: () => void;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onWidgetAdd: (widgetType: string, position: { x: number; y: number }) => void;
  dashboard: Dashboard;
}

const CATEGORY_FILTERS = ['All', ...WIDGET_CATEGORIES] as const;

type WidgetLibraryGroup = {
  category: WidgetCategory;
  items: WidgetLibraryItem[];
};

function snapCoordinate(value: number, gridSize: number) {
  return Math.max(0, Math.round(value / gridSize) * gridSize);
}

function computeCanvasCenterPosition(gridSize: number, canvas: DOMRect | null, widgetType: WidgetType) {
  const baseWidth = (WIDGET_SIZES[getWidgetByType(widgetType)?.defaultSize ?? 'medium'].width ?? 2) * gridSize;
  const baseHeight = (WIDGET_SIZES[getWidgetByType(widgetType)?.defaultSize ?? 'medium'].height ?? 1) * gridSize;
  if (!canvas) {
    return { x: 0, y: 0 };
  }
  const x = snapCoordinate(canvas.width / 2 - baseWidth / 2, gridSize);
  const y = snapCoordinate(canvas.height / 3 - baseHeight / 2, gridSize);
  return { x, y };
}

export default function DashboardSidebar({
  isOpen,
  isPinned,
  onPinToggle,
  onToggle,
  selectedCategory,
  onCategoryChange,
  searchQuery,
  onSearchChange,
  onWidgetAdd,
  dashboard
}: DashboardSidebarProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(() => new Set(WIDGET_CATEGORIES));

  const gridSize = dashboard.settings.gridSize ?? 48;

  const filteredGroups = useMemo<WidgetLibraryGroup[]>(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    const categoryFilter = selectedCategory || 'All';

    return WIDGET_CATEGORIES.map(category => {
      const items = getWidgetsByCategory(category as WidgetCategory).filter(widget => {
        const matchesCategory = categoryFilter === 'All' || widget.category === categoryFilter;
        if (!normalizedQuery) return matchesCategory;
        const normalizedName = widget.name.toLowerCase();
        const normalizedDescription = widget.description.toLowerCase();
        const normalizedType = widget.type.toLowerCase();
        return (
          matchesCategory &&
          (normalizedName.includes(normalizedQuery) ||
            normalizedDescription.includes(normalizedQuery) ||
            normalizedType.includes(normalizedQuery))
        );
      });
      return { category: category as WidgetCategory, items };
    }).filter(group => group.items.length > 0);
  }, [searchQuery, selectedCategory]);

  const flatResults = useMemo(() => filteredGroups.flatMap(group => group.items), [filteredGroups]);

  const handleAddWidget = (widgetType: WidgetType) => {
    const canvas = document.querySelector('.dashboard-canvas-surface')?.getBoundingClientRect() ?? null;
    const position = computeCanvasCenterPosition(gridSize, canvas, widgetType);
    onWidgetAdd(widgetType, position);
  };

  const handleWidgetDragStart = (event: React.DragEvent<HTMLDivElement>, widgetType: WidgetType) => {
    event.dataTransfer.setData(
      'application/json',
      JSON.stringify({ type: 'dashboard-widget', widgetType })
    );
    event.dataTransfer.effectAllowed = 'copy';
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  return (
    <>
      <button
        className={`dashboard-sidebar-toggle ${isOpen ? 'open' : ''}`}
        onClick={onToggle}
        title={isOpen ? 'Collapse library' : 'Expand library'}
      >
        <ChevronRight size={16} />
      </button>

      <aside className={`dashboard-sidebar ${isOpen ? 'open' : ''} ${isPinned ? 'pinned' : ''}`}>
        <header className="sidebar-header">
          <div className="sidebar-title-group">
            <h2>Widget Library</h2>
            <p>Compose dashboards with reusable, data-aware widgets.</p>
          </div>
          <div className="sidebar-header-actions">
            <button className="icon-btn" onClick={onPinToggle} title={isPinned ? 'Unpin sidebar' : 'Pin sidebar'}>
              {isPinned ? <Pin size={14} /> : <PinOff size={14} />}
            </button>
            <button className="icon-btn" onClick={onToggle} title="Close library">
              <ChevronRight size={14} />
            </button>
          </div>
        </header>

        <div className="sidebar-search">
          <div className="search-field">
            <Search size={14} />
            <input
              type="search"
              placeholder="Search widgets"
              value={searchQuery}
              onChange={event => onSearchChange(event.target.value)}
            />
          </div>
          <div className="search-meta">
            <span>{flatResults.length} results</span>
            <button
              className="btn-secondary"
              onClick={() => handleAddWidget(flatResults[0]?.type ?? 'metric')}
              disabled={!flatResults.length}
            >
              <Plus size={12} /> Quick add
            </button>
          </div>
        </div>

        <div className="sidebar-filters">
          {CATEGORY_FILTERS.map(category => (
            <button
              key={category}
              className={`filter-chip ${selectedCategory === category ? 'active' : ''}`}
              onClick={() => onCategoryChange(category)}
            >
              {category}
            </button>
          ))}
        </div>

        <div className="sidebar-groups">
          {filteredGroups.map(group => (
            <div key={group.category} className="sidebar-group">
              <button className="group-toggle" onClick={() => toggleCategory(group.category)}>
                <span className="group-icon">{getWidgetByType(group.items[0]?.type)?.icon ?? '📦'}</span>
                <span className="group-name">{group.category}</span>
                <span className="group-count">{group.items.length}</span>
                <span className="group-chevron">
                  {expandedCategories.has(group.category) ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </span>
              </button>
              {expandedCategories.has(group.category) && (
                <div className="group-items">
                  {group.items.map(widget => (
                    <div
                      key={widget.id}
                      className="widget-card"
                      draggable
                      onDragStart={event => handleWidgetDragStart(event, widget.type)}
                      onClick={() => handleAddWidget(widget.type)}
                    >
                      <div className="widget-card-header">
                        <span className="widget-icon">{widget.icon}</span>
                        <div className="widget-meta">
                          <span className="widget-name">{widget.name}</span>
                          <span className="widget-description">{widget.description}</span>
                        </div>
                        <button
                          className="widget-add"
                          onClick={event => {
                            event.stopPropagation();
                            handleAddWidget(widget.type);
                          }}
                          title="Add widget"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                      <div className="widget-tags">
                        <span className="tag">{widget.category}</span>
                        <span className="tag">{widget.defaultSize}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {!filteredGroups.length && (
            <div className="sidebar-empty">
              <p>No widgets match this search.</p>
            </div>
          )}
        </div>

        <footer className="sidebar-footer">
          <div>
            <span className="footer-label">Dashboard</span>
            <strong>{dashboard.name}</strong>
          </div>
          <div className="footer-meta">
            <span>{dashboard.widgets.length} widgets</span>
            <span>{gridSize}px grid</span>
          </div>
        </footer>
      </aside>
    </>
  );
}
