import { useNavigate } from 'react-router-dom';
import PublicNav from '../../components/PublicNav';
import PublicFooter from '../../components/PublicFooter';
import { STATS } from '../../data/landingData';
import { useRevealSections } from '../../hooks/useRevealSections';

const TECH_STACK = [
  { cat: 'Frontend', items: 'React 18, Vite 5, CSS3, SVG' },
  { cat: 'Backend', items: 'Django 5, Django REST Framework, JWT Auth' },
  { cat: 'Database', items: 'SQLite / PostgreSQL, Django ORM' },
  { cat: 'Security', items: 'JWT Tokens, Role-Based Access, Audit Logging' },
  { cat: 'Platform', items: 'Windows, Linux, macOS — single codebase' },
];

export default function About() {
  const navigate = useNavigate();
  useRevealSections();

  return (
    <>
      <PublicNav active="about" />
      <section className="landing-section revealed" style={{ background: '#0c0f13', paddingTop: '7rem', paddingBottom: '4rem', minHeight: '100vh' }}>
        <div className="landing-container">

          <div className="about-header" style={{ marginBottom: '3rem' }}>
            <div className="section-eyebrow" style={{ color: '#9a9484' }}>About Us</div>
            <h1 className="section-title" style={{ color: '#ece8e0' }}>FranchiseOS</h1>
            <p style={{ color: '#6b737d', fontSize: '1.1rem', maxWidth: 600 }}>Digital Franchise Operations Management System — built for scale, designed for clarity.</p>
          </div>

          <div className="about-mission" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem', marginBottom: '3rem', alignItems: 'center' }}>
            <div>
              <h3 style={{ color: '#ece8e0', fontSize: '1.4rem', marginBottom: '1rem' }}>One platform. Every location. Total clarity.</h3>
              <p style={{ color: '#6b737d', lineHeight: 1.7, marginBottom: '1rem', fontSize: '0.95rem' }}>
                FranchiseOS replaces the patchwork of spreadsheets, emails, and disconnected tools that franchise operators deal with every day. From sales tracking to compliance monitoring — one source of truth across every location.
              </p>
              <p style={{ color: '#6b737d', lineHeight: 1.7, fontSize: '0.95rem' }}>
                Built with Django and React. Enterprise-grade performance without the enterprise complexity. Deploy anywhere, scale to thousands of locations.
              </p>
            </div>
            <div className="about-stats-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
              {STATS.map((s) => (
                <div key={s.label} className="about-stat-card" style={{
                  background: '#14171c', border: '1px solid #1e2227', borderRadius: 12,
                  padding: '1.25rem', textAlign: 'center',
                }}>
                  <div style={{ color: '#d49b3e', fontFamily: "'DM Serif Display', Georgia, serif", fontSize: '1.8rem', fontWeight: 700, marginBottom: '0.25rem' }}>{s.value}</div>
                  <div style={{ color: '#6b737d', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          <h3 className="about-tech-title" style={{ color: '#ece8e0', fontSize: '1.2rem', marginBottom: '1.5rem' }}>Technology Stack</h3>
          <div className="about-tech-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', marginBottom: '3rem' }}>
            {TECH_STACK.map((t) => (
              <div key={t.cat} className="about-tech-card" style={{
                background: '#14171c', border: '1px solid #1e2227', borderRadius: 12,
                padding: '1.5rem',
              }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#d49b3e', marginBottom: '0.75rem' }} />
                <h4 style={{ color: '#ece8e0', fontSize: '0.85rem', marginBottom: '0.25rem' }}>{t.cat}</h4>
                <p style={{ color: '#6b737d', fontSize: '0.78rem', lineHeight: 1.5 }}>{t.items}</p>
              </div>
            ))}
          </div>

          <div className="about-cta" style={{ textAlign: 'center', padding: '2rem 0' }}>
            <p style={{ color: '#6b737d', marginBottom: '1rem' }}>Want to see how FranchiseOS can streamline your operations?</p>
            <button className="btn-primary-hero" onClick={() => navigate('/contact')}>Get in Touch</button>
          </div>

        </div>
      </section>
      <PublicFooter />
    </>
  );
}
