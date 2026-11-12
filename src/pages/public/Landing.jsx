import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PublicNav from '../../components/PublicNav';
import PublicFooter from '../../components/PublicFooter';
import ContactForm from '../../components/ContactForm';
import { Icon } from '../../icons';
import { FEATURES, MODULES, STATS, FAQS, renderFeatureCells } from '../../data/landingData';
import { useRevealSections } from '../../hooks/useRevealSections';

const STEPS = [
  { num: '1', title: 'Create Your Account', desc: 'Sign up in seconds. Start exploring the platform — no credit card required.' },
  { num: '2', title: 'Configure Your Network', desc: 'Add locations, products, and team members. Our setup guides you step by step.' },
  { num: '3', title: 'Run & Scale', desc: 'Track sales, manage inventory, monitor compliance. Our system helps you spot opportunities while you focus on growth.' },
];

function scrollToSection(id, navigate) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  else navigate('/' + id);
}

export default function Landing() {
  const navigate = useNavigate();
  useRevealSections();

  useEffect(() => {
    let faqEls = document.querySelectorAll('.faq-item');
    faqEls.forEach((el) => {
      const handler = () => el.classList.toggle('open');
      el.addEventListener('click', handler);
      el._faqHandler = handler;
    });
    return () => faqEls.forEach((el) => el.removeEventListener('click', el._faqHandler));
  }, []);

  return (
    <>
      <PublicNav active="home" />

      <section className="hero-section">
        <div className="hero-bg-anim">
          <div className="hero-slide slide1" />
          <div className="hero-slide slide2" />
          <div className="hero-slide slide3" />
        </div>
        <div className="hero-grid">
          <div className="hero-content">
            <div className="hero-badge"><span className="hero-badge-dot" />Enterprise Franchise Operations</div>
            <h1 className="hero-headline">One platform to <span className="highlight">orchestrate</span> your franchise empire</h1>
            <p className="hero-desc">Centralize every location, automate compliance, track revenue live, and surface key operational insights automatically.</p>
            <div className="hero-actions">
              <button className="btn-primary-hero" onClick={() => navigate('/register')}>Start Free Trial</button>
              <button className="btn-outline-hero" onClick={() => scrollToSection('features', navigate)}>See What It Does</button>
            </div>
          </div>
          <div>
            <div className="hero-dashboard-mock">
              <div className="mock-dots"><span className="mock-dot" /><span className="mock-dot" /><span className="mock-dot" /></div>
              <div className="mock-row"><span className="mock-block accent" /><span className="mock-block wide" /></div>
              <div className="mock-row"><span className="mock-block wide" /><span className="mock-block accent" /></div>
              <div className="mock-row"><span className="mock-block" /><span className="mock-block" /></div>
              <div className="mock-bars">
                {[30, 55, 40, 78, 50, 85, 62].map((h, i) => <span className="mock-bar" style={{ height: h + '%' }} key={i} />)}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="stats-section">
        <div className="stats-grid">
          {STATS.map((s) => (
            <div className="stat-item" key={s.label}>
              <div className="stat-icon-wrap">{Icon[s.icon]('#d49b3e')}</div>
              <div><div className="stat-value">{s.value}</div><div className="stat-label-text">{s.label}</div></div>
            </div>
          ))}
        </div>
      </section>

      <section className="landing-section features-section" id="features">
        <div className="landing-container">
          <div className="features-header">
            <div className="section-eyebrow">Platform Capabilities</div>
            <h2 className="section-title">Everything you need to scale</h2>
            <p className="section-subtitle">From multi-location dashboards to real-time insights — a complete operating system for franchise networks, built by people who understand the business.</p>
          </div>
          <div className="features-grid">{renderFeatureCells()}</div>
        </div>
      </section>

      <section className="landing-section steps-section">
        <div className="landing-container">
          <div className="steps-header">
            <div className="section-eyebrow">Getting Started</div>
            <h2 className="section-title">How it works</h2>
          </div>
          <div className="steps-grid">
            {STEPS.map((s) => (
              <div className="step-card" key={s.num}>
                <div className="step-number-circle">{s.num}</div>
                <h4>{s.title}</h4>
                <p>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-section modules-section" id="modules">
        <div className="landing-container">
          <div className="modules-header">
            <div className="section-eyebrow">Platform Modules</div>
            <h2 className="section-title">Fourteen modules, one platform</h2>
            <p className="section-subtitle">Every aspect of franchise operations covered. Use what you need — the rest stays out of your way.</p>
          </div>
          <div className="modules-grid">
            {MODULES.map((m) => (
              <div className="module-chip" key={m.label}>{Icon[m.icon]('#5a6370')}<span>{m.label}</span></div>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-section contact-section" id="contact">
        <div className="landing-container">
          <div className="contact-wrapper">
            <div className="contact-info">
              <div className="section-eyebrow">Get In Touch</div>
              <h3>Let's talk about your franchise network</h3>
              <p>Five locations or five hundred — we'll show you how FranchiseOS streamlines everything. We respond within hours, not days.</p>
              <div className="contact-detail">{Icon.mail('#d49b3e')}<span>hello@franchiseos.com</span></div>
              <div className="contact-detail">{Icon.phone('#d49b3e')}<span>+1 (555) 123-4567</span></div>
              <div className="contact-detail">{Icon.map('#d49b3e')}<span>San Francisco, CA</span></div>
            </div>
            <ContactForm withScale />
          </div>
        </div>
      </section>

      <section className="landing-section faq-section" id="faq">
        <div className="landing-container">
          <div className="faq-header">
            <div className="section-eyebrow">FAQ</div>
            <h2 className="section-title">Common questions</h2>
          </div>
          <div className="faq-list">
            {FAQS.map((f) => (
              <div className="faq-item" key={f.q}>
                <div className="faq-q"><span>{f.q}</span>{Icon.plus('#d49b3e')}</div>
                <div className="faq-a">{f.a}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="cta-section">
        <h2 className="section-title">Ready to transform your franchise operations?</h2>
        <p>Join 200+ franchise networks already running on FranchiseOS.</p>
        <button className="btn-primary-hero" onClick={() => navigate('/register')}>Start Free Trial</button>
      </section>

      <PublicFooter />
    </>
  );
}
