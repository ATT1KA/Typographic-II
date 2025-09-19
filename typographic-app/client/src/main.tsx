import ReactDOM from 'react-dom/client';
import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import AppShell from './components/AppShell';
import './styles/global.css';
import './styles/theme.css';

const Explorer = lazy(() => import('./pages/Explorer'));
const WorkflowBuilder = lazy(() => import('./pages/WorkflowBuilder'));
const DashboardBuilder = lazy(() => import('./pages/DashboardBuilder'));
const Reports = lazy(() => import('./pages/Reports'));
const Onboarding = lazy(() => import('./pages/Onboarding'));

function App() {
  return (
    <BrowserRouter>
      <AppShell>
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
      </AppShell>
    </BrowserRouter>
  );
}

export default App;

ReactDOM.createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
