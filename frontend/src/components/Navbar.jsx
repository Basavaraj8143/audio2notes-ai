import { useNavigate, useLocation } from 'react-router-dom';

export default function Navbar({ session }) {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <div className="navbar-logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
          Audio2Notes<span>.ai</span>
        </div>
        <div className="navbar-links">
          <button className={`nav-btn ${location.pathname === '/' ? 'active' : ''}`} onClick={() => navigate('/')}>
            🎙️ Upload
          </button>
          {session && (
            <button className={`nav-btn ${location.pathname === '/results' ? 'active' : ''}`} onClick={() => navigate('/results')}>
              📋 Results
            </button>
          )}
          <a
            href="http://localhost:8000/docs"
            target="_blank"
            rel="noreferrer"
            className="nav-btn"
            style={{ textDecoration: 'none', display: 'inline-block' }}
          >
            📡 API Docs
          </a>
        </div>
      </div>
    </nav>
  );
}
