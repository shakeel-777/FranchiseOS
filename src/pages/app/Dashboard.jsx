import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiFetch, AuthAPI } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { isAdminUser } from '../../utils/format';

const inr = (n) => '₹' + Number(n || 0).toLocaleString('en-IN');
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function Dashboard() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [state, setState] = useState({ loading: true, error: null, data: null, audits: [], sales: [], expenses: [] });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [data, auditRes] = await Promise.all([AuthAPI.dashboard(), apiFetch('/audit/')]);
        let sales = [], expenses = [];
        try {
          const [sr, er] = await Promise.all([apiFetch('/sales/'), apiFetch('/expenses/')]);
          sales = (sr && sr.results) || [];
          expenses = (er && er.results) || [];
        } catch (_) { /* isolate chart failures */ }
        const audits = auditRes.results || auditRes || [];
        if (!cancelled) setState({ loading: false, error: null, data, audits, sales, expenses });
      } catch (err) {
        if (!cancelled) setState({ loading: false, error: err.message, data: null, audits: [], sales: [], expenses: [] });
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (state.loading) {
    return (
      <div className="loading-container">
        <div className="spinner" />
        <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Loading dashboard...</p>
      </div>
    );
  }

  if (state.error) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem' }}>
        <h2>Error Loading Dashboard</h2>
        <p className="text-muted">{state.error}</p>
        <button className="btn btn-primary" onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  const { data, audits, sales, expenses } = state;
  const expTotal = expenses.reduce((s, e) => s + parseFloat(e.amount || 0), 0);
  const isAdmin = isAdminUser(currentUser);

  if (!isAdmin && (!data || !data.franchise_id)) {
    const firstName = currentUser?.user?.first_name || 'User';
    const dateStr = new Date().toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric' });
    return (
      <>
        <div className="page-header"><h2>Welcome, {firstName}!</h2><p className="text-muted">{dateStr}</p></div>

        <div className="card welcome-banner">
          <div className="welcome-banner-inner">
            <div className="welcome-banner-content">
              <div className="welcome-banner-badge" style={{ background: 'rgba(245, 158, 11, 0.1)', borderColor: 'rgba(245, 158, 11, 0.2)' }}>
                <span className="dot" style={{ background: '#f59e0b' }} />
                <span className="label" style={{ color: '#f59e0b' }}>UNDER VERIFICATION</span>
              </div>
              <h2>Your account is under review</h2>
              <p>
                Your account has been created successfully. A corporate admin will review your details and assign
                a franchise license. Once approved, you'll gain full access to sales, inventory, compliance, and
                all operational modules.
              </p>
            </div>
          </div>
        </div>

        <div className="quick-links-grid">
          <div className="card quick-link-card" onClick={() => navigate('/notifications')}>
            <div className="quick-link-icon indigo">🔔</div>
            <div className="quick-link-title">Notifications</div>
            <div className="quick-link-desc">Stay updated on platform activity</div>
          </div>
          <div className="card quick-link-card" onClick={() => navigate('/settings')}>
            <div className="quick-link-icon purple">⚙️</div>
            <div className="quick-link-title">Settings</div>
            <div className="quick-link-desc">Update your profile and preferences</div>
          </div>
        </div>

        <div className="card getting-started-card">
          <div className="heading">⏳ What happens next?</div>
          <p>
            A corporate administrator will verify your account and assign a franchise to you. This typically takes
            1-2 business days. You'll receive a notification once your franchise license is active. In the meantime,
            you can update your profile in Settings or browse notifications.
          </p>
        </div>
      </>
    );
  }

  // --- 7-day sales bar chart ---
  const today = new Date();
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today); d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });
  const dailySales = last7.map((date) => sales.filter((s) => (s.sale_date || '').startsWith(date)).reduce((sum, s) => sum + parseFloat(s.total_amount || 0), 0));
  const hasSales = dailySales.some((v) => v > 0);
  const maxVal = Math.max(...dailySales, 1);

  // --- Revenue pie chart ---
  const rev = parseFloat(data.total_revenue) || 0;
  const profit = Math.max(0, rev - expTotal);
  const hasPieData = rev > 0 || expTotal > 0;
  const pieEntries = [
    { label: 'Sales', value: rev, color: '#10B981' },
    { label: 'Expenses', value: expTotal, color: '#EF4444' },
    { label: 'Profit', value: profit, color: '#6366f1' },
  ].filter((d) => d.value > 0);
  const pieTotal = pieEntries.reduce((s, d) => s + d.value, 0) || 1;
  let cumulative = 0;
  const pieSlices = pieEntries.map((d) => {
    const startAngle = (cumulative / pieTotal) * 360;
    cumulative += d.value;
    const endAngle = (cumulative / pieTotal) * 360;
    const x1 = 60 + 40 * Math.cos((startAngle - 90) * Math.PI / 180);
    const y1 = 60 + 40 * Math.sin((startAngle - 90) * Math.PI / 180);
    const x2 = 60 + 40 * Math.cos((endAngle - 90) * Math.PI / 180);
    const y2 = 60 + 40 * Math.sin((endAngle - 90) * Math.PI / 180);
    const large = endAngle - startAngle > 180 ? 1 : 0;
    return { ...d, path: `M60,60 L${x1},${y1} A40,40 0 ${large},1 ${x2},${y2} Z` };
  });

  const actionColors = { create: '#10B981', update: '#6366f1', delete: '#EF4444', login: '#8B5CF6', logout: '#64748B', other: '#F59E0B' };

  return (
    <>
      <div className="page-header">
        <h2>{isAdmin ? 'Corporate' : 'Franchise'} Dashboard</h2>
        <p className="text-muted">Welcome back, {currentUser?.user?.first_name || 'User'} — {new Date().toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
      </div>

      {/* Bento Grid Layout */}
      <div className="bento-dashboard">
        {/* Welcome / Summary */}
        <div className="card bento-welcome">
          <div className="card-header">
            <h3>📊 Overview</h3>
          </div>
          <div className="stats-grid" style={{ marginBottom: 0 }}>
            {isAdmin ? (
              <>
                <StatCard onClick={() => navigate('/franchises')} color="indigo" icon={<path d="M3 21h18" />} label="Total Franchises" value={data.franchises || 0} sub={`${data.active_franchises || 0} active`} />
                <StatCard onClick={() => navigate('/sales')} color="green" icon={<line x1="12" y1="1" x2="12" y2="23" />} label="Total Sales" value={data.total_sales || 0} sub={`${inr(data.total_revenue)} revenue`} />
                <StatCard onClick={() => navigate('/products')} color="blue" icon={<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />} label="Total Products" value={data.total_products || 0} />
                <StatCard onClick={() => navigate('/reports')} color="purple" icon={<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />} label="Reports" value={data.total_reports || 0} sub="generated reports" />
              </>
            ) : (
              <>
                <StatCard onClick={() => navigate('/sales')} color="green" icon={<line x1="12" y1="1" x2="12" y2="23" />} label="Your Sales" value={data.sales_count || 0} sub={`${inr(data.total_revenue)} revenue`} />
                <StatCard onClick={() => navigate('/products')} color="blue" icon={<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />} label="Products" value={data.products_count || 0} />
                <StatCard color="indigo" icon={<path d="M3 21h18" />} label={data.franchise_names?.length > 1 ? 'Franchises' : 'Franchise'} value={(data.franchise_names && data.franchise_names.length > 0) ? data.franchise_names.join(', ') : (data.franchise_name || 'N/A')} />
                <StatCard onClick={() => navigate('/inventory')} color="amber" icon={<path d="M21 10V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h6" />} label="Inventory" value="→" />
              </>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card bento-actions">
          <div className="card-header"><h3>⚡ Quick Actions</h3></div>
          <div className="quick-actions-row">
            <button className="btn btn-primary btn-sm" onClick={() => navigate('/sales')}>💰 New Sale</button>
            <button className="btn btn-secondary btn-sm" onClick={() => navigate('/expenses')}>📋 Record Expense</button>
            <button className="btn btn-secondary btn-sm" onClick={() => navigate('/approvals')}>✅ Review Approvals</button>
            <button className="btn btn-secondary btn-sm" onClick={() => navigate('/inventory')}>📦 Check Inventory</button>
            <button className="btn btn-secondary btn-sm" onClick={() => navigate('/compliance')}>🛡️ Compliance</button>
            <button className="btn btn-secondary btn-sm" onClick={() => navigate('/reports')}>📊 Reports</button>
          </div>
        </div>

        {/* Sales Trend Chart */}
        <div className="card bento-chart">
          <div className="card-header">
            <h3>📈 Sales Trend (7 Days)</h3>
            <Link to="/reports" style={{ fontSize: '.75rem' }}>Full Report →</Link>
          </div>
          <div style={{ padding: '1rem', overflowX: 'auto' }}>
            {hasSales ? (
              <svg width="440" height="190" viewBox="0 0 440 190" style={{ width: '100%', maxWidth: 440 }}>
                {dailySales.map((v, i) => {
                  const h = Math.round((v / maxVal) * 130) + 4;
                  const hue = 240 - i * 5;
                  const dayLabel = DAY_NAMES[new Date(last7[i]).getDay()];
                  return (
                    <g key={i}>
                      <rect x={i * 60 + 20} y={160 - h} width="44" height={h} rx="4" fill={`hsl(${hue},70%,60%)`} opacity="0.85" />
                      <text x={i * 60 + 42} y={175} textAnchor="middle" fontSize="10" fill="var(--text-muted)">{dayLabel}</text>
                      <text x={i * 60 + 42} y={152 - h} textAnchor="middle" fontSize="10" fill="var(--text-muted)" fontWeight="600">₹{(v / 1000).toFixed(1)}k</text>
                    </g>
                  );
                })}
              </svg>
            ) : (
              <div style={{ textAlign: 'center', padding: '2.5rem 0', color: 'var(--text-muted)' }}><p>No sales data yet</p></div>
            )}
          </div>
        </div>

        {/* Revenue Breakdown */}
        <div className="card bento-chart">
          <div className="card-header">
            <h3>💰 Revenue Breakdown</h3>
            <Link to="/reports" style={{ fontSize: '.75rem' }}>Details →</Link>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1.5rem', padding: '1rem' }}>
            {hasPieData ? (
              <>
                <svg width="120" height="120" viewBox="0 0 120 120">
                  {pieSlices.map((d) => <path key={d.label} d={d.path} fill={d.color} stroke="var(--surface)" strokeWidth="1.5"><title>{d.label}: {Math.round((d.value / pieTotal) * 100)}%</title></path>)}
                </svg>
                <div style={{ fontSize: '.75rem' }}>
                  {pieEntries.map((d) => (
                    <div key={d.label} style={{ display: 'flex', alignItems: 'center', gap: '.35rem', marginBottom: '.35rem' }}>
                      <span style={{ width: 10, height: 10, borderRadius: 2, background: d.color, display: 'inline-block' }} /> {d.label} ({Math.round((d.value / pieTotal) * 100)}%)
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>No financial data yet</p>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card bento-activity">
          <div className="card-header">
            <h3>🕐 Recent Activity</h3>
            <Link to="/audit" style={{ fontSize: '.75rem' }}>View All →</Link>
          </div>
          <div style={{ maxHeight: 280, overflowY: 'auto' }}>
            {(() => {
              const displayAudits = isAdmin ? audits : audits.filter((a) => a.action !== 'login' && a.action !== 'logout');
              if (!displayAudits.length) return <p className="text-muted" style={{ padding: '1rem', textAlign: 'center' }}>No recent activity</p>;
              return displayAudits.slice(0, 8).map((a, i) => {
                const color = actionColors[a.action] || '#64748B';
                const time = a.timestamp ? new Date(a.timestamp).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' }) : '';
                return (
                  <div className="activity-item" key={a.id ?? i}>
                    <div className="activity-dot" style={{ background: color }} />
                    <div>
                      <strong>{a.username || 'System'}</strong> {a.action}d <em>{a.entity_type || ''}</em><br />
                      <span className="activity-time">{time} — {a.description || ''}</span>
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      </div>
    </>
  );
}

function StatCard({ onClick, color, icon, label, value, sub }) {
  return (
    <div className="card stat-card" onClick={onClick} style={onClick ? { cursor: 'pointer' } : undefined}>
      <div className={`stat-icon ${color}`}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">{icon}</svg>
      </div>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  );
}
