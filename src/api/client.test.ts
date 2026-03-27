import { describe, it, expect } from 'vitest';
import { normalizePlayer } from './client';

describe('normalizePlayer', () => {
  it('uses name field when present', () => {
    const raw = { id: 1, name: 'John Doe', team: 'Team A', position: 'Forward', age: 25, nationality: 'England', stats: {} };
    const result = normalizePlayer(raw);
    expect(result.name).toBe('John Doe');
  });

  it('constructs name from firstname and lastname', () => {
    const raw = { id: 2, firstname: 'Jane', lastname: 'Smith', team: 'Team B', position: 'Midfielder', age: 23, nationality: 'Wales', stats: {} };
    const result = normalizePlayer(raw);
    expect(result.name).toBe('Jane Smith');
  });

  it('uses firstname only when lastname is missing', () => {
    const raw = { id: 3, firstname: 'Carlos', team: 'Team C', position: 'Defender', age: 30, nationality: 'Spain', stats: {} };
    const result = normalizePlayer(raw);
    expect(result.name).toBe('Carlos');
  });

  it('falls back to Unknown when no name fields exist', () => {
    const raw = { id: 4, team: 'Team D', position: 'Goalkeeper', age: 28, nationality: 'France', stats: {} };
    const result = normalizePlayer(raw);
    expect(result.name).toBe('Unknown');
  });

  it('prefers name over firstname/lastname', () => {
    const raw = { id: 5, name: 'Full Name', firstname: 'First', lastname: 'Last', team: 'Team E', position: 'Forward', age: 22, nationality: 'Germany', stats: {} };
    const result = normalizePlayer(raw);
    expect(result.name).toBe('Full Name');
  });

  it('strips firstname/lastname from output', () => {
    const raw = { id: 6, firstname: 'Test', lastname: 'Player', team: 'Team F', position: 'Forward', age: 20, nationality: 'Italy', stats: {} };
    const result = normalizePlayer(raw);
    expect(result).not.toHaveProperty('firstname');
    expect(result).not.toHaveProperty('lastname');
  });
});
