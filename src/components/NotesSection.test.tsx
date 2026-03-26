import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import NotesSection from '../components/NotesSection';

describe('NotesSection', () => {
  it('renders AI summary when provided', () => {
    render(
      <NotesSection
        playerId={1}
        notes=""
        aiSummary="Great player with excellent skills"
        onNotesUpdated={() => {}}
      />
    );
    expect(screen.getByText('🤖 AI Summary')).toBeInTheDocument();
    expect(screen.getByText('Great player with excellent skills')).toBeInTheDocument();
  });

  it('renders notes textarea with existing notes', () => {
    render(
      <NotesSection
        playerId={1}
        notes="My scouting notes"
        aiSummary=""
        onNotesUpdated={() => {}}
      />
    );
    const textarea = screen.getByPlaceholderText('Add your scouting notes here...');
    expect(textarea).toHaveValue('My scouting notes');
  });

  it('allows typing new notes', async () => {
    const user = userEvent.setup();
    render(
      <NotesSection
        playerId={1}
        notes=""
        aiSummary=""
        onNotesUpdated={() => {}}
      />
    );
    const textarea = screen.getByPlaceholderText('Add your scouting notes here...');
    await user.type(textarea, 'New note');
    expect(textarea).toHaveValue('New note');
  });

  it('renders save button', () => {
    render(
      <NotesSection
        playerId={1}
        notes=""
        aiSummary=""
        onNotesUpdated={() => {}}
      />
    );
    expect(screen.getByRole('button', { name: 'Save Notes' })).toBeInTheDocument();
  });
});
