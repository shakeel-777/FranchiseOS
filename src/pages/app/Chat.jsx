import { useEffect, useState, useRef, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { apiFetch } from '../../api/client';
import { isAdminUser, fmtDateTime } from '../../utils/format';
import { useChatSocket } from '../../hooks/useChatSocket';

// ── Message status icon ──────────────────────────────────────────
function StatusIcon({ status }) {
  if (status === 'sending') return <span style={{ color: 'var(--text-muted)', fontSize: '.7rem' }} title="Sending…">◌</span>;
  if (status === 'sent') return <span style={{ color: 'var(--text-muted)', fontSize: '.7rem' }} title="Sent">✓</span>;
  if (status === 'delivered') return <span style={{ color: 'var(--text-muted)', fontSize: '.7rem' }} title="Delivered">✓✓</span>;
  if (status === 'read') return <span style={{ color: '#34b7f1', fontSize: '.7rem' }} title="Read">✓✓</span>;
  return null;
}

// ── Typing indicator ─────────────────────────────────────────────
function TypingIndicator({ names }) {
  if (names.length === 0) return null;
  const label = names.length === 1 ? `${names[0]} is typing` : `${names.join(', ')} are typing`;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', padding: '.25rem 0', fontSize: '.72rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
      <span className="typing-dots">
        <span className="typing-dot" />
        <span className="typing-dot" />
        <span className="typing-dot" />
      </span>
      {label}
    </div>
  );
}

// ── User row (admin view) ────────────────────────────────────────
function UserRow({ user, isActive, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        padding: '.6rem 1rem', cursor: 'pointer', borderBottom: '1px solid var(--border)',
        background: isActive ? 'var(--primary-light)' : 'transparent',
        transition: 'background .15s',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontWeight: 600, fontSize: '.8125rem' }}>{user.full_name}</span>
        <span style={{ fontSize: '.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
          {user.role.replace('_', ' ')}
        </span>
      </div>
      {user.franchise_names && user.franchise_names.length > 0 && (
        <div style={{ fontSize: '.7rem', color: 'var(--text-muted)', marginTop: '.15rem' }}>
          {user.franchise_names.join(', ')}
        </div>
      )}
      {user.has_conversation && user.unread_count > 0 && (
        <span className="badge badge-red" style={{ fontSize: '.6rem', marginTop: '.2rem', display: 'inline-block' }}>
          {user.unread_count} new
        </span>
      )}
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────
export default function Chat() {
  const { currentUser } = useAuth();
  const toast = useToast();
  const isAdmin = isAdminUser(currentUser);
  const myUserId = Number(currentUser?.user?.id);

  const [conversations, setConversations] = useState([]);
  const [chatUsers, setChatUsers] = useState([]);
  const [sidebarTab, setSidebarTab] = useState('conversations'); // 'conversations' | 'users'
  const [activeId, setActiveId] = useState(null);
  const [historyMessages, setHistoryMessages] = useState([]);
  const [historyPage, setHistoryPage] = useState(1);
  const [hasMoreHistory, setHasMoreHistory] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const msgEnd = useRef(null);
  const msgListRef = useRef(null);
  const typingTimer = useRef(null);

  // WebSocket for the active conversation
  const {
    messages: liveMessages,
    setMessages: setLiveMessages,
    sendMessage: wsSend,
    sendTyping,
    markRead,
    isConnected,
    typingUsers,
  } = useChatSocket(activeId);

  // ── Load conversation list ───────────────────────────────────
  async function loadConversations() {
    try {
      const data = await apiFetch('/chat/conversations/');
      setConversations(data.results || data || []);
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadConversations(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Load chat users (admin only) ─────────────────────────────
  async function loadChatUsers() {
    if (!isAdmin) return;
    setLoadingUsers(true);
    try {
      const data = await apiFetch('/chat/conversations/chat_users/');
      setChatUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      // Silently fail — the conversations tab still works
      setChatUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  }

  useEffect(() => {
    if (isAdmin) { loadChatUsers(); }
  }, [isAdmin]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Admin: initiate conversation with a user ─────────────────
  async function startChatWithUser(user) {
    if (user.has_conversation && user.conversation_id) {
      // Already have a conversation — open it
      loadMessages(user.conversation_id);
      setSidebarTab('conversations');
      return;
    }
    try {
      const res = await apiFetch('/chat/conversations/initiate/', {
        method: 'POST',
        body: { user_id: user.id, subject: `Chat with ${user.full_name}` },
      });
      if (res.conversation_id) {
        await loadConversations(); // Refresh conversation list
        loadMessages(res.conversation_id);
        setSidebarTab('conversations');
      }
    } catch (err) {
      toast(err.message, 'error');
    }
  }

  // ── Load message history (paginated) when conversation opens ──
  async function loadMessages(convId, page = 1) {
    try {
      const data = await apiFetch(`/chat/conversations/${convId}/messages/?page=${page}`);
      const msgs = data.messages || data.results?.messages || data.results || [];
      setHistoryMessages(page === 1 ? msgs : [...msgs].reverse());
      setHistoryPage(page);
      setHasMoreHistory(!!data.next || (Array.isArray(msgs) && msgs.length >= 50));
      setActiveId(convId);
      // Seed live messages from history
      if (page === 1) {
        setLiveMessages(msgs);
        // Mark as read
        markRead();
      }
    } catch (err) {
      toast(err.message, 'error');
    }
  }

  function loadOlderMessages() {
    if (loadingHistory || !hasMoreHistory || !activeId) return;
    setLoadingHistory(true);
    apiFetch(`/chat/conversations/${activeId}/messages/?page=${historyPage + 1}`)
      .then((data) => {
        const older = data.messages || data.results?.messages || data.results || [];
        if (older.length > 0) {
          setHistoryMessages((prev) => [...older, ...prev]);
          setLiveMessages((prev) => [...older, ...prev]);
          setHistoryPage((p) => p + 1);
          setHasMoreHistory(!!data.next);
        } else {
          setHasMoreHistory(false);
        }
      })
      .catch((err) => toast(err.message, 'error'))
      .finally(() => setLoadingHistory(false));
  }

  // Scroll handling for infinite scroll up
  function handleScroll() {
    const el = msgListRef.current;
    if (!el) return;
    if (el.scrollTop < 60 && hasMoreHistory && !loadingHistory) {
      loadOlderMessages();
    }
  }

  // ── Auto-scroll to bottom on new messages ────────────────────
  useEffect(() => {
    msgEnd.current?.scrollIntoView({ behavior: 'smooth' });
  }, [liveMessages]);

  // ── Auto mark read when viewing messages ─────────────────────
  useEffect(() => {
    if (activeId && isConnected) {
      markRead();
    }
  }, [activeId, isConnected]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Send message (optimistic + WebSocket) ────────────────────
  async function sendMessage() {
    const text = input.trim();
    if (!text || !activeId) return;
    setInput('');
    setSending(true);

    const tempId = `temp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const optimisticMsg = {
      _tempId: tempId,
      id: tempId,
      conversation: activeId,
      sender: myUserId,
      sender_name: currentUser?.user?.username || 'You',
      sender_role: currentUser?.role || 'user',
      content: text,
      sequence: -1,
      status: 'sending',
      is_read: false,
      created_at: new Date().toISOString(),
    };

    // Optimistic insert
    setLiveMessages((prev) => [...prev, optimisticMsg]);

    // Send via WebSocket (pass tempId so ack matches optimistic message)
    const ackTempId = wsSend(text, tempId);

    if (!ackTempId) {
      // WebSocket not connected — fall back to REST
      try {
        await apiFetch(`/chat/conversations/${activeId}/send/`, {
          method: 'POST',
          body: { content: text },
        });
        await loadMessages(activeId);
        loadConversations();
      } catch (err) {
        toast(err.message, 'error');
        // Remove the optimistic message on failure
        setLiveMessages((prev) => prev.filter((m) => m._tempId !== tempId));
      }
    }

    setSending(false);
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  // ── Typing indicator (debounced) ─────────────────────────────
  function handleInputChange(e) {
    setInput(e.target.value);
    // Send typing indicator (debounced)
    if (typingTimer.current) clearTimeout(typingTimer.current);
    sendTyping(true);
    typingTimer.current = setTimeout(() => {
      sendTyping(false);
      typingTimer.current = null;
    }, 2000);
  }

  // Cleanup typing timer
  useEffect(() => {
    return () => {
      if (typingTimer.current) {
        sendTyping(false);
        clearTimeout(typingTimer.current);
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Merge live + history: live takes precedence ──────────────
  const displayMessages = liveMessages;

  const activeConv = conversations.find((c) => c.id === activeId);
  const typingNames = Object.values(typingUsers);

  if (loading) {
    return <div className="loading-container"><div className="spinner" /></div>;
  }

  return (
    <>
      <div className="page-header">
        <h2>Messages</h2>
        <p className="text-muted">
          {isAdmin ? 'Respond to franchise inquiries' : 'Chat with franchise support'}
          {activeId && (
            <span style={{ marginLeft: '.75rem', fontSize: '.7rem' }}>
              {isConnected ? '🟢 Live' : '🔴 Reconnecting…'}
            </span>
          )}
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '1rem', height: 'calc(100vh - 180px)', minHeight: 450 }}>
        {/* Sidebar */}
        <div className="card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {/* Tabs for admin */}
          {isAdmin && (
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
              <button
                onClick={() => setSidebarTab('conversations')}
                style={{
                  flex: 1, padding: '.6rem', fontSize: '.75rem', fontWeight: 600,
                  border: 'none', cursor: 'pointer', background: sidebarTab === 'conversations' ? 'var(--primary-light)' : 'transparent',
                  color: sidebarTab === 'conversations' ? 'var(--primary)' : 'var(--text-muted)',
                  borderBottom: sidebarTab === 'conversations' ? '2px solid var(--primary)' : '2px solid transparent',
                }}
              >
                Chats
              </button>
              <button
                onClick={() => { setSidebarTab('users'); loadChatUsers(); }}
                style={{
                  flex: 1, padding: '.6rem', fontSize: '.75rem', fontWeight: 600,
                  border: 'none', cursor: 'pointer', background: sidebarTab === 'users' ? 'var(--primary-light)' : 'transparent',
                  color: sidebarTab === 'users' ? 'var(--primary)' : 'var(--text-muted)',
                  borderBottom: sidebarTab === 'users' ? '2px solid var(--primary)' : '2px solid transparent',
                }}
              >
                Users ({chatUsers.length})
              </button>
            </div>
          )}
          <div style={{ padding: '.75rem 1rem', borderBottom: '1px solid var(--border)', fontWeight: 600, fontSize: '.8125rem' }}>
            {isAdmin
              ? (sidebarTab === 'users' ? 'All Users' : 'All Inquiries')
              : 'My Conversations'}
          </div>

          {/* Conversations list */}
          {sidebarTab === 'conversations' && (
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {conversations.length === 0 ? (
                <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '.8125rem' }}>
                  {isAdmin
                    ? 'No conversations yet. Switch to the Users tab to start a chat.'
                    : 'No conversations yet. Visit the Discover page to inquire about a franchise.'}
                </div>
              ) : (
                conversations.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => loadMessages(c.id)}
                    style={{
                      padding: '.75rem 1rem', cursor: 'pointer', borderBottom: '1px solid var(--border)',
                      background: activeId === c.id ? 'var(--primary-light)' : 'transparent',
                      transition: 'background .15s',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 600, fontSize: '.8125rem' }}>
                        {isAdmin ? c.user_name : (c.franchise_name || 'Support')}
                      </span>
                      {c.unread_count > 0 && (
                        <span className="badge badge-red" style={{ fontSize: '.6rem' }}>{c.unread_count}</span>
                      )}
                    </div>
                    <div style={{ fontSize: '.72rem', color: 'var(--text-muted)', marginTop: '.2rem' }}>
                      {c.subject}
                    </div>
                    {c.last_message && (
                      <div style={{ fontSize: '.7rem', color: 'var(--text-muted)', marginTop: '.15rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {c.last_message.sender_name}: {c.last_message.content}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* Users list (admin only) */}
          {sidebarTab === 'users' && (
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {loadingUsers ? (
                <div style={{ padding: '2rem', textAlign: 'center' }}>
                  <span className="spinner" style={{ width: 20, height: 20, display: 'inline-block' }} />
                </div>
              ) : chatUsers.length === 0 ? (
                <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '.8125rem' }}>
                  No users found.
                </div>
              ) : (
                chatUsers.map((u) => (
                  <UserRow
                    key={u.id}
                    user={u}
                    isActive={activeId === u.conversation_id && activeId !== null}
                    onClick={() => startChatWithUser(u)}
                  />
                ))
              )}
            </div>
          )}
        </div>

        {/* Chat area */}
        <div className="card" style={{ padding: 0, display: 'flex', flexDirection: 'column' }}>
          {!activeId ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '.875rem' }}>
              Select a conversation to start chatting
            </div>
          ) : (
            <>
              {/* Chat header */}
              <div style={{
                padding: '.75rem 1.25rem', borderBottom: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                fontWeight: 600, fontSize: '.8125rem',
              }}>
                <div>
                  <span>Chatting with </span>
                  <span style={{ color: 'var(--primary)' }}>
                    {isAdmin ? activeConv?.user_name : (activeConv?.franchise_name || 'Support')}
                  </span>
                  <span style={{ color: 'var(--text-muted)', fontWeight: 400, marginLeft: '.5rem', fontSize: '.72rem' }}>
                    — {activeConv?.subject}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
                  <span style={{ fontSize: '.65rem', color: 'var(--text-muted)', fontWeight: 400 }}>
                    You: <strong style={{ color: 'var(--text)' }}>{currentUser?.user?.username || '?'}</strong>
                  </span>
                  {activeConv?.franchise_name && (
                    <span className="badge badge-blue" style={{ fontSize: '.65rem' }}>{activeConv.franchise_name}</span>
                  )}
                </div>
              </div>

              {/* Messages */}
              <div
                ref={msgListRef}
                onScroll={handleScroll}
                style={{ flex: 1, overflowY: 'auto', padding: '1rem 1.25rem', minHeight: 200, display: 'flex', flexDirection: 'column', gap: '.75rem' }}
              >
                {loadingHistory && (
                  <div style={{ textAlign: 'center', padding: '.5rem' }}>
                    <span className="spinner" style={{ width: 16, height: 16, display: 'inline-block' }} />
                  </div>
                )}
                {hasMoreHistory && !loadingHistory && (
                  <div style={{ textAlign: 'center', padding: '.25rem' }}>
                    <button className="btn btn-sm" onClick={loadOlderMessages} style={{ fontSize: '.7rem' }}>
                      Load older messages
                    </button>
                  </div>
                )}

                {displayMessages.map((m) => {
                  const isBot = m.sender_role === 'bot' || (!m.sender && !m._tempId);
                  const isMe = !isBot && (Number(m.sender) === myUserId || m._tempId);
                  const isAdminMsg = !isBot && !isMe && m.sender_role === 'admin';
                  const isSending = m.status === 'sending' || m._tempId;

                  return (
                    <div key={m.id || m._tempId} style={{ display: 'flex', flexDirection: isMe ? 'row-reverse' : 'row', gap: '.5rem' }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                        background: isAdminMsg ? '#d49b3e' : (isBot ? '#6366f1' : (isMe ? 'linear-gradient(135deg, #4f46e5, #6366f1)' : 'var(--border)')),
                        color: (isAdminMsg || isBot || isMe) ? '#fff' : 'var(--text-muted)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '.65rem', fontWeight: 700,
                      }}>
                        {isBot ? '🤖' : (isAdminMsg ? 'A' : (m.sender_name || '?').charAt(0).toUpperCase())}
                      </div>
                      <div style={{ maxWidth: '70%' }}>
                        <div className="chat-bubble" style={{
                          padding: '.6rem .85rem', borderRadius: isMe ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
                          background: isMe ? 'var(--primary)' : 'var(--bg)',
                          color: isMe ? '#fff' : 'var(--text)',
                          border: isMe ? 'none' : '1px solid var(--border)',
                          fontSize: '.8125rem', lineHeight: 1.5, wordBreak: 'break-word',
                          opacity: isSending ? 0.7 : 1,
                        }}>
                          {m.content}
                        </div>
                        <div style={{
                          fontSize: '.65rem', color: 'var(--text-muted)',
                          marginTop: '.2rem', textAlign: isMe ? 'right' : 'left',
                          display: 'flex', alignItems: 'center', gap: '.3rem',
                          justifyContent: isMe ? 'flex-end' : 'flex-start',
                        }}>
                          {isAdminMsg && <span style={{ color: '#d49b3e', fontWeight: 600 }}>Admin · </span>}
                          {!isBot && <span>{m.sender_name} · </span>}
                          <span>{fmtDateTime(m.created_at)}</span>
                          {isMe && !isBot && <StatusIcon status={m.status || 'sent'} />}
                        </div>
                      </div>
                    </div>
                  );
                })}

                <TypingIndicator names={typingNames} />
                <div ref={msgEnd} />
              </div>

              {/* Input */}
              <div style={{ padding: '.75rem 1.25rem', borderTop: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', gap: '.5rem' }}>
                  <textarea
                    rows={2}
                    value={input}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Type your message... (Enter to send, Shift+Enter for new line)"
                    style={{ resize: 'none' }}
                  />
                  <button
                    className="btn btn-primary"
                    onClick={sendMessage}
                    disabled={sending || !input.trim()}
                    style={{ alignSelf: 'flex-end', height: 'fit-content' }}
                  >
                    {sending ? '...' : 'Send'}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Typing dots CSS */}
      <style>{`
        .typing-dots { display: inline-flex; gap: 3px; align-items: center; }
        .typing-dot {
          width: 4px; height: 4px; border-radius: 50%;
          background: var(--text-muted);
          animation: typingBounce 1.2s infinite ease-in-out;
        }
        .typing-dot:nth-child(2) { animation-delay: 0.2s; }
        .typing-dot:nth-child(3) { animation-delay: 0.4s; }
        @keyframes typingBounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-4px); }
        }
      `}</style>
    </>
  );
}
