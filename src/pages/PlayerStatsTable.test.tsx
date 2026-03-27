import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import PlayerStatsTable from './PlayerStatsTable';

vi.mock('../api/client', () => ({
  fetchPlayers: vi.fn(),
  fetchPlayersPaginated: vi.fn(),
  fetchPlayersByLeagueAndSeason: vi.fn(),
  fetchApiPlayers: vi.fn(),
  fetchCurrentSeason: vi.fn(),
}));

vi.mock('../api/mockData', () => {
  const stats = (goals: number, assists: number) => ({
    appearances: 30, goals, assists, xG: 9.2, xA: 4.8,
    passes_completed: 400, pass_accuracy: 80, tackles: 15, interceptions: 10,
    clearances: 5, minutes_played: 2500, rating: 7.2, npxG: 7.8,
    dribbles: 35, key_passes: 28, aerial_duels_won: 40,
    yellow_cards: 3, red_cards: 0, fouls_drawn: 30, fouls_committed: 20,
  });
  return {
    mockPlayers: [
      { id: 1, name: 'Alice Forward', team: 'Team A', position: 'Forward', age: 24, nationality: 'England', stats: stats(15, 5) },
      { id: 2, name: 'Bob Midfielder', team: 'Team B', position: 'Midfielder', age: 26, nationality: 'England', stats: stats(3, 10) },
      { id: 3, name: 'Charlie Defender', team: 'Team A', position: 'Defender', age: 28, nationality: 'England', stats: stats(1, 2) },
    ],
  };
});

beforeEach(async () => {
  const { fetchPlayers, fetchPlayersPaginated, fetchPlayersByLeagueAndSeason, fetchApiPlayers, fetchCurrentSeason } = await import('../api/client');
  (fetchApiPlayers as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('API unavailable'));
  (fetchPlayersByLeagueAndSeason as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('API unavailable'));
  (fetchPlayersPaginated as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('API unavailable'));
  (fetchPlayers as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('API unavailable'));
  (fetchCurrentSeason as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('API unavailable'));
});

function renderPage() {
  return render(
    <MemoryRouter>
      <PlayerStatsTable />
    </MemoryRouter>
  );
}

describe('PlayerStatsTable', () => {
  it('renders the stats table heading', async () => {
    renderPage();
    expect(await screen.findByText('Player Stats Table')).toBeInTheDocument();
    const labels = screen.getAllByText(/Current Season 2025\/26/);
    expect(labels.length).toBeGreaterThanOrEqual(1);
  });

  it('shows all players', async () => {
    renderPage();
    await screen.findByText('Alice Forward');
    expect(screen.getByText('Bob Midfielder')).toBeInTheDocument();
    expect(screen.getByText('Charlie Defender')).toBeInTheDocument();
  });

  it('filters players by search', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('Alice Forward');
    await user.type(screen.getByLabelText('Search players'), 'Alice');
    expect(screen.getByText('Alice Forward')).toBeInTheDocument();
    expect(screen.queryByText('Bob Midfielder')).not.toBeInTheDocument();
  });

  it('sorts by column when header clicked', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('Alice Forward');
    // Default sort is by goals desc, so Alice (15) is first
    const rows = screen.getAllByRole('row');
    // rows[0] is header, rows[1] is first data row
    expect(rows[1]).toHaveTextContent('Alice Forward');
    // Click Goals header to toggle to asc
    await user.click(screen.getByText(/^Goals/));
    const rowsAfter = screen.getAllByRole('row');
    expect(rowsAfter[1]).toHaveTextContent('Charlie Defender');
  });
});
