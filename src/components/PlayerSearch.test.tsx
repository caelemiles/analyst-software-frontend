import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import PlayerSearch from '../components/PlayerSearch';
import type { Player } from '../types';

const mockPlayers: Player[] = [
  {
    id: 1,
    name: 'James Collins',
    team: 'Crawley Town',
    position: 'Forward',
    age: 24,
    nationality: 'England',
    stats: {
      appearances: 32, goals: 14, assists: 6, xG: 12.3, xA: 5.1,
      passes_completed: 420, pass_accuracy: 78.5, tackles: 18,
      interceptions: 12, clearances: 8, minutes_played: 2680,
      rating: 7.3, npxG: 10.5, dribbles: 38, key_passes: 32,
      aerial_duels_won: 42, yellow_cards: 4, red_cards: 0,
      fouls_drawn: 35, fouls_committed: 22,
    },
  },
  {
    id: 2,
    name: 'Ryan Delaney',
    team: 'Morecambe',
    position: 'Defender',
    age: 27,
    nationality: 'Ireland',
    stats: {
      appearances: 38, goals: 3, assists: 2, xG: 2.1, xA: 1.5,
      passes_completed: 1120, pass_accuracy: 82.3, tackles: 72,
      interceptions: 54, clearances: 98, minutes_played: 3240,
      rating: 7.1, npxG: 1.1, dribbles: 15, key_passes: 18,
      aerial_duels_won: 72, yellow_cards: 6, red_cards: 0,
      fouls_drawn: 20, fouls_committed: 32,
    },
  },
];

describe('PlayerSearch', () => {
  it('renders search input with placeholder', () => {
    render(<PlayerSearch players={mockPlayers} onSelect={() => {}} />);
    expect(screen.getByPlaceholderText('Search players...')).toBeInTheDocument();
  });

  it('shows dropdown when typing matching text', async () => {
    const user = userEvent.setup();
    render(<PlayerSearch players={mockPlayers} onSelect={() => {}} />);
    await user.type(screen.getByPlaceholderText('Search players...'), 'James');
    expect(screen.getByText('James Collins')).toBeInTheDocument();
  });

  it('calls onSelect when clicking a result', async () => {
    const user = userEvent.setup();
    const handleSelect = vi.fn();
    render(<PlayerSearch players={mockPlayers} onSelect={handleSelect} />);
    await user.type(screen.getByPlaceholderText('Search players...'), 'James');
    await user.click(screen.getByText('James Collins'));
    expect(handleSelect).toHaveBeenCalledWith(mockPlayers[0]);
  });
});
