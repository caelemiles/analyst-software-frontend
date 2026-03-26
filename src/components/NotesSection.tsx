import { useState } from 'react';
import { updatePlayerNotes } from '../api/client';

interface NotesSectionProps {
  playerId: number;
  notes: string;
  aiSummary: string;
  onNotesUpdated: (notes: string) => void;
}

export default function NotesSection({ playerId, notes, aiSummary, onNotesUpdated }: NotesSectionProps) {
  const [currentNotes, setCurrentNotes] = useState(notes);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  const handleSave = async () => {
    setSaving(true);
    setSaveMessage('');
    try {
      await updatePlayerNotes(playerId, currentNotes);
      onNotesUpdated(currentNotes);
      setSaveMessage('Notes saved successfully!');
    } catch {
      setSaveMessage('Could not reach server. Notes saved locally.');
      onNotesUpdated(currentNotes);
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMessage(''), 3000);
    }
  };

  return (
    <div className="space-y-6">
      {aiSummary && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-indigo-800 mb-2">🤖 AI Summary</h3>
          <p className="text-sm text-indigo-700">{aiSummary}</p>
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Personal Notes</h3>
        <textarea
          value={currentNotes}
          onChange={(e) => setCurrentNotes(e.target.value)}
          placeholder="Add your scouting notes here..."
          rows={6}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-y"
        />
        <div className="mt-3 flex items-center justify-between">
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? 'Saving...' : 'Save Notes'}
          </button>
          {saveMessage && (
            <span className="text-sm text-green-600">{saveMessage}</span>
          )}
        </div>
      </div>
    </div>
  );
}
