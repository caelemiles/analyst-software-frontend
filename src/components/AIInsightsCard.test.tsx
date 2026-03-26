import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import AIInsightsCard from '../components/AIInsightsCard';

describe('AIInsightsCard', () => {
  it('renders AI Insight title', () => {
    render(<AIInsightsCard aiSummary="Great player." playerName="Test Player" />);
    expect(screen.getByText('AI Insight')).toBeInTheDocument();
  });

  it('renders player name', () => {
    render(<AIInsightsCard aiSummary="Great player." playerName="James Collins" />);
    expect(screen.getByText('James Collins')).toBeInTheDocument();
  });

  it('renders AI summary text', () => {
    render(<AIInsightsCard aiSummary="Clinical finisher with strong movement." playerName="Test Player" />);
    expect(screen.getByText('Clinical finisher with strong movement.')).toBeInTheDocument();
  });

  it('renders fallback text when no summary provided', () => {
    render(<AIInsightsCard aiSummary="" playerName="Test Player" />);
    expect(screen.getByText('No AI insights available yet')).toBeInTheDocument();
  });
});
