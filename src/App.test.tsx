import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import { AppRoutes } from './App';

describe('App', () => {
  it('renders the dashboard on the root path', async () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <AppRoutes />
      </MemoryRouter>
    );
    expect(await screen.findByText('EFL League Two Players')).toBeInTheDocument();
  });

  it('renders portfolio page', async () => {
    render(
      <MemoryRouter initialEntries={['/portfolio']}>
        <AppRoutes />
      </MemoryRouter>
    );
    expect(await screen.findByText('Scouting Portfolio')).toBeInTheDocument();
  });
});
