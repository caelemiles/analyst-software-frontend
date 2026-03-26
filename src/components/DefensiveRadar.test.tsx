import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeAll } from 'vitest';
import DefensiveRadar from '../components/DefensiveRadar';
import type { PlayerStats } from '../types';

beforeAll(() => {
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

const mockStats: PlayerStats = {
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
};

describe('DefensiveRadar', () => {
  it('renders chart title "Defensive & Physical Profile (Per 90)"', () => {
    render(<DefensiveRadar stats={mockStats} />);
    expect(screen.getByText('Defensive & Physical Profile (Per 90)')).toBeInTheDocument();
  });

  it('renders the chart container', () => {
    const { container } = render(<DefensiveRadar stats={mockStats} />);
    expect(container.querySelector('.recharts-responsive-container')).toBeInTheDocument();
  });
});
