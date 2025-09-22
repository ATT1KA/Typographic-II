import AppShell from './components/AppShell';

export const routes = [
  { path: '/', component: () => 'home', exact: true },
];

export default function App() {
  return <AppShell>{null}</AppShell>;
}
