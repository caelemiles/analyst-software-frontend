import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import HighlightsSection from '../components/HighlightsSection';

describe('HighlightsSection', () => {
  it('renders empty state when no highlights', () => {
    render(<HighlightsSection highlights={[]} />);
    expect(screen.getByText('No highlights available for this player.')).toBeInTheDocument();
  });

  it('renders highlights with titles and dates', () => {
    const highlights = [
      { id: 'h1', title: 'Goal vs Team A', url: 'https://www.youtube.com/embed/test1', date: '2025-11-15', event_type: 'goal' as const, minute: 23 },
      { id: 'h2', title: 'Assist vs Team B', url: 'https://www.youtube.com/embed/test2', date: '2025-12-02', event_type: 'assist' as const, minute: 45 },
    ];
    render(<HighlightsSection highlights={highlights} />);
    expect(screen.getByText('Goal vs Team A')).toBeInTheDocument();
    expect(screen.getByText('2025-11-15')).toBeInTheDocument();
    expect(screen.getByText('Assist vs Team B')).toBeInTheDocument();
    expect(screen.getByText('2025-12-02')).toBeInTheDocument();
  });

  it('renders iframes with sandbox attribute after clicking play', async () => {
    const user = userEvent.setup();
    const highlights = [
      { id: 'h1', title: 'Test', url: 'https://www.youtube.com/embed/test', date: '2025-01-01', event_type: 'goal' as const },
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
    expect(screen.getAllByText('Goal').length).toBeGreaterThan(0);
  });

  it('renders export CSV button', () => {
    const highlights = [
      { id: 'h1', title: 'Test', url: 'https://www.youtube.com/embed/test', date: '2025-01-01', event_type: 'goal' as const },
    ];
    render(<HighlightsSection highlights={highlights} />);
    expect(screen.getByText('📥 Export CSV')).toBeInTheDocument();
  });

  it('shows season label', () => {
    const highlights = [
      { id: 'h1', title: 'Test', url: 'https://www.youtube.com/embed/test', date: '2025-01-01', event_type: 'goal' as const },
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
    expect(screen.getByText('Goal vs Team A')).toBeInTheDocument();
    expect(screen.queryByText('Tackle vs Team B')).not.toBeInTheDocument();
  });

  it('shows all events when All Events filter is clicked', async () => {
    const user = userEvent.setup();
    const highlights = [
      { id: 'h1', title: 'Goal vs Team A', url: 'https://www.youtube.com/embed/test1', date: '2025-11-15', event_type: 'goal' as const, minute: 23 },
      { id: 'h2', title: 'Tackle vs Team B', url: 'https://www.youtube.com/embed/test2', date: '2025-12-02', event_type: 'tackle' as const, minute: 45 },
    ];
    render(<HighlightsSection highlights={highlights} />);
    await user.click(screen.getByText('All Events'));
    expect(screen.getByText('Goal vs Team A')).toBeInTheDocument();
    expect(screen.getByText('Tackle vs Team B')).toBeInTheDocument();
  });

  it('paginates highlights (4 per page)', async () => {
    const user = userEvent.setup();
    const highlights = Array.from({ length: 6 }, (_, i) => ({
      id: `h${i}`,
      title: `Goal ${i + 1}`,
      url: 'https://www.youtube.com/embed/test',
      date: '2025-11-15',
      event_type: 'goal' as const,
      minute: 10 + i,
    }));
    render(<HighlightsSection highlights={highlights} />);
    // First page: 4 video cards
    expect(screen.getByText('Goal 1')).toBeInTheDocument();
    expect(screen.getByText('Goal 4')).toBeInTheDocument();
    expect(screen.queryByText('Goal 5')).not.toBeInTheDocument();
    expect(screen.getByText(/Page 1 of 2/)).toBeInTheDocument();
    // Navigate to next page
    await user.click(screen.getByText('Next →'));
    expect(screen.getByText('Goal 5')).toBeInTheDocument();
    expect(screen.queryByText('Goal 1')).not.toBeInTheDocument();
  });
});
