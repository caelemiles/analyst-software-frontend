import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Dashboard from './Dashboard';

vi.mock('../api/client', () => ({
  fetchPlayers: vi.fn(),
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
  const { fetchPlayers } = await import('../api/client');
  (fetchPlayers as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('API unavailable'));
});

function renderDashboard() {
  return render(
    <MemoryRouter>
      <Dashboard />
    </MemoryRouter>
  );
}

describe('Dashboard pagination', () => {
  it('shows Current Season 2025/26 label', async () => {
    renderDashboard();
    expect(await screen.findByText(/Current Season 2025\/26/)).toBeInTheDocument();
  });

  it('shows only 10 players on first page', async () => {
    renderDashboard();
    await screen.findByText('Player 1');
    const playerCards = screen.getAllByText(/^Player \d+$/);
    expect(playerCards.length).toBe(10);
    expect(screen.getByText('Player 1')).toBeInTheDocument();
    expect(screen.getByText('Player 10')).toBeInTheDocument();
    expect(screen.queryByText('Player 11')).not.toBeInTheDocument();
  });

  it('shows pagination controls when more than 10 players', async () => {
    renderDashboard();
    await screen.findByText('Player 1');
    expect(screen.getByText(/Page 1 of 2/)).toBeInTheDocument();
    expect(screen.getByText('← Previous')).toBeDisabled();
    expect(screen.getByText('Next →')).not.toBeDisabled();
  });

  it('navigates to next page', async () => {
    const user = userEvent.setup();
    renderDashboard();
    await screen.findByText('Player 1');
    await user.click(screen.getByText('Next →'));
    expect(screen.getByText('Player 11')).toBeInTheDocument();
    expect(screen.queryByText('Player 1')).not.toBeInTheDocument();
    expect(screen.getByText(/Page 2 of 2/)).toBeInTheDocument();
  });

  it('resets page on filter change', async () => {
    const user = userEvent.setup();
    renderDashboard();
    await screen.findByText('Player 1');
    await user.click(screen.getByText('Next →'));
    expect(screen.getByText(/Page 2 of 2/)).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText('Team'), 'Team A');
    expect(screen.getByText('Player 1')).toBeInTheDocument();
  });
});
