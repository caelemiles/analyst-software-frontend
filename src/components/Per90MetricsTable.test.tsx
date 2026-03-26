import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import Per90MetricsTable from '../components/Per90MetricsTable';
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
  red_cards: 0,
  fouls_drawn: 30,
  fouls_committed: 20,
};

describe('Per90MetricsTable', () => {
  it('renders title "Per-90 Metrics"', () => {
    render(<Per90MetricsTable stats={mockStats} />);
    expect(screen.getByText('Per-90 Metrics')).toBeInTheDocument();
  });

  it('renders per 90 toggle buttons', () => {
    render(<Per90MetricsTable stats={mockStats} />);
    expect(screen.getByText('Per 90')).toBeInTheDocument();
    expect(screen.getByText('Per Match')).toBeInTheDocument();
  });

  it('shows per-90 values by default', () => {
    render(<Per90MetricsTable stats={mockStats} />);
    expect(screen.getByText(/Based on.*minutes played/)).toBeInTheDocument();
  });

  it('switches to total view when clicking Per Match', async () => {
    const user = userEvent.setup();
    render(<Per90MetricsTable stats={mockStats} />);
    await user.click(screen.getByText('Per Match'));
    expect(screen.getByText(/Season totals from.*appearances/)).toBeInTheDocument();
  });

  it('renders export CSV button', () => {
    render(<Per90MetricsTable stats={mockStats} />);
    expect(screen.getByText('📥 Export CSV')).toBeInTheDocument();
  });

  it('renders metric labels', () => {
    render(<Per90MetricsTable stats={mockStats} />);
    expect(screen.getByText('Goals')).toBeInTheDocument();
    expect(screen.getByText('Assists')).toBeInTheDocument();
    expect(screen.getByText('Tackles')).toBeInTheDocument();
    expect(screen.getByText('Key Passes')).toBeInTheDocument();
  });
});
