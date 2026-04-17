import { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import HomePage from './pages/HomePage.jsx';
import NotesPage from './pages/NotesPage.jsx';
import HistoryPage from './pages/HistoryPage.jsx';

export default function App() {
  const [session, setSession] = useState(null);

  return (
    <div>
      <Navbar session={session} />
      <Routes>
        <Route path="/" element={<HomePage onSessionReady={setSession} />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/results" element={<NotesPage session={session} onSessionReady={setSession} />} />
        <Route path="/results/:sessionId" element={<NotesPage session={session} onSessionReady={setSession} />} />
      </Routes>
    </div>
  );
}
