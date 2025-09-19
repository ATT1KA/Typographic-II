import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import App from './main';

test('renders app', () => {
  render(<BrowserRouter><App /></BrowserRouter>);
  expect(screen.getByText('Typographic')).toBeInTheDocument();
});