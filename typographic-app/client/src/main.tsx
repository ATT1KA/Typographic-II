// no explicit React import required under automatic runtime
import { render } from 'inferno';
import App from './App';
import { Router } from './router';
import GraphView from './graph/GraphView';
import './styles/theme.css';
import './styles/global.css';

const routes = [
  { path: '/', component: () => <div>Home - Native Inferno App</div>, exact: true },
  { path: '/graph', component: () => <GraphView /> },
  { path: '*', component: () => <div>404</div> }
];

// App component is now in a separate file for tests

async function mountApp() {
  const rootEl = document.getElementById('root')!;
  // For native Inferno mode use Inferno.render
  // (compat path removed during native migration)
  // Use the named `render` import from 'inferno'
  render(
    <App />,
    rootEl
  );
}

void mountApp();

render(<Router routes={routes} />, document.getElementById('root')!);
