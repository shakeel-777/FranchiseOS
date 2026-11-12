import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { roleLabel } from '../utils/format';
import { apiFetch } from '../api/client';

const SUGGESTIONS = {
  dashboard: [
    'Summarize my key metrics',
    'What should I focus on today?',
    'How is revenue trending?',
  ],
  sales: [
    'How do I record a new sale?',
    'Show me how to analyze sales trends',
    'What do the sale statuses mean?',
  ],
  inventory: [
    'What items need restocking?',
    'How do I update stock levels?',
    'Explain inventory valuation',
  ],
  expenses: [
    'How do I categorize expenses?',
    'How to spot unusual spending?',
    'What expense reports can I generate?',
  ],
  approvals: [
    'How do I submit an approval request?',
    'What approvals need my attention?',
    'Explain the approval workflow',
  ],
  compliance: [
    'How do I complete a checklist?',
    'What happens if I miss a deadline?',
    'How to stay compliant?',
  ],
  users: [
    'How do I add a new user?',
    'Explain the role hierarchy',
    'How to assign a franchise to a user?',
  ],
};

const DEFAULT_SUGGESTIONS = [
  'What can you help me with?',
  'Show me today\'s numbers',
  'Tips to improve performance',
];

const WELCOME = {
  admin: {
    title: 'Nova at your service',
    subtitle: 'I monitor your entire organization. Ask me about any franchise, user, or metric — I\'ll give you the numbers instantly.',
  },
  franchise_owner: {
    title: 'Orbit here — your Franchise AI',
    subtitle: 'Your live franchise data is loaded. Ask me about revenue, costs, compliance, or what needs your attention today.',
  },
  store_manager: {
    title: 'Pulse — your Store AI, ready',
    subtitle: 'Let\'s get things done. Ask me about today\'s numbers, low stock alerts, pending tasks, or how to do anything on the platform.',
  },
  user: {
    title: 'Hey! I\'m Scout 👋',
    subtitle: 'I\'ll help you find your way around FranchiseOS. Ask me anything — no question is too basic!',
  },
};

function formatTime() {
  return new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

export default function AIChatPanel() {
  const { currentUser } = useAuth();
  const location = useLocation();
  const page = location.pathname.replace('/', '').split('/')[0] || 'dashboard';

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const lastUserMsg = useRef('');
  const messagesEnd = useRef(null);
  const inputRef = useRef(null);

  const role = currentUser?.role || currentUser?.user?.role || 'user';
  const roleDisplay = roleLabel(role);
  const welcome = WELCOME[role] || WELCOME.user;

  useEffect(() => {
    window.__toggleAI = () => {
      setOpen((prev) => !prev);
      setTimeout(() => inputRef.current?.focus(), 300);
    };
    return () => { delete window.__toggleAI; };
  }, []);

  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  function addMessage(role, content) {
    setMessages((prev) => [...prev, { role, content, id: Date.now(), time: formatTime() }]);
  }

  function clearChat() {
    setMessages([]);
    setError(null);
  }

  async function send(msg) {
    const text = (msg || input).trim();
    if (!text || loading) return;
    setInput('');
    setError(null);
    lastUserMsg.current = text;
    addMessage('user', text);
    setLoading(true);
    try {
      const history = messages.slice(-20).map((m) => ({
        role: m.role === 'bot' ? 'assistant' : 'user',
        content: m.content,
      }));
      const res = await apiFetch('/ai/chat/', {
        method: 'POST',
        body: { message: text, history, context: { page } },
      });
      if (res.error) throw new Error(res.error);
      addMessage('bot', res.reply);
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  const suggestions = SUGGESTIONS[page] || DEFAULT_SUGGESTIONS;

  return (
    <>
      {open && <div className="ai-panel-overlay" onClick={() => setOpen(false)} />}
      <aside className={`ai-panel${open ? ' open' : ''}`}>
        {/* Header */}
        <div className="ai-panel-header">
          <div className="ai-header-left">
            <div className="ai-avatar">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                <path d="M12 2a4 4 0 0 1 4 4v2h2a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2V6a4 4 0 0 1 4-4z"/>
              </svg>
            </div>
            <div>
              <h3>Assistant</h3>
              <span className="ai-role-badge">{roleDisplay}</span>
            </div>
          </div>
          <div className="ai-header-actions">
            {messages.length > 0 && (
              <button className="ai-btn-icon" title="Clear chat" onClick={clearChat}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                </svg>
              </button>
            )}
            <button className="ai-btn-icon" title="Close" onClick={() => setOpen(false)}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="ai-messages">
          {messages.length === 0 && (
            <div className="ai-welcome">
              <h2>{welcome.title}</h2>
              <p>{welcome.subtitle}</p>
            </div>
          )}
          {messages.map((m) => (
            <div key={m.id} className={`ai-message ${m.role}`}>
              <div className="ai-message-body">
                <div className={`ai-bubble ${m.role}`}>{m.content}</div>
              </div>
            </div>
          ))}
          {loading && (
            <div className="ai-message bot">
              <div className="ai-message-body">
                <div className="ai-bubble bot ai-thinking">
                  <span>Thinking</span>
                  <div className="ai-thinking-dots">
                    <span /><span /><span />
                  </div>
                </div>
              </div>
            </div>
          )}
          {error && (
            <div className="ai-message bot">
              <div className="ai-message-body">
                <div className="ai-bubble bot ai-error">
                  <p>{error}</p>
                  <button className="ai-retry-btn" onClick={() => { setError(null); send(lastUserMsg.current); }}>Retry</button>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEnd} />
        </div>

        {/* Suggestions */}
        {messages.length === 0 && suggestions.length > 0 && (
          <div className="ai-suggestions">
            {suggestions.map((s) => (
              <button key={s} className="ai-suggestion-chip" onClick={() => send(s)}>{s}</button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="ai-input-area">
          <div className="ai-input-wrapper">
            <input
              ref={inputRef}
              type="text"
              placeholder="Type your message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
            />
            <button
              className="ai-send-btn"
              onClick={() => send()}
              disabled={loading || !input.trim()}
              title="Send message"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
