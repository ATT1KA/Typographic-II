import { Router } from './router';
import WorkflowBuilder from './pages/WorkflowBuilder';
import DashboardBuilder from './pages/DashboardBuilder';
import Explorer from './pages/Explorer';
import Reports from './pages/Reports';
import Onboarding from './pages/Onboarding';
import GraphView from './graph/GraphView';

function Home() {
  return <div>Home - Typographic Workflow Builder</div>;
}


function App() {
  const routes = [
    { path: '/', component: Home },
    { path: '/graph', component: GraphView },
    { path: '/dashboard', component: DashboardBuilder },
    { path: '/workflow', component: WorkflowBuilder },
    { path: '/explorer', component: Explorer },
    { path: '/reports', component: Reports },
    { path: '/onboarding', component: Onboarding }
  ];

  return (
    <div className="app">
      <Router routes={routes} />
    </div>
  );
}

export default App;
