import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import Navbar from '../components/Navbar';

describe('Navbar', () => {
  it('renders the brand name', () => {
    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    );
    expect(screen.getByText('⚽ EFL Scout')).toBeInTheDocument();
  });

  it('renders navigation links', () => {
    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    );
    const dashboardLinks = screen.getAllByText('Dashboard');
    const portfolioLinks = screen.getAllByText('Portfolio');
    expect(dashboardLinks.length).toBeGreaterThan(0);
    expect(portfolioLinks.length).toBeGreaterThan(0);
  });
});
