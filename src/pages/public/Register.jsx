import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthAPI } from '../../api/client';
import { useToast } from '../../context/ToastContext';

export default function Register() {
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ first: '', last: '', email: '', user: '', pass: '', pass2: '', terms: false });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  function set(k) {
    return (e) => setForm((f) => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));
  }

  async function submit(e) {
    e.preventDefault();
    const { first, last, email, user, pass, pass2, terms } = form;
    if (!first || !last || !email || !user || !pass) { setError('All fields are required'); return; }
    if (pass !== pass2) { setError('Passwords do not match'); return; }
    if (pass.length < 6) { setError('Password must be at least 6 characters'); return; }
    if (!terms) { setError('Please accept the Terms & Conditions'); return; }
    setBusy(true);
    setError('');
    try {
      await AuthAPI.register({ username: user, password: pass, first_name: first, last_name: last, email });
      toast('Account created! Please sign in.', 'success');
      navigate('/login');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login-page">
      <div className="card login-card">
        <div className="logo-row">
          <div className="logo-box">FO</div>
          <div><strong>FranchiseOS</strong><br /><small className="text-muted" style={{ textTransform: 'uppercase', letterSpacing: '.1em', fontSize: '.625rem' }}>Enterprise</small></div>
        </div>
        <h2 style={{ textAlign: 'center', marginBottom: '.25rem' }}>Create your account</h2>
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '.8125rem', marginBottom: '1.25rem' }}>Start managing your franchise operations</p>
        {error && <div className="login-error">{error}</div>}
        <form onSubmit={submit}>
          <div className="form-row">
            <div className="form-group"><label className="form-label">First Name</label><input type="text" placeholder="John" required value={form.first} onChange={set('first')} /></div>
            <div className="form-group"><label className="form-label">Last Name</label><input type="text" placeholder="Doe" required value={form.last} onChange={set('last')} /></div>
          </div>
          <div className="form-group"><label className="form-label">Email</label><input type="email" placeholder="you@company.com" required value={form.email} onChange={set('email')} /></div>
          <div className="form-group"><label className="form-label">Username</label><input type="text" placeholder="Choose a username" required minLength={3} value={form.user} onChange={set('user')} /></div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Password</label><input type="password" placeholder="Min. 6 chars" required minLength={6} value={form.pass} onChange={set('pass')} /></div>
            <div className="form-group"><label className="form-label">Confirm</label><input type="password" placeholder="Re-enter" required value={form.pass2} onChange={set('pass2')} /></div>
          </div>
          <div style={{ margin: '1rem 0', fontSize: '.8125rem' }}>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '.5rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={form.terms} onChange={set('terms')} />
              <span>I agree to the <Link to="/terms" target="_blank">Terms &amp; Conditions</Link> and <Link to="/privacy" target="_blank">Privacy Policy</Link></span>
            </label>
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '.625rem' }} disabled={busy}>
            {busy ? 'Creating...' : 'Create Account'}
          </button>
        </form>
        <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '.8125rem', color: 'var(--text-muted)' }}>
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
