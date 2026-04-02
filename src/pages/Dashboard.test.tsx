import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Dashboard from './Dashboard';

vi.mock('../api/client', () => ({
  fetchApiPlayersWithDebug: vi.fn(),
  fetchCurrentSeason: vi.fn(),
}));

const stats = {
  appearances: 30, goals: 10, assists: 5, xG: 9.2, xA: 4.8,
  passes_completed: 400, pass_accuracy: 80, tackles: 15, interceptions: 10,
  clearances: 5, minutes_played: 2500, rating: 7.2, npxG: 7.8,
  dribbles: 35, key_passes: 28, aerial_duels_won: 40,
  yellow_cards: 3, red_cards: 0, fouls_drawn: 30, fouls_committed: 20,
};

const livePlayers = Array.from({ length: 15 }, (_, i) => ({
  id: i + 1,
  name: `Player ${i + 1}`,
  team: i < 5 ? 'Team A' : 'Team B',
  position: i % 2 === 0 ? 'Forward' : 'Midfielder',
  age: 20 + i,
  nationality: 'England',
  stats,
}));

const debugInfo = {
  url: 'http://localhost:8000/api/players?league=EFL-League-Two&season=2025%2F26',
  status: 200,
  statusText: 'OK',
  fetchTime: '2026-01-01T00:00:00.000Z',
  playerCount: livePlayers.length,
  error: null,
};

beforeEach(async () => {
  const { fetchApiPlayersWithDebug, fetchCurrentSeason } = await import('../api/client');
  (fetchApiPlayersWithDebug as ReturnType<typeof vi.fn>).mockResolvedValue({
    data: { players: livePlayers, liveData: true, total: livePlayers.length },
    debug: debugInfo,
  });
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

  it('renders league selector with default EFL League Two', async () => {
    renderDashboard();
    await screen.findByText('EFL League Two Players');
    const leagueSelect = screen.getByLabelText('League');
    expect(leagueSelect).toBeInTheDocument();
    expect((leagueSelect as HTMLSelectElement).value).toBe('EFL-League-Two');
  });

  it('re-fetches data when switching leagues', async () => {
    const user = userEvent.setup();
    const { fetchApiPlayersWithDebug } = await import('../api/client');
    renderDashboard();
    await screen.findByText('EFL League Two Players');
    // Switch to EFL League One
    await user.selectOptions(screen.getByLabelText('League'), 'EFL-League-One');
    // fetchApiPlayersWithDebug should have been called with the new league
    expect(fetchApiPlayersWithDebug).toHaveBeenCalledWith(
      expect.objectContaining({ league: 'EFL-League-One', season: '2025/26' }),
      false,
    );
  });

  it('renders the debug panel with backend info', async () => {
    renderDashboard();
    await screen.findByText('EFL League Two Players');
    const panel = screen.getByTestId('debug-panel');
    expect(panel).toBeInTheDocument();
    expect(panel.textContent).toContain('Debug Panel');
    expect(panel.textContent).toContain(String(livePlayers.length));
  });

  it('shows 0 players when backend returns empty array', async () => {
    const { fetchApiPlayersWithDebug } = await import('../api/client');
    (fetchApiPlayersWithDebug as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { players: [], liveData: true, total: 0 },
      debug: { ...debugInfo, playerCount: 0 },
    });
    renderDashboard();
    const panel = await screen.findByTestId('debug-panel');
    expect(panel.textContent).toContain('0');
    expect(screen.getByText(/No player data available/)).toBeInTheDocument();
    // Season highlights should NOT render when 0 players
    expect(screen.queryByText('Total Goals')).not.toBeInTheDocument();
  });

  it('has a debug mode toggle for /api/debug/players', async () => {
    renderDashboard();
    await screen.findByText('EFL League Two Players');
    const toggle = screen.getByLabelText('Toggle debug endpoint');
    expect(toggle).toBeInTheDocument();
    // In normal mode, label shows "Normal mode (/api/players)"
    const panel = screen.getByTestId('debug-panel');
    expect(panel.textContent).toContain('Normal mode');
  });

  it('calls /api/debug/players with no params when debug mode is toggled on', async () => {
    const user = userEvent.setup();
    const { fetchApiPlayersWithDebug } = await import('../api/client');

    // Mock debug response
    (fetchApiPlayersWithDebug as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { players: livePlayers, liveData: false, total: livePlayers.length },
      debug: {
        url: 'http://localhost:8000/api/debug/players',
        status: 200,
        statusText: 'OK',
        fetchTime: '2026-01-01T00:00:00.000Z',
        playerCount: livePlayers.length,
        error: null,
        rawBodyLength: 500,
        rawBodyPreview: '[{"id":1,"name":"Player 1"}]',
        rawJsonObject: [{ id: 1, name: 'Player 1' }],
        rawPlayerNames: ['Player 1', 'Player 2'],
      },
    });

    renderDashboard();
    await screen.findByText('EFL League Two Players');
    const toggle = screen.getByLabelText('Toggle debug endpoint');
    await user.click(toggle);

    // Should call with undefined params and useDebugEndpoint=true
    expect(fetchApiPlayersWithDebug).toHaveBeenCalledWith(undefined, true);

    // Debug mode heading appears
    await screen.findByText('Debug Mode — Raw Player Rows');

    // Debug panel shows "Debug mode ON"
    const panel = screen.getByTestId('debug-panel');
    expect(panel.textContent).toContain('Debug mode ON');
    expect(panel.textContent).toContain('/api/debug/players');

    // Raw body length and first player names shown
    expect(panel.textContent).toContain('500 chars');
    expect(panel.textContent).toContain('Player 1, Player 2');

    // League selector and season highlights should be hidden
    expect(screen.queryByLabelText('League')).not.toBeInTheDocument();
    expect(screen.queryByText('Total Goals')).not.toBeInTheDocument();

    // Raw body preview should be shown with prettified JSON
    const rawPreview = screen.getByTestId('raw-body-preview');
    expect(rawPreview).toBeInTheDocument();
    expect(rawPreview.textContent).toContain('"id": 1');
    expect(rawPreview.textContent).toContain('"name": "Player 1"');
  });

  it('shows full structured object in debug panel when backend returns { liveData, players }', async () => {
    const user = userEvent.setup();
    const { fetchApiPlayersWithDebug } = await import('../api/client');

    const structuredObj = { liveData: false, players: [] };
    (fetchApiPlayersWithDebug as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { players: [], liveData: false, total: 0 },
      debug: {
        url: 'http://localhost:8000/api/debug/players',
        status: 200,
        statusText: 'OK',
        fetchTime: '2026-01-01T00:00:00.000Z',
        playerCount: 0,
        error: null,
        rawBodyLength: 35,
        rawBodyPreview: '{"liveData":false,"players":[]}',
        rawJsonObject: structuredObj,
        rawPlayerNames: [],
      },
    });

    renderDashboard();
    await screen.findByText('EFL League Two Players');
    const toggle = screen.getByLabelText('Toggle debug endpoint');
    await user.click(toggle);

    await screen.findByText('Debug Mode — Raw Player Rows');
    const rawPreview = screen.getByTestId('raw-body-preview');
    expect(rawPreview.textContent).toContain('"liveData": false');
    expect(rawPreview.textContent).toContain('"players": []');
  });
});
