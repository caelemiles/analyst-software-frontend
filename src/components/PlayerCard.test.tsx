import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import PlayerCard from '../components/PlayerCard';
import type { Player } from '../types';

const mockPlayer: Player = {
  id: 1,
  name: 'Test Player',
  team: 'Test FC',
  position: 'Forward',
  age: 24,
  nationality: 'England',
  stats: {
    appearances: 30,
    goals: 10,
    assists: 5,
    xG: 9.2,
    xA: 4.8,
    passes_completed: 400,
    pass_accuracy: 80,
    tackles: 15,
    interceptions: 10,
    clearances: 5,
    minutes_played: 2500,
    rating: 7.2,
    npxG: 7.8,
    dribbles: 35,
    key_passes: 28,
    aerial_duels_won: 40,
    yellow_cards: 3,
    red_cards: 0,
    fouls_drawn: 30,
    fouls_committed: 20,
  },
};

describe('PlayerCard', () => {
  it('renders player name and team', () => {
    render(
      <MemoryRouter>
        <PlayerCard player={mockPlayer} />
      </MemoryRouter>
    );
    expect(screen.getByText('Test Player')).toBeInTheDocument();
    expect(screen.getByText('Test FC')).toBeInTheDocument();
  });

  it('renders player position badge', () => {
    render(
      <MemoryRouter>
        <PlayerCard player={mockPlayer} />
      </MemoryRouter>
    );
    expect(screen.getByText('Forward')).toBeInTheDocument();
  });

  it('renders player stats', () => {
    render(
      <MemoryRouter>
        <PlayerCard player={mockPlayer} />
      </MemoryRouter>
    );
    expect(screen.getByText('10')).toBeInTheDocument(); // goals
    expect(screen.getByText('5')).toBeInTheDocument(); // assists
    expect(screen.getByText('30')).toBeInTheDocument(); // appearances
  });

  it('renders age and nationality', () => {
    render(
      <MemoryRouter>
        <PlayerCard player={mockPlayer} />
      </MemoryRouter>
    );
    expect(screen.getByText('Age: 24')).toBeInTheDocument();
    expect(screen.getByText('England')).toBeInTheDocument();
  });

  it('links to player profile page', () => {
    render(
      <MemoryRouter>
        <PlayerCard player={mockPlayer} />
      </MemoryRouter>
    );
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/player/1');
  });
});
