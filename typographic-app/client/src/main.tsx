import ReactDOM from 'react-dom/client';
import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
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
        </header>
        <main className="main">
          <Suspense fallback={<div>Loading...</div>}>
            <Routes>
              <Route path="/" element={<Onboarding />} />
              <Route path="/explorer" element={<Explorer />} />
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

ReactDOM.createRoot(document.getElementById('root')!).render(<App />);
