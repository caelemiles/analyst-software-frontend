import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Dashboard from './Dashboard';

vi.mock('../api/client', () => ({
  fetchPlayers: vi.fn(),
  fetchPlayersPaginated: vi.fn(),
  fetchCurrentSeason: vi.fn(),
}));

vi.mock('../api/mockData', () => {
  const stats = {
    appearances: 30, goals: 10, assists: 5, xG: 9.2, xA: 4.8,
    passes_completed: 400, pass_accuracy: 80, tackles: 15, interceptions: 10,
    clearances: 5, minutes_played: 2500, rating: 7.2, npxG: 7.8,
    dribbles: 35, key_passes: 28, aerial_duels_won: 40,
    yellow_cards: 3, red_cards: 0, fouls_drawn: 30, fouls_committed: 20,
  };
  return {
    mockPlayers: Array.from({ length: 15 }, (_, i) => ({
      id: i + 1,
      name: `Player ${i + 1}`,
      team: i < 5 ? 'Team A' : 'Team B',
      position: i % 2 === 0 ? 'Forward' : 'Midfielder',
      age: 20 + i,
      nationality: 'England',
      stats,
    })),
  };
});

beforeEach(async () => {
  const { fetchPlayers, fetchPlayersPaginated, fetchCurrentSeason } = await import('../api/client');
  (fetchPlayersPaginated as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('API unavailable'));
  (fetchPlayers as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('API unavailable'));
  (fetchCurrentSeason as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('API unavailable'));
});

function renderDashboard() {
  return render(
    <MemoryRouter>
      <Dashboard />
    </MemoryRouter>
  );
}

describe('Dashboard', () => {
  it('shows Current Season 2025/26 label', async () => {
    renderDashboard();
    const labels = await screen.findAllByText(/Current Season 2025\/26/);
    expect(labels.length).toBeGreaterThanOrEqual(1);
  });

  it('shows all players without pagination', async () => {
    renderDashboard();
    await screen.findByText('EFL League Two Players');
    // Count h3 headings matching player names (player cards use h3)
    const headings = screen.getAllByRole('heading', { level: 3 });
    const playerHeadings = headings.filter(h => /^Player \d+$/.test(h.textContent ?? ''));
    expect(playerHeadings.length).toBe(15);
  });

  it('does not show pagination controls', async () => {
    renderDashboard();
    await screen.findByText('EFL League Two Players');
    expect(screen.queryByText(/Page \d+ of \d+/)).not.toBeInTheDocument();
    expect(screen.queryByText('← Previous')).not.toBeInTheDocument();
    expect(screen.queryByText('Next →')).not.toBeInTheDocument();
  });

  it('filters by team', async () => {
    const user = userEvent.setup();
    renderDashboard();
    await screen.findByText('EFL League Two Players');
    await user.selectOptions(screen.getByLabelText('Team'), 'Team A');
    const headings = screen.getAllByRole('heading', { level: 3 });
    const playerHeadings = headings.filter(h => /^Player \d+$/.test(h.textContent ?? ''));
    expect(playerHeadings.length).toBe(5);
  });

  it('shows season highlights summary', async () => {
    renderDashboard();
    await screen.findByText('EFL League Two Players');
    expect(screen.getByText('Total Goals')).toBeInTheDocument();
    expect(screen.getByText('Total Assists')).toBeInTheDocument();
  });
});
