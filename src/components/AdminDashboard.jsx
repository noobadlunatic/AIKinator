import { useState, useEffect } from 'react';

function fmt(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
}

function trunc(str, n = 80) {
  if (!str) return '—';
  return str.length > n ? str.slice(0, n) + '…' : str;
}

function sessionToRow(s) {
  const a = s.answers || {};
  const nodes = s.journeyMap?.nodes || [];
  return {
    Date: fmt(s.savedAt || s.timestamp),
    Industry: a.industry || '—',
    'Problem Description': trunc(a.problemDescription),
    'Risk Level': a.riskLevel || '—',
    'Task Type': a.taskType || '—',
    'Data Availability': a.dataAvailability || '—',
    Goals: Array.isArray(a.primaryGoals) ? a.primaryGoals.join(', ') : (a.primaryGoals || '—'),
    'Journey Steps': nodes.map(n => n.label).join(' → ') || '—',
    'Intervention Types': nodes.map(n => n.interventionType).join(', ') || '—',
    'Node Count': nodes.length,
  };
}

function toCSV(sessions) {
  if (!sessions.length) return '';
  const rows = sessions.map(sessionToRow);
  const headers = Object.keys(rows[0]);
  const escape = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const lines = [
    headers.map(escape).join(','),
    ...rows.map(r => headers.map(h => escape(r[h])).join(',')),
  ];
  return lines.join('\n');
}

function downloadCSV(sessions) {
  const csv = toCSV(sessions);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `aikinator-sessions-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

const COLUMNS = [
  'Date', 'Industry', 'Problem Description', 'Risk Level',
  'Task Type', 'Data Availability', 'Goals', 'Journey Steps',
  'Intervention Types', 'Node Count',
];

export default function AdminDashboard() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('/api/sessions-data')
      .then(r => r.json())
      .then(data => {
        setSessions(data.sessions || []);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message || 'Failed to load sessions');
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-bg p-6">
      {/* Header */}
      <div className="max-w-screen-xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-heading text-2xl text-primary">AIkinator — Sessions</h1>
            {!loading && !error && (
              <p className="text-sm text-text-muted mt-0.5">
                {sessions.length} session{sessions.length !== 1 ? 's' : ''} collected
              </p>
            )}
          </div>
          {sessions.length > 0 && (
            <button
              onClick={() => downloadCSV(sessions)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent/90 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download CSV
            </button>
          )}
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-3">
              <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-text-muted">Loading sessions…</p>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="p-4 rounded-xl bg-confidence-low/10 border border-confidence-low/20 text-confidence-low text-sm">
            {error}
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && sessions.length === 0 && (
          <div className="p-10 rounded-xl border border-border-light bg-bg-card text-center">
            <p className="text-text-muted text-sm">No sessions recorded yet. Complete an assessment to see data here.</p>
          </div>
        )}

        {/* Table */}
        {!loading && !error && sessions.length > 0 && (
          <div className="rounded-xl border border-border-light bg-bg-card overflow-x-auto">
            <table className="w-full text-sm border-collapse min-w-[1200px]">
              <thead>
                <tr className="border-b border-border-light bg-primary/[0.03]">
                  {COLUMNS.map(col => (
                    <th
                      key={col}
                      className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider whitespace-nowrap"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sessions.map((s, i) => {
                  const row = sessionToRow(s);
                  return (
                    <tr
                      key={s.id || i}
                      className="border-b border-border-light last:border-0 hover:bg-primary/[0.02] transition-colors"
                    >
                      {COLUMNS.map(col => (
                        <td
                          key={col}
                          className={`px-4 py-3 text-text align-top ${
                            col === 'Journey Steps' || col === 'Problem Description'
                              ? 'max-w-[260px] whitespace-normal break-words'
                              : 'whitespace-nowrap'
                          }`}
                        >
                          {col === 'Node Count' ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-accent/10 text-accent text-xs font-medium">
                              {row[col]}
                            </span>
                          ) : (
                            <span className="text-xs">{row[col]}</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
