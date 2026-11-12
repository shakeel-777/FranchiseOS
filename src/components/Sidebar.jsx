import { NavLink } from 'react-router-dom';
import { NAV_SECTIONS, LOCK_ICON } from '../navConfig';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { ROUTE_MIN_ROLE, FRANCHISE_REQUIRED_ROUTES, roleMeets, hasFranchiseAccess, isAdminUser } from '../utils/format';

export default function Sidebar({ open, collapsed, onToggleCollapse, onClose }) {
  const { currentUser } = useAuth();
  const toast = useToast();
  const isAdmin = isAdminUser(currentUser);

  // Admin doesn't need the discovery page — they manage franchises, not browse them
  const ADMIN_HIDDEN_ROUTES = ['discover', 'contact'];

  return (
    <aside className={`sidebar${open ? ' open' : ''}${collapsed ? ' collapsed' : ''}`} id="sidebar">
      <div className="sidebar-brand">
        <img src="/img/logo.svg" alt="FranchiseOS" className="logo-box" style={{ width: 38, height: 38, borderRadius: 10, background: 'transparent' }} />
        <div className="brand-text">
          <h1>FranchiseOS</h1>
          <span>Enterprise</span>
        </div>
      </div>
      <nav className="sidebar-nav">
        {NAV_SECTIONS.map((section) => {
          const entries = section.links
            .filter((l) => !(ROUTE_MIN_ROLE[l.route] && !roleMeets(currentUser, ROUTE_MIN_ROLE[l.route])))
            .filter((l) => !(isAdmin && ADMIN_HIDDEN_ROUTES.includes(l.route)))
            .map((l) => ({ link: l, locked: FRANCHISE_REQUIRED_ROUTES.includes(l.route) && !hasFranchiseAccess(currentUser) }));
          if (!entries.length) return null;
          return (
            <div className="sidebar-section" key={section.title}>
              <div className="sidebar-section-title">{section.title}</div>
              {entries.map(({ link, locked }) =>
                locked ? (
                  <button
                    key={link.route}
                    type="button"
                    className="sidebar-link locked"
                    style={{ width: '100%', textAlign: 'left', border: 'none', background: 'none' }}
                    title="Locked until your franchise is approved"
                    onClick={() => toast('This module unlocks once your franchise is approved and assigned by an admin.', 'info')}
                  >
                    {link.icon}<span className="link-label">{link.label}</span>{LOCK_ICON}
                  </button>
                ) : (
                  <NavLink
                    key={link.route}
                    className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
                    to={'/' + link.route}
                    onClick={() => { if (window.innerWidth <= 768) onClose?.(); }}
                  >
                    {link.icon}<span className="link-label">{link.label}</span>
                  </NavLink>
                )
              )}
            </div>
          );
        })}
      </nav>
      <div className="sidebar-footer">
        <button className="collapse-toggle" onClick={onToggleCollapse} title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        {!collapsed && (
          <div style={{ textAlign: 'center', marginTop: '.35rem' }}>&copy; 2026 FranchiseOS v1.0</div>
        )}
      </div>
    </aside>
  );
}
