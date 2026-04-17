import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

function formatDate(value) {
  if (!value) return 'Unknown';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString();
}

export default function HistoryPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch('/api/v1/notes/history?limit=50');
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || 'Failed to load history');
        if (mounted) setItems(Array.isArray(data.items) ? data.items : []);
      } catch (err) {
        if (mounted) setError(err.message || 'Failed to load history');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    run();
    return () => {
      mounted = false;
    };
  }, []);

  const hasItems = useMemo(() => items.length > 0, [items]);

  return (
    <main className="container history-page">
      <div className="history-header">
        <h1>Session History</h1>
        <p>Previously processed lectures and generated notes.</p>
      </div>

      {loading && <p className="history-feedback">Loading history...</p>}
      {!loading && error && <p className="history-feedback history-error">{error}</p>}
      {!loading && !error && !hasItems && (
        <p className="history-feedback">No processed sessions yet. Upload audio to generate your first notes.</p>
      )}

      {!loading && !error && hasItems && (
        <div className="history-list">
          {items.map((item) => (
            <button
              key={item.session_id}
              type="button"
              className="history-item"
              onClick={() => navigate(`/results/${item.session_id}`)}
            >
              <div className="history-item-main">
                <h3>{item.filename || 'Untitled audio'}</h3>
                <p>{item.chunk_count || 0} sections</p>
              </div>
              <div className="history-item-meta">
                <span>Updated {formatDate(item.updated_at)}</span>
                <span className="history-item-id">{item.session_id.slice(0, 8)}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </main>
  );
}

