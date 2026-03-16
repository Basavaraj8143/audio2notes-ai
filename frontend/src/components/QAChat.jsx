import { useState, useRef, useEffect } from 'react';

const SUGGESTED = [
  'What are the main topics covered in this lecture?',
  'Can you explain the key definitions?',
  'What are the most important concepts and how do they relate?',
];

export default function QAChat({ sessionId }) {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: '👋 Hi! Ask me anything about this lecture. My answers are grounded in the actual transcript.' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text) => {
    const q = (text || input).trim();
    if (!q || loading) return;
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: q }]);
    setLoading(true);

    try {
      const res = await fetch('/api/v1/qa/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, question: q }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to get answer');
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.answer,
          sources: data.source_chunks?.length,
        },
      ]);
    } catch (err) {
      setMessages((prev) => [...prev, { role: 'assistant', content: `⚠️ ${err.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } };

  return (
    <div className="card qa-container" style={{ padding: 0, overflow: 'hidden' }}>
      {/* Suggested questions */}
      <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {SUGGESTED.map((s) => (
          <button
            key={s}
            className="btn btn-secondary btn-sm"
            style={{ fontSize: '0.78rem' }}
            onClick={() => sendMessage(s)}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="qa-messages" id="qa-messages">
        {messages.map((msg, i) => (
          <div key={i} className={`message ${msg.role}`}>
            {msg.content}
            {msg.sources && (
              <div className="source-label">📚 Based on {msg.sources} transcript chunk{msg.sources > 1 ? 's' : ''}</div>
            )}
          </div>
        ))}
        {loading && (
          <div className="message assistant">
            <span style={{ letterSpacing: 4, animation: 'pulse 1s infinite' }}>···</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="qa-input-row">
        <input
          id="qa-input"
          className="qa-input"
          placeholder="Ask about this lecture…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          disabled={loading}
        />
        <button
          id="qa-send-btn"
          className="btn btn-primary btn-sm"
          onClick={() => sendMessage()}
          disabled={loading || !input.trim()}
        >
          Send
        </button>
      </div>
    </div>
  );
}
