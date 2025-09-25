import { Router } from 'express';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Dashboard and Widget types
interface Dashboard {
  id: string;
  name: string;
  description?: string;
  layout: 'grid' | 'masonry' | 'flexbox';
  widgets: WidgetConfig[];
  settings: {
    backgroundColor?: string;
    backgroundImage?: string;
    gridSize?: number;
    gap?: number;
    theme?: 'dark' | 'light' | 'auto';
    refreshInterval?: number;
    density?: 'comfortable' | 'compact' | 'cozy';
    showGrid?: boolean;
    snapToGrid?: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  metadata?: DashboardMetadata;
}

interface WidgetFilter {
  id?: string;
  label?: string;
  field: string;
  operator: string;
  value: unknown;
  enabled?: boolean;
}

interface WidgetConfig {
  id: string;
  type: string;
  title: string;
  description?: string;
  size: 'small' | 'medium' | 'large' | 'xlarge';
  position: { x: number; y: number; width: number; height: number };
  dataSource?: {
    workflowId: string;
    nodeId: string;
    outputType: 'data' | 'meta';
    endpoint?: string;
    refreshInterval?: number;
  };
  refreshInterval?: number;
  settings: Record<string, any>;
  style?: {
    backgroundColor?: string;
    borderColor?: string;
    textColor?: string;
    borderRadius?: number;
    opacity?: number;
    elevation?: number;
    accentColor?: string;
  };
  visual?: {
    type?: string;
    variant?: string;
    palette?: string;
    options?: Record<string, any>;
  };
  filters?: WidgetFilter[];
}

interface WorkflowConnection {
  dashboardId: string;
  workflowId: string;
  nodeId: string;
  widgetId: string;
  connectionType: 'data' | 'meta';
  lastSync?: Date;
  status: 'active' | 'inactive' | 'error';
}

interface DashboardSummary {
  id: string;
  name: string;
  description?: string;
  widgetCount: number;
  lastModified: Date;
  createdAt: Date;
  connectedWorkflows: string[];
  metadata?: DashboardMetadata;
}

interface DashboardMetadata {
  icon?: string;
  color?: string;
  tags?: string[];
  owner?: string;
  defaultWorkflowId?: string;
  lastViewedWorkflowId?: string;
}

import * as z from 'zod';

// Validation schemas
const DashboardSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  layout: z.enum(['grid', 'masonry', 'flexbox']).default('grid'),
  widgets: z.array(z.any()).default([]),
  settings: z.object({
    backgroundColor: z.string().optional(),
    backgroundImage: z.string().optional(),
    gridSize: z.number().min(12).max(100).optional(),
    gap: z.number().min(0).max(50).optional(),
    theme: z.enum(['dark', 'light', 'auto']).optional(),
    refreshInterval: z.number().min(10).max(3600).optional(),
    density: z.enum(['comfortable', 'compact', 'cozy']).optional(),
    showGrid: z.boolean().optional(),
    snapToGrid: z.boolean().optional()
  }).default({}),
  createdAt: z.union([z.string(), z.date()]).optional(),
  updatedAt: z.union([z.string(), z.date()]).optional(),
  createdBy: z.string().optional(),
  metadata: z.object({
    icon: z.string().optional(),
    color: z.string().optional(),
    tags: z.array(z.string()).optional(),
    owner: z.string().optional(),
    defaultWorkflowId: z.string().optional(),
    lastViewedWorkflowId: z.string().optional()
  }).optional()
}).passthrough();

const WidgetSchema = z.object({
  id: z.string(),
  type: z.string(),
  title: z.string(),
  description: z.string().optional(),
  size: z.enum(['small', 'medium', 'large', 'xlarge']),
  position: z.object({
    x: z.number(),
    y: z.number(),
    width: z.number(),
    height: z.number()
  }),
  dataSource: z.object({
    workflowId: z.string(),
    nodeId: z.string(),
    outputType: z.enum(['data', 'meta']),
    endpoint: z.string().optional(),
    refreshInterval: z.number().optional()
  }).optional(),
  refreshInterval: z.number().optional(),
  settings: z.record(z.string(), z.any()).default({}),
  style: z.object({
    backgroundColor: z.string().optional(),
    borderColor: z.string().optional(),
    textColor: z.string().optional(),
    borderRadius: z.number().optional(),
    opacity: z.number().optional(),
    elevation: z.number().optional(),
    accentColor: z.string().optional()
  }).optional(),
  visual: z.object({
    type: z.string().optional(),
    variant: z.string().optional(),
    palette: z.string().optional(),
    options: z.record(z.string(), z.any()).optional()
  }).optional(),
  filters: z.array(z.object({
    id: z.string().optional(),
    label: z.string().optional(),
    field: z.string(),
    operator: z.string(),
    value: z.any(),
    enabled: z.boolean().optional()
  })).optional()
}).passthrough();

const ConnectionSchema = z.object({
  dashboardId: z.string(),
  workflowId: z.string(),
  nodeId: z.string(),
  widgetId: z.string(),
  connectionType: z.enum(['data', 'meta'])
});

// In-memory storage (can be replaced with database)
const dashboards = new Map<string, Dashboard>();
const connections = new Map<string, WorkflowConnection>();
const dataDirectory = path.join(__dirname, '../../data/dashboards');

// Ensure data directory exists
async function ensureDataDirectory() {
  try {
    await fs.access(dataDirectory);
  } catch {
    await fs.mkdir(dataDirectory, { recursive: true });
  }
}

// Helper functions
function generateId(): string {
  return `dash_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function toDate(value?: string | Date): Date {
  if (!value) return new Date();
  if (value instanceof Date) return value;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

function normalizeWidget(raw: any): WidgetConfig {
  const widget = WidgetSchema.parse(raw);
  return {
    ...widget,
    position: {
      x: Number(widget.position?.x ?? 0),
      y: Number(widget.position?.y ?? 0),
      width: Number(widget.position?.width ?? 2),
      height: Number(widget.position?.height ?? 2)
    },
    settings: widget.settings ?? {},
    filters: widget.filters
      ? widget.filters.map(filter => ({
          ...filter,
          value: filter.value ?? null
        }))
      : [],
    style: widget.style ?? {},
    visual: widget.visual ?? undefined,
    dataSource: widget.dataSource ? {
      ...widget.dataSource,
      refreshInterval: widget.dataSource.refreshInterval ?? undefined
    } : undefined
  };
}

function ensureMetadata(meta?: DashboardMetadata): DashboardMetadata {
  return {
    icon: meta?.icon,
    color: meta?.color,
    tags: Array.isArray(meta?.tags) ? meta!.tags : [],
    owner: meta?.owner,
    defaultWorkflowId: meta?.defaultWorkflowId ?? 'default',
    lastViewedWorkflowId: meta?.lastViewedWorkflowId ?? meta?.defaultWorkflowId ?? 'default'
  };
}

function ensureSettings(settings?: Dashboard['settings']): Dashboard['settings'] {
  return {
    backgroundColor: settings?.backgroundColor ?? '#1b1b1b',
    backgroundImage: settings?.backgroundImage,
    gridSize: settings?.gridSize ?? 48,
    gap: settings?.gap ?? 12,
    theme: settings?.theme ?? 'dark',
    refreshInterval: settings?.refreshInterval ?? 60,
    density: settings?.density ?? 'comfortable',
    showGrid: settings?.showGrid ?? true,
    snapToGrid: settings?.snapToGrid ?? true
  };
}

function normalizeDashboard(raw: any): Dashboard {
  const parsed = DashboardSchema.parse(raw);
  const widgets = Array.isArray(parsed.widgets)
    ? parsed.widgets.map(normalizeWidget)
    : [];

  return {
    id: parsed.id ?? generateId(),
    name: parsed.name,
    description: parsed.description,
    layout: parsed.layout ?? 'grid',
    widgets,
    settings: ensureSettings(parsed.settings),
    createdAt: toDate(parsed.createdAt),
    updatedAt: toDate(parsed.updatedAt),
    createdBy: parsed.createdBy,
    metadata: ensureMetadata(parsed.metadata)
  };
}

type DashboardRecord = Omit<Dashboard, 'createdAt' | 'updatedAt'> & {
  createdAt: string;
  updatedAt: string;
};

type DashboardSummaryRecord = {
  id: string;
  name: string;
  description?: string;
  widgetCount: number;
  lastModified: string;
  createdAt: string;
  connectedWorkflows: string[];
  metadata?: DashboardMetadata;
};

function serializeDashboard(dashboard: Dashboard): DashboardRecord {
  return {
    ...dashboard,
    widgets: dashboard.widgets.map((widget) => ({
      ...widget,
      filters: widget.filters ?? [],
      settings: widget.settings ?? {},
      style: widget.style ?? {},
      position: { ...widget.position }
    })),
    settings: { ...dashboard.settings },
    metadata: dashboard.metadata ? { ...dashboard.metadata, tags: [...(dashboard.metadata.tags ?? [])] } : undefined,
    createdAt: dashboard.createdAt.toISOString(),
    updatedAt: dashboard.updatedAt.toISOString()
  };
}

function serializeSummary(dashboard: Dashboard): DashboardSummaryRecord {
  const summary = getDashboardSummary(dashboard);
  return {
    id: summary.id,
    name: summary.name,
    description: summary.description,
    widgetCount: summary.widgetCount,
    lastModified: summary.lastModified.toISOString(),
    createdAt: summary.createdAt.toISOString(),
    connectedWorkflows: summary.connectedWorkflows,
    metadata: summary.metadata ? { ...summary.metadata, tags: [...(summary.metadata.tags ?? [])] } : undefined
  };
}

function getDashboardSummary(dashboard: Dashboard): DashboardSummary {
  const dashboardConnections = Array.from(connections.values())
    .filter(conn => conn.dashboardId === dashboard.id);

  return {
    id: dashboard.id,
    name: dashboard.name,
    description: dashboard.description,
    widgetCount: dashboard.widgets.length,
    lastModified: dashboard.updatedAt,
    createdAt: dashboard.createdAt,
    connectedWorkflows: [...new Set(dashboardConnections.map(conn => conn.workflowId))],
    metadata: ensureMetadata(dashboard.metadata)
  };
}

async function saveDashboardToFile(dashboard: Dashboard) {
  const filePath = path.join(dataDirectory, `${dashboard.id}.json`);
  await fs.writeFile(filePath, JSON.stringify(serializeDashboard(dashboard), null, 2));
}

async function loadDashboardFromFile(id: string): Promise<Dashboard | undefined> {
  try {
    const filePath = path.join(dataDirectory, `${id}.json`);
    const data = await fs.readFile(filePath, 'utf-8');
    const parsed = JSON.parse(data);
    return normalizeDashboard(parsed);
  } catch {
    return undefined;
  }
}

export const dashboardsRouter = Router();

// Initialize data directory
ensureDataDirectory().catch(console.error);

// GET /api/dashboards - List all dashboards (with summaries)
dashboardsRouter.get('/', async (_req, res) => {
  try {
    const summaries: DashboardSummaryRecord[] = [];

    // Load from memory first
    for (const dashboard of dashboards.values()) {
      summaries.push(serializeSummary(dashboard));
    }

    // Load from files if not in memory
    const files = await fs.readdir(dataDirectory).catch(() => []);
    for (const file of files) {
      if (file.endsWith('.json')) {
        const id = file.replace('.json', '');
        if (!dashboards.has(id)) {
          const dashboard = await loadDashboardFromFile(id);
          if (dashboard) {
            dashboards.set(id, dashboard);
            summaries.push(serializeSummary(dashboard));
          }
        }
      }
    }

    // Sort by last modified
    summaries.sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime());

    res.json(summaries);
  } catch (error) {
    console.error('Error listing dashboards:', error);
    res.status(500).json({ error: 'Failed to list dashboards' });
  }
});

// GET /api/dashboards/:id - Get specific dashboard
dashboardsRouter.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Try memory first
    let dashboard = dashboards.get(id);

    // Try file if not in memory
    if (!dashboard) {
      dashboard = await loadDashboardFromFile(id);
      if (dashboard) {
        dashboards.set(id, dashboard);
      }
    }

    if (!dashboard) {
      return res.status(404).json({ error: 'Dashboard not found' });
    }

    res.json(serializeDashboard(dashboard));
  } catch (error) {
    console.error('Error getting dashboard:', error);
    res.status(500).json({ error: 'Failed to get dashboard' });
  }
});

// POST /api/dashboards - Create new dashboard
dashboardsRouter.post('/', async (req, res) => {
  try {
    const payload = DashboardSchema.parse(req.body);
    const now = new Date();

    const dashboard: Dashboard = normalizeDashboard({
      ...payload,
      id: payload.id ?? generateId(),
      createdAt: now,
      updatedAt: now,
      createdBy: req.headers['user-id'] as string || 'anonymous'
    });

    dashboards.set(dashboard.id, dashboard);
    await saveDashboardToFile(dashboard);

    res.status(201).json(serializeDashboard(dashboard));
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid dashboard data', details: error.issues });
    } else {
      console.error('Error creating dashboard:', error);
      res.status(500).json({ error: 'Failed to create dashboard' });
    }
  }
});

// PUT /api/dashboards/:id - Update dashboard
dashboardsRouter.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const payload = DashboardSchema.parse(req.body);

    let dashboard = dashboards.get(id);
    if (!dashboard) {
      dashboard = await loadDashboardFromFile(id);
      if (!dashboard) {
        return res.status(404).json({ error: 'Dashboard not found' });
      }
    }

    const nextDashboard: Dashboard = normalizeDashboard({
      ...dashboard,
      ...payload,
      id,
      createdAt: dashboard.createdAt,
      updatedAt: new Date()
    });

    dashboards.set(id, nextDashboard);
    await saveDashboardToFile(nextDashboard);

    res.json(serializeDashboard(nextDashboard));
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid dashboard data', details: error.issues });
    } else {
      console.error('Error updating dashboard:', error);
      res.status(500).json({ error: 'Failed to update dashboard' });
    }
  }
});

// DELETE /api/dashboards/:id - Delete dashboard
dashboardsRouter.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!dashboards.has(id)) {
      const dashboard = await loadDashboardFromFile(id);
      if (!dashboard) {
        return res.status(404).json({ error: 'Dashboard not found' });
      }
    }

    // Remove from memory
    dashboards.delete(id);

    // Remove file
    try {
      const filePath = path.join(dataDirectory, `${id}.json`);
      await fs.unlink(filePath);
    } catch {
      // File might not exist, ignore
    }

    // Remove associated connections
    for (const [connId, connection] of connections.entries()) {
      if (connection.dashboardId === id) {
        connections.delete(connId);
      }
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting dashboard:', error);
    res.status(500).json({ error: 'Failed to delete dashboard' });
  }
});

// POST /api/dashboards/:id/connections - Create connection between workflow node and widget
dashboardsRouter.post('/:id/connections', async (req, res) => {
  try {
    const { id } = req.params;
    const connectionData = ConnectionSchema.parse(req.body);

    // Verify dashboard exists
    let dashboard = dashboards.get(id);
    if (!dashboard) {
      dashboard = await loadDashboardFromFile(id);
      if (!dashboard) {
        return res.status(404).json({ error: 'Dashboard not found' });
      }
    }

    // Verify widget exists in dashboard
    const widgetExists = dashboard.widgets.some(w => w.id === connectionData.widgetId);
    if (!widgetExists) {
      return res.status(404).json({ error: 'Widget not found in dashboard' });
    }

    const connectionId = `${connectionData.dashboardId}_${connectionData.widgetId}`;
    const connection: WorkflowConnection = {
      dashboardId: connectionData.dashboardId,
      workflowId: connectionData.workflowId,
      nodeId: connectionData.nodeId,
      widgetId: connectionData.widgetId,
      connectionType: connectionData.connectionType,
      status: 'active',
      lastSync: new Date()
    };

    connections.set(connectionId, connection);

    res.status(201).json(connection);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid connection data', details: error.issues });
    } else {
      console.error('Error creating connection:', error);
      res.status(500).json({ error: 'Failed to create connection' });
    }
  }
});

// GET /api/dashboards/:id/connections - Get connections for dashboard
dashboardsRouter.get('/:id/connections', async (req, res) => {
  try {
    const { id } = req.params;
    const dashboardConnections = Array.from(connections.values())
      .filter(conn => conn.dashboardId === id);

    res.json(dashboardConnections);
  } catch (error) {
    console.error('Error getting connections:', error);
    res.status(500).json({ error: 'Failed to get connections' });
  }
});

// DELETE /api/dashboards/:id/connections/:widgetId - Remove connection
dashboardsRouter.delete('/:id/connections/:widgetId', async (req, res) => {
  try {
    const { id, widgetId } = req.params;
    const connectionId = `${id}_${widgetId}`;

    const connection = connections.get(connectionId);
    if (!connection) {
      return res.status(404).json({ error: 'Connection not found' });
    }

    connections.delete(connectionId);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting connection:', error);
    res.status(500).json({ error: 'Failed to delete connection' });
  }
});

// POST /api/dashboards/:id/widgets - Add widget to dashboard
dashboardsRouter.post('/:id/widgets', async (req, res) => {
  try {
    const { id } = req.params;
    const widgetData = normalizeWidget(req.body);

    let dashboard = dashboards.get(id);
    if (!dashboard) {
      dashboard = await loadDashboardFromFile(id);
      if (!dashboard) {
        return res.status(404).json({ error: 'Dashboard not found' });
      }
    }

    // Check if widget ID already exists
    const existingWidget = dashboard.widgets.find(w => w.id === widgetData.id);
    if (existingWidget) {
      return res.status(409).json({ error: 'Widget with this ID already exists' });
    }

    dashboard.widgets.push(widgetData);
    dashboard.updatedAt = new Date();

    dashboards.set(id, dashboard);
    await saveDashboardToFile(dashboard);

    res.status(201).json(widgetData);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid widget data', details: error.issues });
    } else {
      console.error('Error adding widget:', error);
      res.status(500).json({ error: 'Failed to add widget' });
    }
  }
});

// PUT /api/dashboards/:id/widgets/:widgetId - Update widget
dashboardsRouter.put('/:id/widgets/:widgetId', async (req, res) => {
  try {
    const { id, widgetId } = req.params;
    const widgetData = normalizeWidget(req.body);

    let dashboard = dashboards.get(id);
    if (!dashboard) {
      dashboard = await loadDashboardFromFile(id);
      if (!dashboard) {
        return res.status(404).json({ error: 'Dashboard not found' });
      }
    }

    const widgetIndex = dashboard.widgets.findIndex(w => w.id === widgetId);
    if (widgetIndex === -1) {
      return res.status(404).json({ error: 'Widget not found' });
    }

    dashboard.widgets[widgetIndex] = widgetData;
    dashboard.updatedAt = new Date();

    dashboards.set(id, dashboard);
    await saveDashboardToFile(dashboard);

    res.json(widgetData);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid widget data', details: error.issues });
    } else {
      console.error('Error updating widget:', error);
      res.status(500).json({ error: 'Failed to update widget' });
    }
  }
});

// DELETE /api/dashboards/:id/widgets/:widgetId - Remove widget
dashboardsRouter.delete('/:id/widgets/:widgetId', async (req, res) => {
  try {
    const { id, widgetId } = req.params;

    let dashboard = dashboards.get(id);
    if (!dashboard) {
      dashboard = await loadDashboardFromFile(id);
      if (!dashboard) {
        return res.status(404).json({ error: 'Dashboard not found' });
      }
    }

    const widgetIndex = dashboard.widgets.findIndex(w => w.id === widgetId);
    if (widgetIndex === -1) {
      return res.status(404).json({ error: 'Widget not found' });
    }

    dashboard.widgets.splice(widgetIndex, 1);
    dashboard.updatedAt = new Date();

  dashboards.set(id, dashboard);
    await saveDashboardToFile(dashboard);

    // Remove associated connections
    const connectionId = `${id}_${widgetId}`;
    connections.delete(connectionId);

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting widget:', error);
    res.status(500).json({ error: 'Failed to delete widget' });
  }
});
