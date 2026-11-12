import { useEffect, useRef, useState, useCallback } from 'react';
import { getToken } from '../api/client';

/**
 * Hook: WebSocket connection for a single chat conversation.
 *
 * Returns { messages, sendMessage, sendTyping, markRead, isConnected, error }
 * Messages come in real-time via the socket. Sending is optimistic.
 */
export function useChatSocket(conversationId) {
  const wsRef = useRef(null);
  const reconnectTimer = useRef(null);
  const reconnectAttempts = useRef(0);
  const tempIdCounter = useRef(0);

  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const [typingUsers, setTypingUsers] = useState({});

  // Clear messages only when hook unmounts (conversation fully closed),
  // NOT when conversationId changes — Chat.jsx already loads fresh
  // history via loadMessages() before switching the active conversation.
  useEffect(() => {
    return () => {
      setMessages([]);
      setTypingUsers({});
      setError(null);
    };
  }, []);

  // Connect / reconnect
  useEffect(() => {
    if (!conversationId) return;

    let cancelled = false;

    function connect() {
      const token = getToken();
      if (!token) return;

      const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
      const host = window.location.hostname;
      const port = '8001'; // Django backend port
      const wsUrl = `${protocol}://${host}:${port}/ws/chat/${conversationId}/?token=${token}`;

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        if (cancelled) { ws.close(); return; }
        setIsConnected(true);
        reconnectAttempts.current = 0;
        setError(null);
      };

      ws.onmessage = (event) => {
        if (cancelled) return;
        try {
          const data = JSON.parse(event.data);
          handleServerMessage(data);
        } catch (_) { /* ignore malformed */ }
      };

      ws.onclose = () => {
        if (cancelled) return;
        setIsConnected(false);
        scheduleReconnect();
      };

      ws.onerror = () => {
        // onclose will fire after this, triggering reconnect
      };
    }

    function scheduleReconnect() {
      if (cancelled) return;
      const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
      reconnectAttempts.current += 1;
      reconnectTimer.current = setTimeout(connect, delay);
    }

    function handleServerMessage(data) {
      switch (data.type) {
        case 'new_message':
          setMessages((prev) => {
            // Deduplicate by id
            if (prev.some((m) => m.id === data.message.id)) return prev;
            return [...prev, data.message];
          });
          break;

        case 'message_ack':
          // Replace optimistic temp message with server-confirmed one
          setMessages((prev) =>
            prev.map((m) =>
              m._tempId === data.temp_id ? { ...data.message, _tempId: undefined } : m
            )
          );
          break;

        case 'typing':
          setTypingUsers((prev) => {
            const next = { ...prev };
            if (data.typing) {
              next[data.user_id] = data.user_name;
            } else {
              delete next[data.user_id];
            }
            return next;
          });
          break;

        case 'message_status':
          // Update all message statuses (delivered → read)
          setMessages((prev) =>
            prev.map((m) => (m.status === 'sent' || m.status === 'delivered' ? { ...m, status: data.status } : m))
          );
          break;

        default:
          break;
      }
    }

    connect();

    return () => {
      cancelled = true;
      clearTimeout(reconnectTimer.current);
      if (wsRef.current) {
        wsRef.current.onclose = null; // prevent reconnect on intentional close
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [conversationId]);

  // ── Actions ────────────────────────────────────────────────────

  /** Send a text message. Accepts optional tempId for optimistic UI matching. */
  const sendMessage = useCallback((content, tempId) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return null;
    const id = tempId || `temp_${++tempIdCounter.current}`;
    wsRef.current.send(JSON.stringify({
      action: 'send_message',
      content,
      temp_id: id,
    }));
    return id;
  }, []);

  /** Signal typing status (debounce externally). */
  const sendTyping = useCallback((typing) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({ action: 'typing', typing }));
  }, []);

  /** Mark all messages in this conversation as read. */
  const markRead = useCallback(() => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({ action: 'mark_read' }));
  }, []);

  return {
    messages,
    setMessages,
    sendMessage,
    sendTyping,
    markRead,
    isConnected,
    typingUsers,
    error,
  };
}
