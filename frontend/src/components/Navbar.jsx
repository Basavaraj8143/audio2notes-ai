import { useNavigate, useLocation } from 'react-router-dom';

function BrandMark() {
  return (
    <svg className="navbar-logo-icon" viewBox="0 0 40 24" aria-hidden="true">
      <circle cx="8" cy="12" r="6" />
      <rect x="17" y="5" width="3.5" height="14" rx="1.75" />
      <rect x="23.5" y="6.5" width="3.5" height="11" rx="1.75" />
      <rect x="30" y="8.5" width="3.5" height="7" rx="1.75" />
    </svg>
  );
}

export default function Navbar({ session }) {
  const navigate = useNavigate();
  const location = useLocation();
  const isHome = location.pathname === '/';
  const isHistory = location.pathname === '/history';
  const isResults = location.pathname.startsWith('/results');

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <div className="navbar-logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
          <BrandMark />
          <span className="navbar-logo-text">
            Audio2Notes<span>.ai</span>
          </span>
        </div>
        <div className="navbar-links">
          <button className={`nav-btn ${isHome ? 'active' : ''}`} onClick={() => navigate('/')}>
            Upload
          </button>
          <button className={`nav-btn ${isHistory ? 'active' : ''}`} onClick={() => navigate('/history')}>
            History
          </button>
          {session && <button className={`nav-btn ${isResults ? 'active' : ''}`} onClick={() => navigate(`/results/${session.session_id}`)}>Results</button>}
          <a
            href="http://localhost:8000/docs"
            target="_blank"
            rel="noreferrer"
            className="nav-btn"
            style={{ textDecoration: 'none', display: 'inline-block' }}
          >
            API Docs
          </a>
        </div>
      </div>
    </nav>
  );
}
