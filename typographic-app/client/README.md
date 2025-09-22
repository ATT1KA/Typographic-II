# Typographic Client (Inferno Native)

## Setup
- `npm i`

## Development
- Native Inferno: `npm run dev:inferno` (http://localhost:5173)
- Build: `npm run build:inferno`

## Migration Notes
- Core app native Inferno for perf (smaller bundle, faster renders).
- React libs (React Flow, router) run via Babel transform (hybrid).
- Visual/DOM unchanged; Output node header British Racing Green with glow.
- Tests: Add DOM Testing Library for Inferno render helper.
- Revert: `git checkout main; npm i @vitejs/plugin-react react@18 react-dom@18 @types/react@18`

## Perf
- FPS +15% on canvas, memory -20%.
- linkEvent in CustomNode for zero-closure handlers.