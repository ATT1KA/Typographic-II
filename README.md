# Typographic II

A monorepo housing a React (Vite) client and a TypeScript/Express API, plus a lightweight Flow persistence service for workflow graphs. Optimized for quick local development with sensible defaults.

## Quick Start

Requirements:
- Node.js 18.17+
- pnpm or npm (repo uses npm workspaces; examples use npm)

```pwsh
# From the repo root
cd "c:\Users\danie\OneDrive\Documents\GitHub\Typographic II\typographic-app"
npm install
npm run dev
```

Open the app at `http://localhost:5173` (Workflow Builder at `/workflow`).

## What Starts in Dev

- Client (Vite): `http://localhost:5173`
- API server (Express): `http://localhost:5174`
- Flow server (persistence): `http://localhost:5176`

The client proxies:
- `/api` → Flow server (`5176`)
- `/api-server` → API server (`5174`)

Ports are configured in `client/vite.config.ts` and `server/src/server.ts`.

## Repository Structure

```
typographic-app/
  client/            # React + Vite UI
  server/            # TypeScript Express API
  ...                # Dev configs and shared scripts
```

Client highlights (`client/src`):
- `pages/WorkflowBuilder.tsx`: Visual graph builder for workflows
- `components/HealthStatus.tsx`: Live health indicators for API/Flow
- `styles/`: Global CSS, node styling

Server highlights (`server/src`):
- `app.ts`: Middleware, `/api` router, `/api/health`
- `server.ts`: Bootstraps HTTP server (default port 5174)
- `routes/`: Feature routers (`/search`, `/workflows`, `/dashboards`, `/reports`)
- `index.js`: Separate Flow persistence service (port 5176), endpoints `/api/flow/:id`
- `data/`: JSON files saved by the Flow service

Project extras:
- `.env.example`: Example environment variables (copy to `.env` to customize behavior such as `CORS_ORIGIN`).
- `.vscode/` (optional): recommended workspace settings and extensions for development.

## Scripts

Run from `typographic-app/` (the workspace root):

- `npm run dev`: Starts client, API, and Flow servers concurrently
- `npm run build`: Builds client and server
- `npm run lint`: Lints client and server
- `npm run test`: Runs tests for client and server

Inside packages:
- `client`: `npm run dev`, `build`, `preview`, `test`, `lint`
- `server`: `npm run dev` (watch), `flow` (flow server), `build`, `start`, `test`, `lint`

## API Overview

Base path: `/api` on the API server (proxied as `/api-server` from the client).

- `GET /api/health` → `{ status: 'ok', timestamp }`
- `GET /api/search?q=term` → `{ query, results }`
- `GET /api/workflows` → `Workflow[]`
- `POST /api/workflows` → Create workflow (body JSON)
- `POST /api/workflows/:id/run` → Execute a workflow
- `GET /api/reports` → N/A (use POST)
- `POST /api/reports` → Generate a report `{ id, title, format, content }`
- `GET /api/dashboards` → `Dashboard[]`
- `POST /api/dashboards` → Create dashboard

Flow persistence service (separate process on 5176):
- `GET /api/flow/:id` → `{ nodes: [], edges: [] }` if new
- `POST /api/flow/:id` → `{ ok: true }` (saves JSON)

## Testing

- Client: Vitest (`client/src/App.test.tsx` etc.)
- Server: Vitest (`server/test/`)

Run all tests from workspace root:

```pwsh
cd "c:\Users\danie\OneDrive\Documents\GitHub\Typographic II\typographic-app"
npm run test
```

## Troubleshooting

- Port in use: stop any processes on `5173`, `5174`, or `5176`.
  ```pwsh
  Get-NetTCPConnection -LocalPort 5173,5174,5176 -ErrorAction SilentlyContinue | ForEach-Object { try { Stop-Process -Id $_.OwningProcess -Force } catch {} }
  ```
- Health indicators red: ensure both API and Flow servers are running. Check `http://localhost:5174/api/health` and `http://localhost:5176/api/flow/default`.
- CORS issues: set `CORS_ORIGIN` in environment if needed (defaults to `*`).

## Additional Notes

- The `Workflow Builder` in the client autosaves flows to the Flow service. Change the `Workflow ID` input to create separate persisted flows (saved at `server/data/<id>.json` when using the included Flow server).
- Vite is configured to dedupe React to avoid duplicate React instances when using linked packages. See `client/vite.config.ts`.

## License

MIT (see LICENSE if present).