import ReactDOM from 'react-dom/client';
import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import HealthStatus from './components/HealthStatus';
import './styles/global.css';

const Explorer = lazy(() => import('./pages/Explorer'));
const WorkflowBuilder = lazy(() => import('./pages/WorkflowBuilder'));
const DashboardBuilder = lazy(() => import('./pages/DashboardBuilder'));
const Reports = lazy(() => import('./pages/Reports'));
const Onboarding = lazy(() => import('./pages/Onboarding'));

function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <header className="header">
          <Link to="/" className="logo">Typographic</Link>
          <nav>
            <Link to="/explorer">Explorer</Link>
            <Link to="/workflow">Workflow</Link>
            <Link to="/dashboards">Dashboards</Link>
            <Link to="/reports">Reports</Link>
          </nav>
          <div style={{ marginLeft: 'auto' }}>
            <HealthStatus />
          </div>
        </header>
        <main className="main">
          <Suspense fallback={<div>Loading...</div>}>
            <Routes>
              <Route path="/" element={<Navigate to="/workflow" replace />} />
              <Route path="/explorer" element={<Explorer />} />
              <Route path="/onboarding" element={<Onboarding />} />
              <Route path="/workflow" element={<WorkflowBuilder />} />
              <Route path="/dashboards" element={<DashboardBuilder />} />
              <Route path="/reports" element={<Reports />} />
            </Routes>
          </Suspense>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;

ReactDOM.createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
