# Typographic App (Dev)

A Vite + React client with a TS API server and a dedicated Flow persistence server.

## Dev Setup

- Node.js 18+
- Ports: Client `5173`, API `5174`, Flow `5176`

## Run

```pwsh
# From monorepo root
cd "c:\\Users\\danie\\OneDrive\\Documents\\GitHub\\Typographic II\\typographic-app"
npm install
npm run dev
```

- Open: `http://localhost:5173/workflow`
- The client proxies:
  - `/api` → `http://localhost:5176` (Flow server)
  - `/api-server` → `http://localhost:5174` (API server)

## Health Checks

- API: `GET /api-server/health` (returns `{ ok: true, service: 'api', ts: <number> }`)
- Flow: `GET /api/flow/:id` (200 when reachable)
- UI widget: Green/Red dots in header show API and Flow status.

## Notes

- React deduping is enabled in Vite to avoid duplicate React instances.
- Workflow Builder autosaves; change the `Workflow ID` input to create separate flows, persisted in `server/data/<id>.json`.
# Typographic Application

## Overview
The Typographic Application is a web service designed to handle typography-related requests. It provides functionalities for fetching and updating typography data through a structured API.

## Project Structure
The project is organized into several directories and files, each serving a specific purpose:

- **src/**: Contains the main application code.
  - **server.ts**: Initializes the Express server and sets up middleware.
  - **app.ts**: Configures the main application, including middleware and routes.
  - **routes/**: Contains route definitions.
    - **index.ts**: Defines and exports application routes.
  - **controllers/**: Contains request handling logic.
    - **typography.controller.ts**: Handles typography-related requests.
  - **services/**: Contains business logic.
    - **typography.service.ts**: Manages typography data operations.
  - **middleware/**: Contains middleware functions.
    - **errorHandler.ts**: Handles application errors.
    - **notFound.ts**: Handles 404 errors for undefined routes.
  - **utils/**: Contains utility functions.
    - **logger.ts**: Provides logging functionality.
  - **types/**: Contains TypeScript interfaces and types.
    - **index.ts**: Exports types used throughout the application.
  
- **test/**: Contains unit tests for the application.
  - **typography.test.ts**: Tests for the typography service and controller.

- **.vscode/**: Contains configuration for the development environment.
  - **settings.json**: Workspace settings for VSCode.
  - **extensions.json**: Recommended extensions for the project.

- **.env.example**: Example environment variables for configuration.

- **package.json**: NPM configuration file.

- **tsconfig.json**: TypeScript configuration file.

- **.eslintrc.cjs**: ESLint configuration file.

- **.prettierrc**: Prettier configuration file.

- **.gitignore**: Specifies files to be ignored by Git.

- **README.md**: Documentation for the project.

## Instructions for Running the App

1. Clone the repository:
   git clone <repository-url>

2. Navigate to the project directory:
   cd typographic-app

3. Install dependencies:
   npm install

4. Create a `.env` file based on `.env.example` and configure your environment variables.

5. Run the development server:
   npm run dev

## License
This project is licensed under the MIT License. See the LICENSE file for details.