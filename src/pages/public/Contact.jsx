import { useAuth } from '../../context/AuthContext';
import PublicNav from '../../components/PublicNav';
import PublicFooter from '../../components/PublicFooter';
import ContactForm from '../../components/ContactForm';
import { Icon } from '../../icons';
import { useRevealSections } from '../../hooks/useRevealSections';

export default function Contact() {
  const { isLoggedIn } = useAuth();
  useRevealSections();

  if (isLoggedIn) {
    return (
      <>
        <div className="page-header">
          <h2>Contact Support</h2>
          <p className="text-muted">Get in touch with the FranchiseOS administration team</p>
        </div>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
            <h4 style={{ marginBottom: '0.5rem', fontSize: '0.95rem' }}>Platform Support</h4>
            <p className="text-muted" style={{ marginBottom: '1.25rem', fontSize: '0.85rem', lineHeight: 1.6 }}>
              Have questions, issues, or need help configuring a new location? Fill out the form or reach us directly. We typically respond within hours.
            </p>
            <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', fontSize: '0.85rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>{Icon.mail('#d49b3e')}hello@franchiseos.com</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>{Icon.phone('#d49b3e')}+1 (555) 123-4567</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>{Icon.map('#d49b3e')}San Francisco, CA</span>
            </div>
          </div>
          <ContactForm plain />
        </div>
      </>
    );
  }

  return (
    <>
      <PublicNav active="contact" />
      <section className="landing-section contact-section revealed" style={{ paddingTop: '7rem', minHeight: '100vh' }}>
        <div className="landing-container">
          <div className="contact-wrapper">
            <div className="contact-info">
              <div className="section-eyebrow">Get In Touch</div>
              <h3>Let's talk</h3>
              <p>Questions? Want a demo? We respond within hours.</p>
              <div className="contact-detail">{Icon.mail('#d49b3e')}<span>hello@franchiseos.com</span></div>
              <div className="contact-detail">{Icon.phone('#d49b3e')}<span>+1 (555) 123-4567</span></div>
              <div className="contact-detail">{Icon.map('#d49b3e')}<span>San Francisco, CA</span></div>
            </div>
            <ContactForm />
          </div>
        </div>
      </section>
      <PublicFooter />
    </>
  );
}
