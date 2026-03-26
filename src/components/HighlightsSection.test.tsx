import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import HighlightsSection from '../components/HighlightsSection';

describe('HighlightsSection', () => {
  it('renders empty state when no highlights', () => {
    render(<HighlightsSection highlights={[]} />);
    expect(screen.getByText('No highlights available for this player.')).toBeInTheDocument();
  });

  it('renders highlights with titles and dates', () => {
    const highlights = [
      { id: 'h1', title: 'Goal vs Team A', url: 'https://www.youtube.com/embed/test1', date: '2025-11-15' },
      { id: 'h2', title: 'Assist vs Team B', url: 'https://www.youtube.com/embed/test2', date: '2025-12-02' },
    ];
    render(<HighlightsSection highlights={highlights} />);
    expect(screen.getByText('Goal vs Team A')).toBeInTheDocument();
    expect(screen.getByText('2025-11-15')).toBeInTheDocument();
    expect(screen.getByText('Assist vs Team B')).toBeInTheDocument();
    expect(screen.getByText('2025-12-02')).toBeInTheDocument();
  });

  it('renders iframes with sandbox attribute', () => {
    const highlights = [
      { id: 'h1', title: 'Test', url: 'https://www.youtube.com/embed/test', date: '2025-01-01' },
    ];
    const { container } = render(<HighlightsSection highlights={highlights} />);
    const iframe = container.querySelector('iframe');
    expect(iframe).toHaveAttribute('sandbox', 'allow-scripts allow-same-origin allow-presentation');
  });
});
