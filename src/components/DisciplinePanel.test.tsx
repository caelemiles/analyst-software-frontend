import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import DisciplinePanel from '../components/DisciplinePanel';
import type { PlayerStats } from '../types';

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
  red_cards: 1,
  fouls_drawn: 30,
  fouls_committed: 20,
};

const gkStats: PlayerStats = {
  ...mockStats,
  saves: 80,
  clean_sheets: 10,
  goals_conceded: 25,
  penalties_saved: 2,
};

describe('DisciplinePanel', () => {
  it('renders discipline stats (yellow cards, red cards)', () => {
    render(<DisciplinePanel stats={mockStats} position="Forward" />);
    expect(screen.getByText('Yellow Cards')).toBeInTheDocument();
    expect(screen.getByText('Red Cards')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('renders "Fouls Drawn" and "Fouls Committed" labels', () => {
    render(<DisciplinePanel stats={mockStats} position="Forward" />);
    expect(screen.getByText('Fouls Drawn')).toBeInTheDocument();
    expect(screen.getByText('Fouls Committed')).toBeInTheDocument();
  });

  it('renders goalkeeping section when position is "Goalkeeper"', () => {
    render(<DisciplinePanel stats={gkStats} position="Goalkeeper" />);
    expect(screen.getByText('Goalkeeping')).toBeInTheDocument();
    expect(screen.getByText('Saves')).toBeInTheDocument();
    expect(screen.getByText('Clean Sheets')).toBeInTheDocument();
    expect(screen.getByText('Goals Conceded')).toBeInTheDocument();
    expect(screen.getByText('Penalties Saved')).toBeInTheDocument();
  });

  it('does NOT render goalkeeping section for outfield players', () => {
    render(<DisciplinePanel stats={mockStats} position="Forward" />);
    expect(screen.queryByText('Goalkeeping')).not.toBeInTheDocument();
  });
});
