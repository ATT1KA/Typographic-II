import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import App from './App';

test('renders app', () => {
  render(<App />);
  expect(screen.getByText(/Home - Typographic Workflow Builder/i)).toBeInTheDocument();
});