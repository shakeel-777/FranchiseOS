import PublicNav from '../../components/PublicNav';
import PublicFooter from '../../components/PublicFooter';
import { useRevealSections } from '../../hooks/useRevealSections';

const h3style = { fontFamily: "'Inter',sans-serif", fontSize: '0.95rem', margin: '1.25rem 0 0.35rem' };
const pstyle = { color: '#4a4d53' };

const TERMS_SECTIONS = [
  ['1. Acceptance of Terms', 'By accessing and using FranchiseOS, you agree to be bound by these Terms.'],
  ['2. Account Registration', 'You must provide accurate information. You are responsible for maintaining login confidentiality.'],
  ['3. Acceptable Use', 'You agree not to use the Platform unlawfully, gain unauthorized access, disrupt the service, or upload malicious code.'],
  ['4. Data Privacy', 'We process data per our Privacy Policy. We never sell your data. You retain full ownership.'],
  ['5. Intellectual Property', 'All trademarks, logos, and software are exclusive property of FranchiseOS Global.'],
  ['6. Limitation of Liability', 'The Platform is provided \u201cas is\u201d without warranties.'],
  ['7. Termination', 'We may suspend accounts that violate these Terms. Export your data within 30 days.'],
  ['8. Governing Law', 'California law. Disputes in San Francisco County courts.'],
];

const PRIVACY_SECTIONS = [
  ['1. Information We Collect', 'Account details, franchise operational data, and basic usage logs.'],
  ['2. How We Use Data', 'To operate your dashboard, generate reports, send notifications, and improve reliability.'],
  ['3. Data Storage & Security', 'Access-controlled database, encrypted connections, JWT authentication, role-based access.'],
  ['4. Data Sharing', 'Admin roles see all data; franchise-level users see only their own. No sharing with advertisers.'],
  ['5. Cookies & Local Storage', 'Browser local storage for sessions. No third-party tracking.'],
  ['6. Your Rights', 'Request a copy, correction, or deletion of your data any time.'],
  ['7. Data Retention', 'Retained while account is active plus a reasonable audit period.'],
];

function LegalPage({ active, title, sections, contactLine }) {
  useRevealSections();
  return (
    <>
      <PublicNav active={active} />
      <section className="landing-section revealed" style={{ background: '#fff', paddingTop: '6rem' }}>
        <div className="landing-container" style={{ maxWidth: 780 }}>
          <div style={{ background: '#fff', border: '1px solid #e8e6e0', padding: '2.5rem' }}>
            <h1 style={{ fontFamily: "'DM Serif Display',Georgia,serif", fontSize: '2.2rem', marginBottom: '0.5rem', color: '#1a1d23' }}>{title}</h1>
            <p style={{ color: '#6b737d', marginBottom: '1.5rem', fontFamily: "'Inter',sans-serif", fontSize: '0.84rem' }}>Last updated: July 1, 2026</p>
            <div style={{ fontSize: '0.85rem', lineHeight: 1.7, fontFamily: "'Inter',sans-serif", color: '#1a1d23' }}>
              {sections.map(([h, p]) => (
                <div key={h}>
                  <h3 style={h3style}>{h}</h3>
                  <p style={pstyle}>{p}</p>
                </div>
              ))}
              <h3 style={h3style}>Contact</h3>
              <p style={pstyle}>{contactLine}</p>
            </div>
          </div>
        </div>
      </section>
      <PublicFooter />
    </>
  );
}

export function Terms() {
  return <LegalPage active="terms" title="Terms & Conditions" sections={TERMS_SECTIONS} contactLine={<a href="mailto:legal@franchiseos.com">legal@franchiseos.com</a>} />;
}

export function Privacy() {
  return <LegalPage active="privacy" title="Privacy Policy" sections={PRIVACY_SECTIONS} contactLine={<a href="mailto:privacy@franchiseos.com">privacy@franchiseos.com</a>} />;
}
