import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import TranscriptPreview from '../components/TranscriptPreview.jsx';

function PipelineUploadIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 15V6" />
      <path d="m8.5 9.5 3.5-3.5 3.5 3.5" />
      <path d="M4.5 18h15" />
    </svg>
  );
}

function PipelineChunkIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="4" y="6" width="7" height="5" rx="1.2" />
      <rect x="13" y="6" width="7" height="5" rx="1.2" />
      <rect x="4" y="13" width="7" height="5" rx="1.2" />
      <rect x="13" y="13" width="7" height="5" rx="1.2" />
    </svg>
  );
}

function PipelineTranscriptionIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 12h2.5l1.5-4 3 8 2.2-5 1.6 3h2.2l1.5-4 2 2h2.5" />
    </svg>
  );
}

function PipelineReviewIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="6" y="4" width="12" height="16" rx="2" />
      <path d="M9 9h6M9 13h6" />
      <path d="m10 17 1.4 1.4L14 16" />
    </svg>
  );
}

const PIPELINE_STEPS = [
  { id: 'upload', label: 'Upload', icon: <PipelineUploadIcon /> },
  { id: 'chunk', label: 'Chunking', icon: <PipelineChunkIcon /> },
  { id: 'transcribe', label: 'Transcription', icon: <PipelineTranscriptionIcon /> },
  { id: 'clean', label: 'Review', icon: <PipelineReviewIcon /> },
];

const TRANSCRIBE_STEPS = ['upload', 'chunk', 'transcribe', 'clean'];

function IllustrationTranscription() {
  return (
    <svg viewBox="0 0 280 160" className="feature-illustration" aria-hidden="true">
      <rect x="10" y="14" width="260" height="132" rx="18" fill="#f7fbff" stroke="#d5e4f9" />
      <rect x="26" y="32" width="84" height="84" rx="14" fill="#eaf3ff" stroke="#c9dcfa" />
      <path d="M54 55v36M82 55v36M54 91h28" stroke="#2d6cdf" strokeWidth="4" strokeLinecap="round" />
      <path
        d="M128 90 C140 72, 153 104, 166 84 C179 64, 192 102, 205 82 C218 62, 231 90, 244 74"
        fill="none"
        stroke="#2d6cdf"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <rect x="128" y="40" width="116" height="10" rx="5" fill="#d5e4f9" />
      <rect x="128" y="58" width="90" height="8" rx="4" fill="#dce9fb" />
      <circle cx="238" cy="54" r="6" fill="#8eb1ef" />
    </svg>
  );
}

function IllustrationNotes() {
  return (
    <svg viewBox="0 0 280 160" className="feature-illustration" aria-hidden="true">
      <rect x="10" y="14" width="260" height="132" rx="18" fill="#f7fbff" stroke="#d5e4f9" />
      <rect x="30" y="30" width="220" height="100" rx="14" fill="#ffffff" stroke="#cfe0f8" />
      <rect x="48" y="48" width="124" height="12" rx="6" fill="#ccdef9" />
      <rect x="48" y="70" width="184" height="8" rx="4" fill="#dbe8fb" />
      <rect x="48" y="86" width="168" height="8" rx="4" fill="#dbe8fb" />
      <rect x="48" y="102" width="144" height="8" rx="4" fill="#dbe8fb" />
      <rect x="196" y="44" width="38" height="38" rx="10" fill="#eaf3ff" stroke="#c9dcfa" />
      <path d="m205 63 8 8 12-16" stroke="#2d6cdf" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IllustrationQA() {
  return (
    <svg viewBox="0 0 280 160" className="feature-illustration" aria-hidden="true">
      <rect x="10" y="14" width="260" height="132" rx="18" fill="#f7fbff" stroke="#d5e4f9" />
      <rect x="26" y="34" width="108" height="44" rx="14" fill="#eaf3ff" stroke="#c9dcfa" />
      <rect x="146" y="58" width="108" height="44" rx="14" fill="#ffffff" stroke="#cfe0f8" />
      <path d="M46 54h68M46 66h50" stroke="#2d6cdf" strokeWidth="3" strokeLinecap="round" />
      <path d="M166 78h70M166 90h44" stroke="#2d6cdf" strokeWidth="3" strokeLinecap="round" />
      <circle cx="98" cy="114" r="20" fill="#eaf3ff" stroke="#c9dcfa" />
      <path d="M92 114h12M98 108v12" stroke="#2d6cdf" strokeWidth="3" strokeLinecap="round" />
      <path d="M132 114h112" stroke="#b5ccf0" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

const VALUE_POINTS = [
  {
    title: 'Reliable Lecture Transcription',
    desc: 'Whisper creates precise transcript blocks with confidence scoring, designed for long-form classes and seminars.',
    illustration: <IllustrationTranscription />,
  },
  {
    title: 'Structured AI Notes',
    desc: 'Generate concise sections with key points, definitions, and summaries your team can review immediately.',
    illustration: <IllustrationNotes />,
  },
  {
    title: 'Grounded Q&A',
    desc: 'Use retrieval over transcript chunks so responses remain linked to source lecture content, not generic model memory.',
    illustration: <IllustrationQA />,
  },
];

const INTEGRATIONS = ['Whisper', 'OpenRouter', 'Mistral', 'FAISS'];

function HeroWaveGraphic() {
  return (
    <svg className="hero-wave" viewBox="0 0 560 360" role="img" aria-label="Product visualization">
      <defs>
        <linearGradient id="waveA" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#2d6cdf" />
          <stop offset="100%" stopColor="#7ca3f2" />
        </linearGradient>
      </defs>
      <rect x="12" y="12" width="536" height="336" rx="24" fill="#ffffff" stroke="#d8e3f7" />
      <rect x="42" y="48" width="170" height="18" rx="9" fill="#eaf1fb" />
      <rect x="42" y="78" width="118" height="10" rx="5" fill="#d6e4fb" />
      <rect x="42" y="104" width="142" height="10" rx="5" fill="#d6e4fb" />
      <g className="hero-wave-motion">
        <path
          className="hero-wave-track"
          d="M44 230 C84 170, 126 280, 166 220 C206 160, 248 276, 288 212 C328 148, 370 270, 410 214 C450 160, 492 244, 528 198"
          stroke="#c7d9f6"
          strokeWidth="5"
          fill="none"
          strokeLinecap="round"
        />
        <path
          className="hero-wave-line hero-wave-line-a"
          d="M44 230 C84 170, 126 280, 166 220 C206 160, 248 276, 288 212 C328 148, 370 270, 410 214 C450 160, 492 244, 528 198"
          stroke="url(#waveA)"
          strokeWidth="5"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          className="hero-wave-line hero-wave-line-b"
          d="M44 230 C84 170, 126 280, 166 220 C206 160, 248 276, 288 212 C328 148, 370 270, 410 214 C450 160, 492 244, 528 198"
          stroke="#9bbaf0"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <rect x="338" y="64" width="188" height="126" rx="14" fill="#f5f8ff" stroke="#d8e3f7" />
      <rect x="356" y="86" width="150" height="12" rx="6" fill="#d6e4fb" />
      <rect x="356" y="110" width="126" height="10" rx="5" fill="#e3ecfb" />
      <rect x="356" y="132" width="146" height="10" rx="5" fill="#e3ecfb" />
      <rect x="356" y="154" width="104" height="10" rx="5" fill="#e3ecfb" />
      <circle cx="102" cy="286" r="24" fill="#2d6cdf" opacity="0.1" />
      <circle cx="454" cy="286" r="16" fill="#2d6cdf" opacity="0.15" />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 15V5" />
      <path d="m8 9 4-4 4 4" />
      <path d="M4 18h16" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m5 12 4 4 10-10" />
    </svg>
  );
}

export default function HomePage({ onSessionReady }) {
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('idle');
  const [activeStep, setActiveStep] = useState(null);
  const [doneSteps, setDoneSteps] = useState([]);
  const [error, setError] = useState('');
  const [sessionData, setSessionData] = useState(null);
  const fileInputRef = useRef();
  const navigate = useNavigate();

  const handleFile = useCallback((f) => {
    if (!f) return;
    const allowed = ['.mp3', '.wav', '.m4a', '.ogg', '.flac'];
    const ext = f.name.slice(f.name.lastIndexOf('.')).toLowerCase();
    if (!allowed.includes(ext)) {
      setError('Unsupported file type. Please upload .mp3, .wav, .m4a, .ogg, or .flac.');
      return;
    }
    setError('');
    setFile(f);
  }, []);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const handleProcess = async () => {
    if (!file) return;
    setStatus('processing');
    setDoneSteps([]);
    setError('');
    setActiveStep('upload');
    let stepInterval = null;

    try {
      const formData = new FormData();
      formData.append('file', file);

      stepInterval = setInterval(() => {
        setDoneSteps((prev) => {
          const nextIdx = prev.length;
          if (nextIdx < TRANSCRIBE_STEPS.length - 1) {
            setActiveStep(TRANSCRIBE_STEPS[nextIdx + 1]);
            return [...prev, TRANSCRIBE_STEPS[nextIdx]];
          }
          return prev;
        });
      }, 2000);

      const res = await fetch('/api/v1/audio/upload', { method: 'POST', body: formData });
      clearInterval(stepInterval);

      if (!res.ok) {
        let errorMessage = 'Processing failed';
        try {
          const err = await res.json();
          errorMessage = err.detail || errorMessage;
        } catch {
          errorMessage = res.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      let data;
      try {
        data = await res.json();
      } catch {
        throw new Error('Invalid response from server');
      }

      setDoneSteps(TRANSCRIBE_STEPS);
      setActiveStep(null);
      setStatus('transcribed');
      setSessionData(data);
    } catch (err) {
      setError(err.message);
      setStatus('error');
      setActiveStep(null);
    } finally {
      if (stepInterval) clearInterval(stepInterval);
    }
  };

  const handleApprove = async () => {
    if (!sessionData) return;

    try {
      const res = await fetch('/api/v1/audio/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionData.session_id }),
      });

      if (!res.ok) {
        let errorMessage = 'Processing failed';
        try {
          const err = await res.json();
          errorMessage = err.detail || errorMessage;
        } catch {
          errorMessage = res.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      let data;
      try {
        data = await res.json();
      } catch {
        throw new Error('Invalid response from server');
      }

      setStatus('completed');
      onSessionReady(data);
      setTimeout(() => navigate('/results'), 800);
    } catch (err) {
      setError(err.message);
      setStatus('error');
    }
  };

  const handleBackToUpload = () => {
    setStatus('idle');
    setSessionData(null);
    setFile(null);
    setDoneSteps([]);
    setActiveStep(null);
    setError('');
  };

  const jumpToUpload = () => {
    const target = document.getElementById('upload-studio');
    target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <main className="landing-page">
      <section className="hero-section">
        <div className="container hero-grid">
          <div className="hero-copy">
            <span className="hero-eyebrow">Audio2Notes Platform</span>
            <h1>Turn Lecture Audio Into Structured Notes</h1>
            <p>
              Accurate transcription, AI note generation, and grounded Q&A in one clean workflow.
            </p>
            <div className="hero-actions">
              <button className="btn btn-primary" onClick={jumpToUpload}>Start With Audio Upload</button>
              <a href="http://localhost:8000/docs" target="_blank" rel="noreferrer" className="btn btn-secondary">
                View API Documentation
              </a>
            </div>
          </div>
          <div className="hero-visual-wrap">
            <HeroWaveGraphic />
          </div>
        </div>
      </section>

      <section id="upload-studio" className="upload-section container">
        <div className="section-headline">
          <h2>Upload Studio</h2>
          <p>Upload lecture audio, validate transcript quality, then generate notes and indexing when you approve.</p>
        </div>

        <div className="upload-layout">
          <div className="upload-panel">
            <div
              className={`upload-zone ${dragging ? 'drag-over' : ''}`}
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => status !== 'processing' && fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".mp3,.wav,.m4a,.ogg,.flac"
                style={{ display: 'none' }}
                onChange={(e) => handleFile(e.target.files?.[0])}
              />
              <div className="upload-icon" aria-hidden="true">
                <UploadIcon />
              </div>
              {file ? (
                <>
                  <h3>{file.name}</h3>
                  <p>{(file.size / 1024 / 1024).toFixed(2)} MB ready for transcription.</p>
                </>
              ) : (
                <>
                  <h3>Drop audio files here</h3>
                  <p>or click to browse local files</p>
                </>
              )}
              <div className="upload-formats">
                {['.mp3', '.wav', '.m4a', '.ogg', '.flac'].map((format) => (
                  <span key={format} className="format-badge">{format}</span>
                ))}
              </div>
            </div>

            {error && <p className="form-error">{error}</p>}

            {file && status !== 'transcribed' && status !== 'completed' && (
              <div className="upload-action-row">
                <button className="btn btn-primary" onClick={handleProcess} disabled={status === 'processing'}>
                  {status === 'processing' ? (
                    <>
                      <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
                      Processing Audio
                    </>
                  ) : (
                    'Transcribe Audio'
                  )}
                </button>
              </div>
            )}

            {status === 'processing' && (
              <div className="pipeline" aria-label="Transcription progress">
                {PIPELINE_STEPS.map((step, index) => {
                  const isDone = doneSteps.includes(step.id);
                  const isActive = activeStep === step.id;
                  return (
                    <div key={step.id} className="pipeline-item-wrap">
                      <div className="pipeline-step">
                        <div className={`pipeline-icon ${isDone ? 'done' : isActive ? 'active' : ''}`}>
                          {isDone ? <CheckIcon /> : step.icon}
                        </div>
                        <span className={`pipeline-label ${isDone ? 'done' : isActive ? 'active' : ''}`}>{step.label}</span>
                      </div>
                      {index < PIPELINE_STEPS.length - 1 && <span className="pipeline-arrow" aria-hidden="true" />}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <aside className="upload-aside">
            <h3>Why teams use this workflow</h3>
            <ul>
              <li>Transcript review before note generation to reduce downstream corrections.</li>
              <li>Structured output for quick handoff to course operations and documentation.</li>
            </ul>
            <div className="integration-mini-grid">
              {INTEGRATIONS.map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>
          </aside>
        </div>

        {status === 'transcribed' && sessionData && (
          <TranscriptPreview sessionData={sessionData} onApprove={handleApprove} onBack={handleBackToUpload} />
        )}
      </section>

      {status !== 'processing' && status !== 'transcribed' && (
        <section className="value-section container">
          <div className="section-headline">
            <h2>Core Capabilities</h2>
          </div>
          <div className="value-grid">
            {VALUE_POINTS.map((item) => (
              <article key={item.title} className="value-card">
                <div className="value-illustration-wrap">{item.illustration}</div>
                <h3>{item.title}</h3>
                <p>{item.desc}</p>
              </article>
            ))}
          </div>
        </section>
      )}

      <footer className="landing-footer">
        <div className="container footer-inner">
          <div>
            <p className="footer-brand">Audio2Notes.ai</p>
            <p className="footer-subtext">Lecture intelligence workflow for teams and institutions.</p>
          </div>
          <a href="http://localhost:8000/docs" target="_blank" rel="noreferrer" className="footer-link">
            API Docs
          </a>
        </div>
      </footer>
    </main>
  );
}
