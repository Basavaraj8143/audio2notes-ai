import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import TranscriptPreview from '../components/TranscriptPreview.jsx';

const PIPELINE_STEPS = [
  { id: 'upload', label: 'Upload', icon: 'UP' },
  { id: 'chunk', label: 'Chunking', icon: 'CH' },
  { id: 'transcribe', label: 'Transcribing', icon: 'TX' },
  { id: 'clean', label: 'Cleaning', icon: 'CL' },
  { id: 'llm', label: 'AI Notes', icon: 'AI' },
  { id: 'index', label: 'Indexing', icon: 'IX' },
];

const TRANSCRIBE_STEPS = ['upload', 'chunk', 'transcribe', 'clean'];

const FEATURES = [
  { icon: 'ASR', color: '#7c6bff', title: 'Whisper ASR', desc: 'OpenAI Whisper transcription with confidence scoring per segment.' },
  { icon: 'AI', color: '#22d3ee', title: 'AI Note Generation', desc: 'OpenRouter generates structured notes: topics, key points, definitions, and summaries.' },
  { icon: 'QA', color: '#34d399', title: 'RAG Q&A', desc: 'Ask questions grounded in your lecture. Retrieval keeps responses anchored to transcript content.' },
  { icon: 'EX', color: '#fbbf24', title: 'Export', desc: 'Download your notes as PDF, DOCX, or plain text.' },
  { icon: 'PR', color: '#a78bfa', title: 'Privacy First', desc: 'Audio processed locally via Whisper. Only transcript text sent to the LLM.' },
];

export default function HomePage({ onSessionReady }) {
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('idle'); // idle | processing | transcribed | completed | error
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
      setError('Unsupported file type. Please upload .mp3, .wav, .m4a, .ogg, or .flac');
      return;
    }
    setError('');
    setFile(f);
  }, []);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    handleFile(f);
  };

  const handleProcess = async () => {
    if (!file) return;
    setStatus('processing');
    setDoneSteps([]);
    setError('');

    setActiveStep('upload');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const stepInterval = setInterval(() => {
        setDoneSteps((prev) => {
          const nextIdx = prev.length;
          if (nextIdx < TRANSCRIBE_STEPS.length - 1) {
            setActiveStep(TRANSCRIBE_STEPS[nextIdx + 1]);
            return [...prev, TRANSCRIBE_STEPS[nextIdx]];
          }
          return prev;
        });
      }, 2000);

      const res = await fetch('/api/v1/audio/upload', {
        method: 'POST',
        body: formData,
      });

      clearInterval(stepInterval);

      if (!res.ok) {
        let errorMessage = 'Processing failed';
        try {
          const err = await res.json();
          errorMessage = err.detail || errorMessage;
        } catch (jsonError) {
          errorMessage = res.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      let data;
      try {
        data = await res.json();
      } catch (jsonError) {
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
    }
  };

  const handleApprove = async () => {
    if (!sessionData) return;

    try {
      const res = await fetch('/api/v1/audio/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: sessionData.session_id,
        }),
      });

      if (!res.ok) {
        let errorMessage = 'Processing failed';
        try {
          const err = await res.json();
          errorMessage = err.detail || errorMessage;
        } catch (jsonError) {
          errorMessage = res.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      let data;
      try {
        data = await res.json();
      } catch (jsonError) {
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

  return (
    <main>
      <section className="hero">
        <div className="hero-badge">GenAI Annual Project</div>
        <h1 className="hero-title">
          Turn Lectures into<br />
          <span className="gradient-text">Structured Notes</span>
        </h1>
        <p className="hero-subtitle">
          Upload any lecture audio. Whisper transcribes it. OpenRouter structures it.
          Get notes and a smart Q&A in minutes.
        </p>
        <div className="hero-actions">
          <button className="btn btn-primary" onClick={() => fileInputRef.current.click()}>
            Upload Lecture
          </button>
          <a href="http://localhost:8000/docs" target="_blank" rel="noreferrer" className="btn btn-secondary">
            API Docs
          </a>
        </div>
      </section>

      <div className="container">
        <div
          className={`upload-zone ${dragging ? 'drag-over' : ''}`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => status !== 'processing' && fileInputRef.current.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".mp3,.wav,.m4a,.ogg,.flac"
            style={{ display: 'none' }}
            onChange={(e) => handleFile(e.target.files[0])}
          />
          <div className="upload-icon">
            <span style={{ fontSize: '1.2rem', fontWeight: 700 }}>AU</span>
          </div>
          {file ? (
            <>
              <h3>{file.name}</h3>
              <p>{(file.size / 1024 / 1024).toFixed(2)} MB - Ready to process</p>
            </>
          ) : (
            <>
              <h3>Drop your lecture audio here</h3>
              <p>or click to browse your files</p>
            </>
          )}
          <div className="upload-formats">
            {['.mp3', '.wav', '.m4a', '.ogg', '.flac'].map((f) => (
              <span key={f} className="format-badge">{f}</span>
            ))}
          </div>
        </div>

        {error && (
          <p style={{ color: '#f472b6', textAlign: 'center', marginBottom: 16, fontSize: '0.9rem' }}>
            {error}
          </p>
        )}

        {file && status !== 'transcribed' && status !== 'completed' && (
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <button className="btn btn-primary" onClick={handleProcess} disabled={status === 'processing'} id="process-btn">
              {status === 'processing' ? (
                <>
                  <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Processing...
                </>
              ) : (
                'Transcribe Audio'
              )}
            </button>
          </div>
        )}

        {status === 'transcribed' && sessionData && (
          <TranscriptPreview sessionData={sessionData} onApprove={handleApprove} onBack={handleBackToUpload} />
        )}

        {status === 'processing' && (
          <div className="pipeline" style={{ marginBottom: 48 }}>
            {PIPELINE_STEPS.filter((step) => TRANSCRIBE_STEPS.includes(step.id)).map((step, i, arr) => {
              const isDone = doneSteps.includes(step.id);
              const isActive = activeStep === step.id;
              return (
                <div key={step.id} style={{ display: 'flex', alignItems: 'center' }}>
                  <div className="pipeline-step">
                    <div className={`pipeline-icon ${isDone ? 'done' : isActive ? 'active' : ''}`}>{isDone ? 'OK' : step.icon}</div>
                    <span className={`pipeline-label ${isDone ? 'done' : isActive ? 'active' : ''}`}>{step.label}</span>
                  </div>
                  {i < arr.length - 1 && <span className="pipeline-arrow">{'->'}</span>}
                </div>
              );
            })}
          </div>
        )}

        {status !== 'processing' && (
          <section className="features">
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 700, marginBottom: 24, textAlign: 'center' }}>
              How It Works
            </h2>
            <div className="features-grid">
              {FEATURES.map((f) => (
                <div key={f.title} className="feature-card">
                  <div className="feature-icon" style={{ background: `${f.color}22` }}>{f.icon}</div>
                  <div className="feature-title">{f.title}</div>
                  <div className="feature-desc">{f.desc}</div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
