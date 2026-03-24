import { useMemo, useState } from 'react';

function formatSeconds(value) {
  if (typeof value !== 'number' || Number.isNaN(value)) return '';
  const mins = Math.floor(value / 60);
  const secs = Math.floor(value % 60);
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

function getChunkTimingLabel(chunk) {
  const segments = Array.isArray(chunk?.segments) ? chunk.segments : [];
  if (!segments.length) return '';
  const start = segments[0]?.start;
  const end = segments[segments.length - 1]?.end;
  if (typeof start !== 'number' || typeof end !== 'number') return '';
  return `${formatSeconds(start)} - ${formatSeconds(end)}`;
}

export default function TranscriptPreview({ sessionData, onApprove, onBack }) {
  const [isApproving, setIsApproving] = useState(false);
  const [viewMode, setViewMode] = useState('full');
  const [textMode, setTextMode] = useState('raw');

  const chunks = Array.isArray(sessionData?.transcript_chunks) ? sessionData.transcript_chunks : [];

  const fullRawTranscript = useMemo(
    () => chunks.map((chunk) => (chunk.raw_text || chunk.text || '').trim()).filter(Boolean).join('\n\n'),
    [chunks]
  );

  const fullCleanedTranscript = useMemo(
    () => chunks.map((chunk) => (chunk.cleaned_text || chunk.raw_text || chunk.text || '').trim()).filter(Boolean).join('\n\n'),
    [chunks]
  );

  const fullTranscript = textMode === 'cleaned' ? fullCleanedTranscript : fullRawTranscript;
  const transcriptWordCount = fullTranscript ? fullTranscript.split(/\s+/).length : 0;

  const totalDurationSeconds = useMemo(
    () =>
      chunks.reduce((acc, chunk) => {
        const segments = Array.isArray(chunk?.segments) ? chunk.segments : [];
        if (!segments.length) return acc;
        const start = segments[0]?.start;
        const end = segments[segments.length - 1]?.end;
        if (typeof start !== 'number' || typeof end !== 'number') return acc;
        return acc + Math.max(0, end - start);
      }, 0),
    [chunks]
  );

  const handleApprove = async () => {
    setIsApproving(true);
    try {
      await onApprove();
    } finally {
      setIsApproving(false);
    }
  };

  return (
    <div className="transcript-preview">
      <div className="preview-header">
        <h2>Transcription Preview</h2>
        <p>
          File: <strong>{sessionData.filename}</strong> | Segments: <strong>{chunks.length}</strong>
        </p>
      </div>

      <div className="preview-summary">
        <div className="summary-card">
          <span className="summary-label">Words</span>
          <span className="summary-value">{transcriptWordCount}</span>
        </div>
        <div className="summary-card">
          <span className="summary-label">Duration</span>
          <span className="summary-value">{formatSeconds(totalDurationSeconds) || 'n/a'}</span>
        </div>
        <div className="summary-card">
          <span className="summary-label">View</span>
          <span className="summary-value">{viewMode === 'full' ? 'Full' : 'Segmented'}</span>
        </div>
      </div>

      <div className="preview-actions">
        <button className="btn btn-secondary" onClick={onBack} disabled={isApproving}>
          Back to Upload
        </button>
        <button className="btn btn-primary" onClick={handleApprove} disabled={isApproving}>
          {isApproving ? (
            <>
              <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2, marginRight: 8 }} />
              Processing...
            </>
          ) : (
            'Approve and Generate Notes'
          )}
        </button>
      </div>

      <div className="transcript-shell">
        <div className="transcript-toolbar">
          <div className="toggle-group">
            <button
              type="button"
              className={`toggle-btn ${viewMode === 'full' ? 'active' : ''}`}
              onClick={() => setViewMode('full')}
            >
              Full Transcript
            </button>
            <button
              type="button"
              className={`toggle-btn ${viewMode === 'segments' ? 'active' : ''}`}
              onClick={() => setViewMode('segments')}
            >
              Segments
            </button>
          </div>

          {viewMode === 'full' && (
            <div className="toggle-group">
              <button
                type="button"
                className={`toggle-btn ${textMode === 'raw' ? 'active' : ''}`}
                onClick={() => setTextMode('raw')}
              >
                Raw
              </button>
              <button
                type="button"
                className={`toggle-btn ${textMode === 'cleaned' ? 'active' : ''}`}
                onClick={() => setTextMode('cleaned')}
              >
                Cleaned
              </button>
            </div>
          )}
        </div>

        <div className="transcript-content">
          {chunks.length === 0 ? (
            <div className="no-transcript">
              <p>No transcript data available.</p>
            </div>
          ) : viewMode === 'full' ? (
            <div className="full-transcript-panel">
              <pre className="full-transcript-text">{fullTranscript || 'No transcript text available.'}</pre>
            </div>
          ) : (
            <div className="segment-list">
              {chunks.map((chunk, index) => (
                <article key={`${index}-${chunk.raw_text || chunk.cleaned_text || ''}`} className="transcript-chunk-card">
                  <div className="transcript-chunk-header">
                    <span className="chunk-number">Segment {index + 1}</span>
                    <span className="chunk-timestamp">{getChunkTimingLabel(chunk)}</span>
                  </div>

                  <div className="chunk-section">
                    <p className="chunk-section-label">Raw Transcript</p>
                    <p className="chunk-text">{chunk.raw_text || chunk.text || 'No text available.'}</p>
                  </div>

                  {chunk.cleaned_text && chunk.cleaned_text !== chunk.raw_text && (
                    <div className="chunk-section">
                      <p className="chunk-section-label">Cleaned Transcript</p>
                      <p className="chunk-text">{chunk.cleaned_text}</p>
                    </div>
                  )}

                  <div className="chunk-confidence">
                    Confidence: {typeof chunk.avg_confidence === 'number' ? `${chunk.avg_confidence.toFixed(2)} avg logprob` : 'n/a'}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="preview-footer">
        <div className="approval-note">
          <h3>Review the transcript before generating notes</h3>
          <p>
            The default view now shows the complete transcript across all segments. Use Segments view if you want to inspect
            chunk-by-chunk output.
          </p>
          <p>
            If the transcript looks correct, continue with note generation and Q&A indexing.
          </p>
        </div>
      </div>
    </div>
  );
}
