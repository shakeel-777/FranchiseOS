import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useNotifications } from '../../context/NotificationContext';
import { fmtDateTime, canOpenRoute } from '../../utils/format';

const TYPE_ICON = { info: 'ℹ️', warning: '⚠️', success: '✅', error: '🚫', alert: '🔔' };

export default function Notifications() {
  const { currentUser } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const { list, loading, unreadCount, markRead, markAllRead } = useNotifications();
  const [filter, setFilter] = useState('all'); // all | unread

  const visible = filter === 'unread' ? list.filter((n) => !n.is_read) : list;

  async function handleClick(n) {
    if (!n.is_read) {
      try {
        await markRead(n.id);
      } catch (err) {
        toast(err.message, 'error');
      }
    }
    if (n.link && n.link.startsWith('/')) {
      // Normalize old-style links like /users/3 → /users (detail routes don't exist)
      let link = n.link;
      if (/^\/users\/\d+$/.test(link)) link = '/users';
      const routeKey = link.replace(/^\//, '').split('/')[0];
      if (routeKey && canOpenRoute(currentUser, routeKey)) {
        navigate(link);
      }
    }
  }

  async function handleMarkAllRead() {
    try {
      await markAllRead();
      toast('All notifications marked read', 'success');
    } catch (err) {
      toast(err.message, 'error');
    }
  }

  return (
    <>
      <div className="page-header">
        <h2>Notifications</h2>
        <p className="text-muted">{unreadCount ? `${unreadCount} unread` : 'You\'re all caught up'}</p>
      </div>

      <div className="toolbar">
        <div className="toolbar-left">
          <button className={`btn btn-sm ${filter === 'all' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFilter('all')}>All</button>
          <button className={`btn btn-sm ${filter === 'unread' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFilter('unread')}>Unread</button>
        </div>
        <div className="toolbar-right"><button className="btn btn-secondary btn-sm" onClick={handleMarkAllRead} disabled={!unreadCount}>Mark all read</button></div>
      </div>

      {loading ? (
        <div className="loading-container"><div className="spinner" /></div>
      ) : !visible.length ? (
        <div className="card" style={{ textAlign: 'center', padding: '2rem' }}><p className="text-muted">No notifications</p></div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          {visible.map((n) => (
            <div
              key={n.id}
              className="activity-item"
              style={{ cursor: 'pointer', background: n.is_read ? 'transparent' : 'rgba(59,130,246,.05)', padding: '.85rem 1rem', borderBottom: '1px solid var(--border)' }}
              onClick={() => handleClick(n)}
            >
              <div className="activity-dot" style={{ background: n.is_read ? '#94A3B8' : '#3B82F6' }} />
              <div>
                <strong>{TYPE_ICON[n.notification_type] || 'ℹ️'} {n.title}</strong>{!n.is_read && <span className="badge badge-blue" style={{ marginLeft: '.5rem' }}>New</span>}<br />
                <span style={{ fontSize: '.8125rem' }}>{n.message}</span><br />
                <span className="activity-time">{fmtDateTime(n.created_at)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
