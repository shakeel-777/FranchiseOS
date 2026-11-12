import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { AuthAPI, clearToken, setToken } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Read from sessionStorage first (per-tab), fall back to localStorage
    const saved = sessionStorage.getItem('fos_user') || localStorage.getItem('fos_user');
    if (saved) {
      try {
        setCurrentUser(JSON.parse(saved));
        setIsLoggedIn(true);
      } catch (e) {
        /* ignore corrupt cache */
      }
    }
    setReady(true);
  }, []);

  const login = useCallback(async (username, password, remember) => {
    const data = await AuthAPI.login(username, password);
    if (data.access) {
      setToken(data.access);
      const me = await AuthAPI.me();
      setCurrentUser(me);
      setIsLoggedIn(true);
      sessionStorage.setItem('fos_user', JSON.stringify(me));
      if (remember) localStorage.setItem('fos_user', JSON.stringify(me));
      return me;
    }
    throw new Error('Login failed');
  }, []);

  const refreshMe = useCallback(async () => {
    const me = await AuthAPI.me();
    setCurrentUser(me);
    sessionStorage.setItem('fos_user', JSON.stringify(me));
    if (localStorage.getItem('fos_user')) localStorage.setItem('fos_user', JSON.stringify(me));
    return me;
  }, []);

  const logout = useCallback(() => {
    setIsLoggedIn(false);
    setCurrentUser(null);
    clearToken();
    sessionStorage.removeItem('fos_user');
    localStorage.removeItem('fos_user');
  }, []);

  const updateCurrentUser = useCallback((patch) => {
    setCurrentUser((cu) => {
      if (!cu) return cu;
      const next = { ...cu, ...patch, user: { ...(cu.user || {}), ...(patch.user || {}) } };
      sessionStorage.setItem('fos_user', JSON.stringify(next));
      if (localStorage.getItem('fos_user')) localStorage.setItem('fos_user', JSON.stringify(next));
      return next;
    });
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, isLoggedIn, ready, login, logout, refreshMe, updateCurrentUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
