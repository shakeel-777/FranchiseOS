import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const LINKS = [
  { to: '/landing', label: 'Home' },
  { to: '/features', label: 'Features' },
  { to: '/modules', label: 'Modules' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
];

export default function PublicNav({ active }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <nav className="landing-nav">
      <div className="landing-nav-brand" onClick={() => navigate('/landing')}>
        <img src="/img/logo.svg" alt="FranchiseOS" className="mark" style={{ width: 32, height: 32, borderRadius: 8, background: 'transparent' }} />
        <div>FranchiseOS<span className="sub">Enterprise</span></div>
      </div>
      <button className="landing-nav-toggle" aria-label="Toggle menu" onClick={() => setOpen((o) => !o)}>
        {open ? '\u2715' : '\u2630'}
      </button>
      <div className={`landing-nav-links${open ? ' mobile-open' : ''}`}>
        {LINKS.map((l) => (
          <Link
            key={l.to}
            to={l.to}
            style={active === l.label.toLowerCase() ? { color: '#d49b3e', fontWeight: 600 } : undefined}
            onClick={() => setOpen(false)}
          >
            {l.label}
          </Link>
        ))}
      </div>
      <div className="landing-nav-actions">
        <button className="btn-signin" onClick={() => navigate('/login')}>Sign In</button>
        <button className="btn-start" onClick={() => navigate('/register')}>Get Started</button>
      </div>
    </nav>
  );
}
