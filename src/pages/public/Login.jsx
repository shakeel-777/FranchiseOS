import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export default function Login() {
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    const u = username.trim();
    const p = password.trim();
    if (!u || !p) { setError('Please fill in all fields'); return; }
    setBusy(true);
    setError('');
    try {
      const me = await login(u, p, remember);
      navigate('/dashboard');
      toast('Welcome back, ' + (me.user?.first_name || u) + '!', 'success');
    } catch (err) {
      setError('Invalid username or password');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login-page">
      <div className="card login-card">
        <div className="logo-row">
          <img src="/img/logo.svg" alt="FranchiseOS" className="logo-box" style={{ width: 44, height: 44, borderRadius: 12, background: 'transparent' }} />
          <div><strong>FranchiseOS</strong><br /><small className="text-muted" style={{ textTransform: 'uppercase', letterSpacing: '.1em', fontSize: '.625rem' }}>Enterprise</small></div>
        </div>
        <h2 style={{ textAlign: 'center', marginBottom: '.25rem' }}>Welcome back</h2>
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '.8125rem', marginBottom: '1.5rem' }}>Sign in to your account</p>
        {error && <div className="login-error">{error}</div>}
        <form onSubmit={submit}>
          <div className="form-group"><label className="form-label">Username</label><input type="text" placeholder="Enter username" required value={username} onChange={(e) => setUsername(e.target.value)} /></div>
          <div className="form-group"><label className="form-label">Password</label><input type="password" placeholder="Enter password" required value={password} onChange={(e) => setPassword(e.target.value)} /></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.75rem', fontSize: '.75rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '.375rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} /> Remember me
            </label>
            <button type="button" onClick={() => toast('Please contact your administrator to reset your password.', 'info')} style={{ background: 'none', border: 'none', padding: 0, color: 'var(--primary, #4361ee)', cursor: 'pointer', fontSize: 'inherit' }}>Forgot password?</button>
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '.625rem' }} disabled={busy}>
            {busy ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '.8125rem', color: 'var(--text-muted)' }}>
          Don't have an account? <Link to="/register">Sign up</Link>
        </p>
      </div>
    </div>
  );
}
