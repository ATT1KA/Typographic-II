# Typographic Project Ontology

## Overview

Typographic is a comprehensive workflow visualization and business intelligence application built as a monorepo with a React/Inferno frontend and Node.js/TypeScript backend. The application focuses on creating visual workflows for different business verticals including BI (Business Intelligence), Political, Policymaking, Fundraising, OSINT (Open Source Intelligence), SCI (Supply Chain Intelligence), Connectivity, Transformation, and Output operations.

## Architecture Overview

### Project Structure
- **Root Level**: Minimal Express setup with workspace configuration
- **Client**: React/Inferno-based frontend with Vite build system
- **Server**: Node.js/TypeScript backend with Express API
- **Monorepo**: Managed with npm workspaces

### Technology Stack
- **Frontend**: React 18.3.1, Inferno (custom router), React Flow (@xyflow/react), Vite 7.1.6, TypeScript 5.5.4
- **Backend**: Node.js 18.17+, Express 4.21.2, TypeScript 5.5.4
- **Database**: File-based JSON storage in `server/data/` directory
- **Styling**: Custom CSS with CSS variables, acrylic glass effects, dark theme
- **Build Tools**: Vite, tsx, concurrently for development

## Package Dependencies

### Root Package (`/`)
```json
{
  "dependencies": {
    "express": "^5.1.0"
  },
  "devDependencies": {
    "@types/express": "^5.0.3"
  }
}
```

### Client Package (`/typographic-app/client/`)
```json
{
  "dependencies": {
    "@xyflow/react": "^12.8.5",      // Workflow visualization
    "lucide-react": "^0.544.0",       // Icons
    "react": "^18.3.1",              // UI framework
    "react-dom": "^18.3.1",          // DOM rendering
    "react-router-dom": "^7.9.1",     // Client-side routing
    "react-toastify": "^11.0.5"      // Toast notifications
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.8.0",
    "@testing-library/react": "^16.3.0",
    "@types/react": "^19.1.13",
    "@types/react-dom": "^19.1.9",
    "@typescript-eslint/eslint-plugin": "^8.44.0",
    "@typescript-eslint/parser": "^8.44.0",
    "@vitejs/plugin-react": "^5.0.3",
    "eslint": "^8.57.1",
    "jsdom": "^27.0.0",
    "typescript": "^5.5.4",
    "vite": "^7.1.6",
    "vitest": "^3.2.4"
  }
}
```

### Server Package (`/typographic-app/server/`)
```json
{
  "dependencies": {
    "compression": "^1.7.4",         // Response compression
    "cors": "^2.8.5",                // Cross-origin requests
    "dotenv": "^16.4.5",             // Environment variables
    "express": "^4.21.2",            // Web framework
    "helmet": "^7.1.0",              // Security headers
    "morgan": "^1.10.0",             // HTTP request logger
    "pino": "^9.5.0",                // Logging
    "pino-pretty": "^11.2.2",        // Log formatting
    "vite": "7.1.6",                 // Build tool
    "zod": "^3.23.8"                 // Schema validation
  },
  "devDependencies": {
    "@types/compression": "^1.7.5",
    "@types/cors": "^2.8.17",
    "@types/express": "^4.17.23",
    "@types/morgan": "^1.9.9",
    "@types/node": "^20.11.30",
    "eslint": "^8.57.0",
    "eslint-config-prettier": "^9.1.0",
    "eslint-plugin-import": "^2.29.1",
    "eslint-plugin-n": "^17.9.0",
    "eslint-plugin-promise": "^6.4.0",
    "prettier": "^3.3.3",
    "ts-node": "^10.9.2",
    "tsx": "^4.19.0",
    "typescript": "^5.5.4",
    "vitest": "^3.2.4"
  }
}
```

## Data Structures & Types

### Core Domain Types

#### Vertical Categories (`/client/src/types/flow.ts`)
```typescript
type Vertical = 'BI' | 'Political' | 'Policymaking' | 'Fundraising' | 'OSINT' | 'SCI' | 'Connectivity' | 'Transformation' | 'Output';
```

#### Node Categories
```typescript
type NodeCategory = 'Data' | 'Connectivity' | 'Transformation' | 'Output';
```

#### Port Types
```typescript
type PortKind = 'data' | 'meta';
```

### Node Data Structure
```typescript
type NodeData = {
  label: string;
  vertical: Vertical;
  subtype: string;
  category?: NodeCategory;
  ports?: Array<{
    id: string;
    direction: 'in' | 'out';
    kind: PortKind;
    maxConnections?: number | 'many';
  }>;
  config?: {
    dataSource?: {
      type?: 'api' | 'db' | 'file';
      endpoint?: string;
      notes?: string;
    };
    transforms?: Array<{
      type: 'lm-studio-summary' | 'aggregation' | 'anomaly-detection';
      params?: Record<string, unknown>;
    }>;
    outputs?: string[];
    logic?: Record<string, unknown>;  // For Connectivity nodes
    [key: string]: any;  // Flexible configuration
  };
  onChange?: (partial: NodeData) => void;
};
```

### Workflow Types (`/server/src/services/workflow.service.ts`)
```typescript
type WorkflowNode = {
  id: string;
  type: string;
  label: string;
  params?: NodeParam[];
};

type WorkflowEdge = {
  id: string;
  source: string;
  target: string;
  weight?: number;
};

type Workflow = {
  id: string;
  name: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
};
```

### Discovery Card Types (`/server/src/services/discovery.service.ts`)
```typescript
type DiscoveryCard = {
  id: string;
  domain: 'Policy' | 'BI' | 'OSINT' | 'SCI' | 'Funding';
  title: string;
  summary: string;
  parameters: Array<{
    key: string;
    value: string | number;
    confidence?: number;
  }>;
};
```

## API Architecture

### Server Configuration (`/server/src/app.ts`)
- **Port**: 5174 (configurable via PORT env var)
- **CORS**: Configurable origin (default: '*')
- **Security**: Helmet, compression, input validation
- **Logging**: Pino with pretty formatting
- **Body Parsing**: JSON (1MB limit), URL-encoded

### API Routes (`/server/src/routes/index.ts`)

#### Health Check
- **GET** `/api/health` - Basic service health

#### Flow Management (`/server/src/routes/flow.ts`)
- **GET** `/api/flow/_health` - Filesystem status
- **GET** `/api/flow/:id` - Load workflow by ID
- **POST** `/api/flow/:id` - Save workflow by ID

#### Search (`/server/src/routes/search.ts`)
- **GET** `/api/search?q={query}` - Search discovery cards

#### Workflows (`/server/src/routes/workflows.ts`)
- **GET** `/api/workflows` - List all workflows
- **POST** `/api/workflows` - Create new workflow
- **POST** `/api/workflows/:id/run` - Execute workflow

#### Dashboards (`/server/src/routes/dashboards.ts`)
- **GET** `/api/dashboards` - List dashboards
- **POST** `/api/dashboards` - Create dashboard

#### Reports (`/server/src/routes/reports.ts`)
- **POST** `/api/reports` - Generate report

### Data Storage
- **Location**: `/server/data/` directory
- **Format**: JSON files named by workflow ID
- **Structure**: `{ nodes: Node[], edges: Edge[] }`

## Frontend Architecture

### Application Shell (`/client/src/components/AppShell.tsx`)
- **Header**: Brand, navigation, health status, settings
- **Navigation**: Explorer, Workflow, Dashboards, Reports
- **Layout**: CSS Grid (84px header + flexible main)

### Routing System (`/client/src/router.ts`)
Custom Inferno-based router with:
- History-based navigation
- Parameter support
- Route matching with exact/partial matching

### Key Components

#### WorkflowBuilder (`/client/src/pages/WorkflowBuilder.tsx`)
**Core Features:**
- ReactFlow canvas with custom nodes
- Node library sidebar with category tabs
- Grid-based positioning (48px grid)
- Auto-save functionality
- Keyboard shortcuts (Ctrl+D duplicate, Delete remove)
- Connection validation (cycle detection, port kind matching)

**State Management:**
- Nodes: `useNodesState` from ReactFlow
- Edges: `useEdgesState` from ReactFlow
- UI State: Local state for sidebar, workflow ID, etc.

#### CustomNode (`/client/src/components/CustomNode.tsx`)
**Features:**
- Dynamic port rendering based on node category
- Expandable configuration forms
- Category-specific logic (Connectivity vs Data nodes)
- Grid-snapped resizing
- Real-time configuration updates

**Port Configuration:**
- **Data Nodes**: data-in, data-out, meta-out
- **Connectivity**: data-in-a, data-in-b, data-out, meta-in, meta-out
- **Transformation**: data-in, data-out, meta-in, meta-out
- **Output**: data-in, meta-in, meta-out

#### NodeLibrary (`/client/src/components/NodeLibrary.tsx`)
**Organization:**
- **Data Tab**: Nodes organized by vertical (BI, Political, etc.)
- **Connectivity Tab**: Router, join, split, feedback nodes
- **Transformation Tab**: Aggregation, normalization, enrichment nodes
- **Output Tab**: Dashboard, visualization, report nodes

**Node Categories by Vertical:**
- **BI**: Data Source, Warehouse, Exploration, Mining, Optimization, Reporting
- **Political**: Actor, Edge/Link, Centrality, Community, Connectivity, Clique/Core
- **Policymaking**: Problem ID, Formulation, Implementation, Monitoring, Evaluation
- **Fundraising**: Sourcing, Screening, Due Diligence, Negotiation, Closing, Post-Investment
- **OSINT**: Passive Collection, Social Media, Google Dorking, Metadata, Database, Technical Mapping
- **SCI**: Planning, Sourcing, Manufacturing, Delivery/Shipping, Returns, Supplier Segmentation

### Styling System (`/client/src/styles/theme.css`)
**Design Philosophy:**
- Dark theme with acrylic glass effects
- Monospace typography for UI elements
- Subtle gradients and backdrop filters
- Consistent spacing using CSS custom properties
- Neutral color palette with accent colors for verticals

**Key CSS Variables:**
- `--bg`: #1b1b1b (main background)
- `--bg-elev`: #232323 (elevated surfaces)
- `--accent`: #6c5ce7 (primary accent)
- `--text`: #f0f0f0 (primary text)
- `--control-bg`: #141414 (control backgrounds)

## Configuration & Environment

### Environment Variables
- **PORT**: Server port (default: 5174)
- **CORS_ORIGIN**: CORS allowed origins (default: '*')
- **VITE_API_BASE**: API base URL for client (default: '/api')

### File Structure
```
/workspace/
├── typographic-app/
│   ├── client/          # React/Inferno frontend
│   │   ├── src/
│   │   │   ├── components/     # Reusable UI components
│   │   │   ├── pages/          # Main application views
│   │   │   ├── types/          # TypeScript type definitions
│   │   │   ├── styles/         # CSS files and themes
│   │   │   ├── constants/      # Application constants
│   │   │   └── router.ts       # Custom routing system
│   │   ├── index.html          # HTML entry point
│   │   ├── vite.config.ts      # Vite configuration
│   │   └── package.json        # Client dependencies
│   │
│   ├── server/          # Node.js/TypeScript backend
│   │   ├── src/
│   │   │   ├── routes/         # API route handlers
│   │   │   ├── services/       # Business logic
│   │   │   ├── middleware/     # Express middleware
│   │   │   ├── utils/          # Utility functions
│   │   │   └── types/          # Server-side types
│   │   ├── data/               # JSON data storage
│   │   ├── index.js            # Development entry point
│   │   └── package.json        # Server dependencies
│   │
│   └── package.json     # Monorepo configuration
│
└── package.json         # Root package (minimal)
```

## Development Workflow

### Scripts
```json
{
  "scripts": {
    "dev": "concurrently client, api, and flow servers",
    "build": "build client and server",
    "lint": "lint client and server",
    "test": "test client and server"
  }
}
```

### Development Servers
- **Client**: `npm run dev --workspace=client` (Vite dev server on port 5173)
- **API**: `npm run dev --workspace=server` (tsx watch mode)
- **Flow**: `npm run flow --workspace=server` (Node.js server)

### Build Process
- **Client**: TypeScript compilation + Vite build
- **Server**: TypeScript compilation to `dist/server.js`

## Domain Model Relationships

### Vertical → Node Types → Use Cases
1. **BI (Business Intelligence)**: Data processing, analytics, reporting
2. **Political**: Network analysis, influence mapping, community detection
3. **Policymaking**: Policy development lifecycle, stakeholder analysis
4. **Fundraising**: Deal flow management, due diligence, investment tracking
5. **OSINT**: Intelligence gathering, social media analysis, metadata extraction
6. **SCI (Supply Chain Intelligence)**: Logistics, supplier analysis, risk assessment

### Node Categories → Functionality
1. **Data**: Input/output operations, data sources, transformations
2. **Connectivity**: Routing, joining, splitting, feedback loops
3. **Transformation**: Data processing, aggregation, enrichment
4. **Output**: Visualization, reporting, alerting, export

### Port System → Data Flow
- **Data Ports**: Primary business data flow
- **Meta Ports**: Control signals, configuration, metadata
- **Connection Rules**: Same port kinds, cycle prevention, feedback node exceptions

## Error Handling & Validation

### Frontend Validation
- Port kind matching for connections
- Cycle detection in workflow graphs
- URL validation for API endpoints
- JSON validation for configuration objects

### Backend Validation
- Zod schemas for request validation
- Express error handling middleware
- Filesystem error handling
- Graceful fallbacks for missing data

### Error Boundaries
- React ErrorBoundary component for UI errors
- Process-level error handlers for server crashes
- Graceful degradation for missing resources

## Security Considerations

### Backend Security
- Helmet for security headers
- CORS configuration
- Input size limits (1MB JSON)
- Request validation with Zod

### Frontend Security
- Content Security Policy ready
- XSS prevention through controlled rendering
- Secure defaults in configurations

## Performance Characteristics

### Frontend Performance
- Lazy loading of heavy components (NodeLibrary)
- Throttled position updates
- Efficient re-rendering with React.memo patterns
- Grid-based optimizations

### Backend Performance
- In-memory workflow storage (Map-based)
- File-based persistence (JSON)
- Minimal dependencies
- Streaming responses where applicable

### Scalability Considerations
- Monorepo structure supports microservices evolution
- File-based storage can be replaced with database
- API design supports pagination and filtering
- Component architecture supports lazy loading

This ontology provides a comprehensive foundation for understanding the Typographic project's architecture, data models, and implementation patterns. It serves as a reference for maintenance, feature development, and system evolution.
