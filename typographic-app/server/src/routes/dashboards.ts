import { Router } from 'express';
import { z } from 'zod';
import fs from 'fs/promises';
import path from 'path';

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
  };
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
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
  settings: Record<string, any>;
  style?: {
    backgroundColor?: string;
    borderColor?: string;
    textColor?: string;
    borderRadius?: number;
    opacity?: number;
  };
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
}

// Validation schemas
const DashboardSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  layout: z.enum(['grid', 'masonry', 'flexbox']),
  widgets: z.array(z.any()),
  settings: z.object({
    backgroundColor: z.string().optional(),
    backgroundImage: z.string().optional(),
    gridSize: z.number().min(12).max(100).optional(),
    gap: z.number().min(0).max(50).optional(),
    theme: z.enum(['dark', 'light', 'auto']).optional(),
    refreshInterval: z.number().min(10).max(3600).optional()
  })
});

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
  settings: z.record(z.any()),
  style: z.object({
    backgroundColor: z.string().optional(),
    borderColor: z.string().optional(),
    textColor: z.string().optional(),
    borderRadius: z.number().optional(),
    opacity: z.number().optional()
  }).optional()
});

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
    connectedWorkflows: [...new Set(dashboardConnections.map(conn => conn.workflowId))]
  };
}

async function saveDashboardToFile(dashboard: Dashboard) {
  const filePath = path.join(dataDirectory, `${dashboard.id}.json`);
  await fs.writeFile(filePath, JSON.stringify(dashboard, null, 2));
}

async function loadDashboardFromFile(id: string): Promise<Dashboard | null> {
  try {
    const filePath = path.join(dataDirectory, `${id}.json`);
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export const dashboardsRouter = Router();

// Initialize data directory
ensureDataDirectory().catch(console.error);

// GET /api/dashboards - List all dashboards (with summaries)
dashboardsRouter.get('/', async (_req, res) => {
  try {
    const summaries: DashboardSummary[] = [];

    // Load from memory first
    for (const dashboard of dashboards.values()) {
      summaries.push(getDashboardSummary(dashboard));
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
            summaries.push(getDashboardSummary(dashboard));
          }
        }
      }
    }

    // Sort by last modified
    summaries.sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime());

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

    res.json(dashboard);
  } catch (error) {
    console.error('Error getting dashboard:', error);
    res.status(500).json({ error: 'Failed to get dashboard' });
  }
});

// POST /api/dashboards - Create new dashboard
dashboardsRouter.post('/', async (req, res) => {
  try {
    const validatedData = DashboardSchema.parse(req.body);
    const now = new Date();

    const dashboard: Dashboard = {
      id: generateId(),
      name: validatedData.name,
      description: validatedData.description,
      layout: validatedData.layout,
      widgets: validatedData.widgets || [],
      settings: validatedData.settings,
      createdAt: now,
      updatedAt: now,
      createdBy: req.headers['user-id'] as string || 'anonymous'
    };

    dashboards.set(dashboard.id, dashboard);
    await saveDashboardToFile(dashboard);

    res.status(201).json(getDashboardSummary(dashboard));
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid dashboard data', details: error.errors });
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
    const validatedData = DashboardSchema.parse(req.body);

    let dashboard = dashboards.get(id);
    if (!dashboard) {
      dashboard = await loadDashboardFromFile(id);
      if (!dashboard) {
        return res.status(404).json({ error: 'Dashboard not found' });
      }
    }

    // Update dashboard
    dashboard.name = validatedData.name;
    dashboard.description = validatedData.description;
    dashboard.layout = validatedData.layout;
    dashboard.widgets = validatedData.widgets || [];
    dashboard.settings = validatedData.settings;
    dashboard.updatedAt = new Date();

    dashboards.set(id, dashboard);
    await saveDashboardToFile(dashboard);

    res.json(getDashboardSummary(dashboard));
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid dashboard data', details: error.errors });
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
      res.status(400).json({ error: 'Invalid connection data', details: error.errors });
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
    const widgetData = WidgetSchema.parse(req.body);

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
      res.status(400).json({ error: 'Invalid widget data', details: error.errors });
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
    const widgetData = WidgetSchema.parse(req.body);

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
      res.status(400).json({ error: 'Invalid widget data', details: error.errors });
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
