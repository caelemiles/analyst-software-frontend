import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeAll } from 'vitest';
import OffensiveRadar from '../components/OffensiveRadar';
import type { PlayerStats } from '../types';

beforeAll(() => {
  (globalThis as Record<string, unknown>).ResizeObserver = class {
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

describe('OffensiveRadar', () => {
  it('renders chart title "Attacking Profile (Per 90)"', () => {
    render(<OffensiveRadar stats={mockStats} />);
    expect(screen.getByText('Attacking Profile (Per 90)')).toBeInTheDocument();
  });

  it('renders the chart container', () => {
    const { container } = render(<OffensiveRadar stats={mockStats} />);
    expect(container.querySelector('.recharts-responsive-container')).toBeInTheDocument();
  });
});
