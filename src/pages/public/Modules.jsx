import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { NAV_SECTIONS, LOCK_ICON } from '../../navConfig';
import { ROUTE_MIN_ROLE, FRANCHISE_REQUIRED_ROUTES, roleMeets, hasFranchiseAccess } from '../../utils/format';
import Landing from './Landing';

export default function Modules() {
  const { isLoggedIn, currentUser } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    if (!isLoggedIn) {
      const t = setTimeout(() => {
        const el = document.getElementById('modules');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 150);
      return () => clearTimeout(t);
    }
  }, [isLoggedIn]);

  if (!isLoggedIn) return <Landing />;

  const modulesList = [];
  NAV_SECTIONS.forEach((s) => {
    s.links.forEach((l) => {
      if (l.route === 'modules') return;
      if (ROUTE_MIN_ROLE[l.route] && !roleMeets(currentUser, ROUTE_MIN_ROLE[l.route])) return;
      const locked = FRANCHISE_REQUIRED_ROUTES.includes(l.route) && !hasFranchiseAccess(currentUser);
      modulesList.push({ ...l, locked });
    });
  });

  return (
    <>
      <div className="page-header">
        <h2>Platform Modules</h2>
        <p className="text-muted">Access all functional areas of your FranchiseOS workspace</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1.25rem' }}>
        {modulesList.map((m) => (
          <div
            key={m.route}
            className="card"
            style={{
              cursor: 'pointer', transition: 'all 0.2s', display: 'flex', flexDirection: 'column',
              justifyContent: 'space-between', opacity: m.locked ? 0.55 : 1,
            }}
            onClick={() => (m.locked
              ? toast('This module unlocks once your franchise is approved and assigned by an admin.', 'info')
              : navigate('/' + m.route))}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,.08)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <div style={{ width: 40, height: 40, borderRadius: 8, background: 'rgba(212,155,62,0.1)', color: '#d49b3e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {m.icon}
                </div>
                <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>{m.label}</h4>
                {m.locked && LOCK_ICON}
              </div>
              <p className="text-muted" style={{ fontSize: '0.8rem', lineHeight: 1.5, marginBottom: '1rem' }}>
                {m.locked ? 'Locked until an admin approves your franchise.' : `Open the ${m.label} module to manage operations, view history, or perform actions.`}
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '0.75rem', color: m.locked ? 'var(--text-muted)' : '#d49b3e', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                {m.locked ? 'Locked' : 'Open Module →'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
