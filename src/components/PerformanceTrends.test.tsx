import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeAll } from 'vitest';
import PerformanceTrends from '../components/PerformanceTrends';
import type { MatchLog } from '../types';

// Recharts uses ResizeObserver; stub it for jsdom
beforeAll(() => {
  (globalThis as Record<string, unknown>).ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

const sampleLogs: MatchLog[] = [
  { match_date: '2025-09-14', opponent: 'Swindon Town', goals: 2, assists: 0, xG: 1.1, xA: 0.2, minutes: 90, rating: 8.2, dribbles: 2, key_passes: 1, tackles: 1, interceptions: 0 },
  { match_date: '2025-09-21', opponent: 'Gillingham', goals: 0, assists: 1, xG: 0.3, xA: 0.4, minutes: 90, rating: 7.1, dribbles: 1, key_passes: 2, tackles: 0, interceptions: 1 },
];

describe('PerformanceTrends', () => {
  it('renders empty state when no match logs provided', () => {
    render(<PerformanceTrends matchLogs={[]} />);
    expect(screen.getByText('No match logs available to display trends.')).toBeInTheDocument();
  });

  it('renders chart title "Performance Trends" when match logs exist', () => {
    render(<PerformanceTrends matchLogs={sampleLogs} />);
    expect(screen.getByText('Performance Trends')).toBeInTheDocument();
  });

  it('renders the chart container when match logs are provided', () => {
    const { container } = render(<PerformanceTrends matchLogs={sampleLogs} />);
    expect(container.querySelector('.recharts-responsive-container')).toBeInTheDocument();
  });
});
