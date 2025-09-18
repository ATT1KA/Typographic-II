import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import './styles/global.css';
import Explorer from './pages/Explorer';
import WorkflowBuilder from './pages/WorkflowBuilder';
import DashboardBuilder from './pages/DashboardBuilder';
import Reports from './pages/Reports';
import Onboarding from './pages/Onboarding';

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
          <Routes>
            <Route path="/" element={<Onboarding />} />
            <Route path="/explorer" element={<Explorer />} />
            <Route path="/workflow" element={<WorkflowBuilder />} />
            <Route path="/dashboards" element={<DashboardBuilder />} />
            <Route path="/reports" element={<Reports />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(<App />);
