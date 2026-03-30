import { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { fetchPlayers, exportPortfolio } from '../api/client';
import type { Player } from '../types';

export default function Portfolio() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    async function loadPlayers() {
      try {
        const data = await fetchPlayers();
        setPlayers(data);
      } catch {
        setPlayers([]);
      } finally {
        setLoading(false);
      }
    }
    loadPlayers();
  }, []);

  const togglePlayer = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectAll = () => {
    if (selectedIds.size === players.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(players.map((p) => p.id)));
    }
  };

  const handleExportCSV = () => {
    if (selectedIds.size === 0) return;
    const selected = players.filter((p) => selectedIds.has(p.id));
    const escapeCSV = (val: string | number) => {
      const str = String(val);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };
    const headers = ['Name', 'Team', 'Position', 'Age', 'Appearances', 'Goals', 'Assists', 'xG', 'xA', 'Pass Accuracy', 'Tackles', 'Rating'];
    const rows = selected.map((p) => [
      p.name,
      p.team,
      p.position,
      p.age,
      p.stats.appearances,
      p.stats.goals,
      p.stats.assists,
      p.stats.xG,
      p.stats.xA,
      `${p.stats.pass_accuracy}%`,
      p.stats.tackles,
      p.stats.rating.toFixed(1),
    ]);
    const csvContent = [headers, ...rows].map((row) => row.map(escapeCSV).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'scouting-portfolio.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExport = async () => {
    if (selectedIds.size === 0) return;
    setExporting(true);

    try {
      const blob = await exportPortfolio([...selectedIds]);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'scouting-portfolio.pdf';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      generateLocalPdf();
    } finally {
      setExporting(false);
    }
  };

  const generateLocalPdf = () => {
    const selected = players.filter((p) => selectedIds.has(p.id));
    const doc = new jsPDF();

    doc.setFontSize(20);
    doc.text('EFL League Two Scouting Portfolio', 14, 22);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 30);
    doc.text(`Players: ${selected.length}`, 14, 36);

    let yPos = 45;

    selected.forEach((player, index) => {
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(14);
      doc.text(`${index + 1}. ${player.name}`, 14, yPos);
      yPos += 7;
      doc.setFontSize(10);
      doc.text(`Team: ${player.team} | Position: ${player.position} | Age: ${player.age}`, 14, yPos);
      yPos += 7;

      if (player.ai_summary) {
        doc.setFontSize(9);
        const summaryLines = doc.splitTextToSize(`AI Summary: ${player.ai_summary}`, 180);
        doc.text(summaryLines, 14, yPos);
        yPos += summaryLines.length * 5 + 3;
      }

      if (player.notes) {
        doc.setFontSize(9);
        const notesLines = doc.splitTextToSize(`Notes: ${player.notes}`, 180);
        doc.text(notesLines, 14, yPos);
        yPos += notesLines.length * 5 + 3;
      }

      yPos += 5;
    });

    doc.addPage();
    doc.setFontSize(14);
    doc.text('Player Comparison', 14, 20);

    autoTable(doc, {
      startY: 30,
      head: [['Player', 'Team', 'Pos', 'Age', 'Apps', 'Goals', 'Assists', 'xG', 'xA', 'Pass %']],
      body: selected.map((p) => [
        p.name,
        p.team,
        p.position,
        p.age,
        p.stats.appearances,
        p.stats.goals,
        p.stats.assists,
        p.stats.xG,
        p.stats.xA,
        `${p.stats.pass_accuracy}%`,
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [79, 70, 229] },
    });

    doc.save('scouting-portfolio.pdf');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <div className="text-lg text-slate-400">Loading players...</div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Scouting Portfolio</h1>
          <p className="text-slate-400 mt-1">
            Select players to include in your scouting report
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center gap-3">
          <span className="text-sm text-slate-400">
            {selectedIds.size} player{selectedIds.size !== 1 ? 's' : ''} selected
          </span>
          <button
            onClick={handleExportCSV}
            disabled={selectedIds.size === 0}
            className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            📊 Export CSV
          </button>
          <button
            onClick={handleExport}
            disabled={selectedIds.size === 0 || exporting}
            className="gradient-accent text-white px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {exporting ? 'Exporting...' : '📄 Export PDF'}
          </button>
        </div>
      </div>

      <div className="glass rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-700/50 flex items-center">
          <label className="flex items-center text-sm text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={selectedIds.size === players.length && players.length > 0}
              onChange={selectAll}
              className="mr-2 h-4 w-4 text-indigo-600 rounded border-slate-600 bg-slate-800 focus:ring-indigo-500"
            />
            Select All
          </label>
        </div>
        <ul className="divide-y divide-slate-700/50">
          {players.map((player) => (
            <li key={player.id} className="px-4 py-3 hover:bg-slate-800/50 transition-colors">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedIds.has(player.id)}
                  onChange={() => togglePlayer(player.id)}
                  className="mr-3 h-4 w-4 text-indigo-600 rounded border-slate-600 bg-slate-800 focus:ring-indigo-500"
                />
                <div className="flex-1 flex items-center justify-between">
                  <div>
                    <span className="font-medium text-white">{player.name}</span>
                    <span className="ml-2 text-sm text-slate-400">{player.team}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-400">
                    <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-medium border border-indigo-500/30">
                      {player.position}
                    </span>
                    <span>Age {player.age}</span>
                    <span>{player.stats.goals}G {player.stats.assists}A</span>
                  </div>
                </div>
              </label>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
