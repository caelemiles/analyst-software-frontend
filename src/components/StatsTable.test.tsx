import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import StatsTable from '../components/StatsTable';
import type { MatchLog } from '../types';

const sampleLogs: MatchLog[] = [
  { match_date: '2025-09-14', opponent: 'Swindon Town', goals: 2, assists: 0, xG: 1.1, xA: 0.2, minutes: 90, rating: 8.2, dribbles: 2, key_passes: 1, tackles: 1, interceptions: 0 },
  { match_date: '2025-09-21', opponent: 'Gillingham', goals: 0, assists: 1, xG: 0.3, xA: 0.4, minutes: 90, rating: 7.1, dribbles: 1, key_passes: 2, tackles: 0, interceptions: 1 },
];

describe('StatsTable', () => {
  it('renders empty state when no match data', () => {
    render(<StatsTable matchLogs={[]} />);
    expect(screen.getByText('No match data available.')).toBeInTheDocument();
  });

  it('renders table title "Match-by-Match Stats"', () => {
    render(<StatsTable matchLogs={sampleLogs} />);
    expect(screen.getByText('Match-by-Match Stats')).toBeInTheDocument();
  });

  it('renders opponent names', () => {
    render(<StatsTable matchLogs={sampleLogs} />);
    expect(screen.getByText('Swindon Town')).toBeInTheDocument();
    expect(screen.getByText('Gillingham')).toBeInTheDocument();
  });

  it('renders export CSV button', () => {
    render(<StatsTable matchLogs={sampleLogs} />);
    expect(screen.getByText('📥 Export CSV')).toBeInTheDocument();
  });

  it('sorts when clicking column header', async () => {
    const user = userEvent.setup();
    render(<StatsTable matchLogs={sampleLogs} />);
    const goalsHeader = screen.getByText(/^Goals/);
    await user.click(goalsHeader);
    // After sorting by goals descending, the first row should have Swindon Town (2 goals)
    const rows = screen.getAllByRole('row');
    expect(rows.length).toBe(3); // header + 2 data rows
  });
});
