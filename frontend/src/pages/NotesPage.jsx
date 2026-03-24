import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import QAChat from '../components/QAChat.jsx';

export default function NotesPage({ session }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('notes');

  useEffect(() => {
    if (!session) navigate('/');
  }, [session, navigate]);

  if (!session) return null;

  const { session_id, filename, notes = [], chunk_count } = session;

  const handleExport = (format) => {
    window.open(`/api/v1/export/${session_id}/${format}`, '_blank');
  };

  return (
    <main className="container" style={{ paddingTop: 32, paddingBottom: 60 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 700, marginBottom: 4 }}>
          Lecture Notes
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          {filename} - {chunk_count} sections processed
        </p>
      </div>

      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-number">{chunk_count}</div>
          <div className="stat-label">Sections</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{notes.filter((n) => n.confidence === 'HIGH').length}</div>
          <div className="stat-label">High Confidence</div>
        </div>
      </div>

      <div className="export-bar">
        <span>Export notes as:</span>
        <button className="btn btn-secondary btn-sm" onClick={() => handleExport('pdf')}>PDF</button>
        <button className="btn btn-secondary btn-sm" onClick={() => handleExport('docx')}>DOCX</button>
        <button className="btn btn-secondary btn-sm" onClick={() => handleExport('txt')}>TXT</button>
      </div>

      <div className="tabs">
        <button id="tab-notes" className={`tab ${activeTab === 'notes' ? 'active' : ''}`} onClick={() => setActiveTab('notes')}>Notes</button>
        <button id="tab-qa" className={`tab ${activeTab === 'qa' ? 'active' : ''}`} onClick={() => setActiveTab('qa')}>Q&A</button>
      </div>

      {activeTab === 'notes' && (
        <div className="notes-grid">
          {notes.map((chunk, i) => (
            <div key={i} className="notes-chunk" style={{ animationDelay: `${i * 0.06}s` }}>
              <div className="chunk-header">
                <div className="chunk-topic">
                  Section {i + 1}: {chunk.topic || 'Untitled Section'}
                </div>
                <span className={`confidence-badge confidence-${chunk.confidence}`}>
                  {chunk.confidence}
                </span>
              </div>

              {chunk.key_points?.length > 0 && (
                <>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 6, fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Key Points</p>
                  <ul className="key-points">
                    {chunk.key_points.map((kp, j) => <li key={j}>{kp}</li>)}
                  </ul>
                </>
              )}

              {chunk.definitions && Object.keys(chunk.definitions).length > 0 && (
                <div className="definitions-section">
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 6, fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Definitions</p>
                  {Object.entries(chunk.definitions).map(([term, defn]) => (
                    <div key={term} className="def-item">
                      <span className="def-term">{term}:</span> {defn}
                    </div>
                  ))}
                </div>
              )}

              {chunk.summary && (
                <div className="chunk-summary">{chunk.summary}</div>
              )}
            </div>
          ))}
        </div>
      )}

      {activeTab === 'qa' && (
        <div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 16 }}>
            Ask questions grounded in this lecture. Answers are retrieved from actual transcript content.
          </p>
          <QAChat sessionId={session_id} />
        </div>
      )}
    </main>
  );
}
