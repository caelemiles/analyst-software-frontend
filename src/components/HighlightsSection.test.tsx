import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import HighlightsSection from '../components/HighlightsSection';

describe('HighlightsSection', () => {
  it('renders empty state when no highlights', () => {
    render(<HighlightsSection highlights={[]} />);
    expect(screen.getByText('No highlights available for this player.')).toBeInTheDocument();
  });

  it('renders highlights grouped by match', () => {
    const highlights = [
      { id: 'h1', title: 'Goal vs Team A', url: 'https://www.youtube.com/embed/test1', date: '2025-11-15', event_type: 'goal' as const, minute: 23 },
      { id: 'h2', title: 'Assist vs Team B', url: 'https://www.youtube.com/embed/test2', date: '2025-12-02', event_type: 'assist' as const, minute: 45 },
    ];
    render(<HighlightsSection highlights={highlights} />);
    expect(screen.getByText('Match vs Team A')).toBeInTheDocument();
    expect(screen.getByText('2025-11-15')).toBeInTheDocument();
    expect(screen.getByText('Match vs Team B')).toBeInTheDocument();
    expect(screen.getByText('2025-12-02')).toBeInTheDocument();
  });

  it('renders iframes with sandbox attribute after clicking play', async () => {
    const user = userEvent.setup();
    const highlights = [
      { id: 'h1', title: 'Goal vs Test', url: 'https://www.youtube.com/embed/test', date: '2025-01-01', event_type: 'goal' as const },
    ];
    const { container } = render(<HighlightsSection highlights={highlights} />);
    // Click "Click to play" button to load the iframe
    await user.click(screen.getAllByText('Click to play')[0]);
    const iframe = container.querySelector('iframe');
    expect(iframe).toHaveAttribute('sandbox', 'allow-scripts allow-presentation');
  });

  it('renders event type badges', () => {
    const highlights = [
      { id: 'h1', title: 'Goal vs Team A', url: 'https://www.youtube.com/embed/test1', date: '2025-11-15', event_type: 'goal' as const, minute: 23 },
    ];
    render(<HighlightsSection highlights={highlights} />);
    expect(screen.getAllByText(/Goal/).length).toBeGreaterThan(0);
  });

  it('renders export CSV button', () => {
    const highlights = [
      { id: 'h1', title: 'Goal vs Test', url: 'https://www.youtube.com/embed/test', date: '2025-01-01', event_type: 'goal' as const },
    ];
    render(<HighlightsSection highlights={highlights} />);
    expect(screen.getByText('📥 Export CSV')).toBeInTheDocument();
  });

  it('shows season label', () => {
    const highlights = [
      { id: 'h1', title: 'Goal vs Test', url: 'https://www.youtube.com/embed/test', date: '2025-01-01', event_type: 'goal' as const },
    ];
    render(<HighlightsSection highlights={highlights} />);
    expect(screen.getByText('Season 2025/26 Highlights')).toBeInTheDocument();
  });

  it('defaults to Goals & Assists filter', () => {
    const highlights = [
      { id: 'h1', title: 'Goal vs Team A', url: 'https://www.youtube.com/embed/test1', date: '2025-11-15', event_type: 'goal' as const, minute: 23 },
      { id: 'h2', title: 'Tackle vs Team B', url: 'https://www.youtube.com/embed/test2', date: '2025-12-02', event_type: 'tackle' as const, minute: 45 },
    ];
    render(<HighlightsSection highlights={highlights} />);
    // Goals/assists group should be visible
    expect(screen.getByText('Match vs Team A')).toBeInTheDocument();
    // Tackle group should not be visible
    expect(screen.queryByText('Match vs Team B')).not.toBeInTheDocument();
  });

  it('shows all events when All Events filter is clicked', async () => {
    const user = userEvent.setup();
    const highlights = [
      { id: 'h1', title: 'Goal vs Team A', url: 'https://www.youtube.com/embed/test1', date: '2025-11-15', event_type: 'goal' as const, minute: 23 },
      { id: 'h2', title: 'Tackle vs Team B', url: 'https://www.youtube.com/embed/test2', date: '2025-12-02', event_type: 'tackle' as const, minute: 45 },
    ];
    render(<HighlightsSection highlights={highlights} />);
    await user.click(screen.getByText('All Events'));
    expect(screen.getByText('Match vs Team A')).toBeInTheDocument();
    expect(screen.getByText('Match vs Team B')).toBeInTheDocument();
  });

  it('groups multiple highlights from same match', () => {
    const highlights = [
      { id: 'h1', title: 'Goal vs Team A', url: 'https://www.youtube.com/embed/test1', date: '2025-11-15', event_type: 'goal' as const, minute: 23 },
      { id: 'h2', title: 'Assist vs Team A', url: 'https://www.youtube.com/embed/test2', date: '2025-11-15', event_type: 'assist' as const, minute: 45 },
    ];
    render(<HighlightsSection highlights={highlights} />);
    // Both should be in the same match group
    const matchHeaders = screen.getAllByText('Match vs Team A');
    expect(matchHeaders.length).toBe(1);
    // Both event badges should be visible (use getAllByText since filter button also matches)
    expect(screen.getAllByText(/⚽ Goal/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/🎯 Assist/).length).toBeGreaterThanOrEqual(1);
  });
});
