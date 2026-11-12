import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { NotificationAPI, NotificationActions } from '../api/client';
import { useAuth } from './AuthContext';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { isLoggedIn } = useAuth();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!isLoggedIn) return;
    setLoading(true);
    try {
      const res = await NotificationAPI.list();
      setList(res.results || res || []);
    } catch (e) {
      /* silent — the bell dot just won't update this cycle */
    } finally {
      setLoading(false);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    if (isLoggedIn) refresh();
    else setList([]);
  }, [isLoggedIn]); // eslint-disable-line react-hooks/exhaustive-deps

  const markRead = useCallback(async (id) => {
    await NotificationActions.markRead(id);
    setList((ls) => ls.map((x) => (x.id === id ? { ...x, is_read: true } : x)));
  }, []);

  const markAllRead = useCallback(async () => {
    await NotificationActions.markAllRead();
    setList((ls) => ls.map((x) => ({ ...x, is_read: true })));
  }, []);

  const unreadCount = list.filter((n) => !n.is_read).length;

  return (
    <NotificationContext.Provider value={{ list, loading, unreadCount, refresh, markRead, markAllRead }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
}
