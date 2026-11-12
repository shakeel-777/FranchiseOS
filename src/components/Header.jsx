import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useNotifications } from '../context/NotificationContext';
import { roleLabel } from '../utils/format';

export default function Header({ onMenuToggle }) {
  const { currentUser, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const { unreadCount } = useNotifications();
  const [dark, setDark] = useState(() => localStorage.getItem('fos_theme') === 'dark');

  useEffect(() => {
    document.body.classList.toggle('dark', dark);
    localStorage.setItem('fos_theme', dark ? 'dark' : 'light');
  }, [dark]);

  const u = (currentUser && currentUser.user) || {};
  const initials = ((u.first_name || 'A')[0] + (u.last_name || 'U')[0]).toUpperCase();

  // Build breadcrumb from current path
  const pageName = location.pathname.replace('/', '').replace(/^\//, '');
  const breadcrumb = pageName.charAt(0).toUpperCase() + pageName.slice(1) || 'Dashboard';

  function handleLogout() {
    logout();
    toast('Signed out', 'info');
    navigate('/landing');
  }

  return (
    <header className="header" id="header">
      <div className="header-left">
        <button className="menu-toggle" title="Menu" onClick={onMenuToggle}>&#9776;</button>
        <span className="breadcrumb">{breadcrumb}</span>
      </div>
      <div className="header-right">
        <button className="btn-icon" title="AI Assistant" onClick={() => window.__toggleAI?.()}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2a4 4 0 0 1 4 4v2h2a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2V6a4 4 0 0 1 4-4z" />
            <circle cx="12" cy="14" r="1.5" fill="currentColor" stroke="none" />
          </svg>
        </button>
        <button className={`btn-icon${unreadCount ? ' badge-dot' : ''}`} title="Notifications" style={{ position: 'relative' }} onClick={() => navigate('/notifications')}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
        </button>
        <div className="header-user">
          <div className="header-avatar">{initials}</div>
          <div>
            <div style={{ fontWeight: 600, fontSize: '.8125rem' }}>{(u.first_name || '') + ' ' + (u.last_name || '')}</div>
            <div style={{ fontSize: '.6875rem', color: 'var(--text-muted)' }}>{roleLabel(currentUser && currentUser.role)}</div>
          </div>
        </div>
        <button className="theme-toggle" title="Toggle dark/light mode" onClick={() => setDark((d) => !d)} />
        <button className="btn btn-sm btn-secondary" onClick={handleLogout}>Logout</button>
      </div>
    </header>
  );
}
