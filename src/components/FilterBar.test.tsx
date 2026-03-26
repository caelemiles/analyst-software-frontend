import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import FilterBar from '../components/FilterBar';
import type { PlayerFilters } from '../types';

function renderFilterBar(overrides?: Partial<{
  filters: PlayerFilters;
  onFilterChange: (f: PlayerFilters) => void;
  teams: string[];
  positions: string[];
}>) {
  const defaults = {
    filters: { search: '', team: '', position: '', minAge: '' as const, maxAge: '' as const } as PlayerFilters,
    onFilterChange: () => {},
    teams: ['Crawley Town', 'Morecambe'],
    positions: ['Forward', 'Midfielder', 'Defender'],
  };
  const props = { ...defaults, ...overrides };
  return render(
    <MemoryRouter>
      <FilterBar {...props} />
    </MemoryRouter>
  );
}

describe('FilterBar', () => {
  it('renders all filter fields', () => {
    renderFilterBar();
    expect(screen.getByLabelText('Search')).toBeInTheDocument();
    expect(screen.getByLabelText('Team')).toBeInTheDocument();
    expect(screen.getByLabelText('Position')).toBeInTheDocument();
    expect(screen.getByLabelText('Min Age')).toBeInTheDocument();
    expect(screen.getByLabelText('Max Age')).toBeInTheDocument();
  });

  it('renders team options', () => {
    renderFilterBar({ teams: ['Crawley Town', 'Morecambe'] });
    expect(screen.getByRole('option', { name: 'All Teams' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Crawley Town' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Morecambe' })).toBeInTheDocument();
  });

  it('renders position options', () => {
    renderFilterBar({ positions: ['Forward', 'Defender'] });
    expect(screen.getByRole('option', { name: 'All Positions' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Forward' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Defender' })).toBeInTheDocument();
  });

  it('calls onFilterChange when search is typed', async () => {
    const user = userEvent.setup();
    let captured: PlayerFilters | null = null;
    renderFilterBar({ onFilterChange: (f) => { captured = f; } });
    await user.type(screen.getByLabelText('Search'), 'J');
    expect(captured).not.toBeNull();
    expect(captured!.search).toBe('J');
  });

  it('calls onFilterChange when team is selected', async () => {
    const user = userEvent.setup();
    let captured: PlayerFilters | null = null;
    renderFilterBar({ onFilterChange: (f) => { captured = f; } });
    await user.selectOptions(screen.getByLabelText('Team'), 'Crawley Town');
    expect(captured).not.toBeNull();
    expect(captured!.team).toBe('Crawley Town');
  });
});
