import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import PublicNav from '../../components/PublicNav';
import PublicFooter from '../../components/PublicFooter';
import { renderFeatureCells } from '../../data/landingData';
import { useRevealSections } from '../../hooks/useRevealSections';

export default function Features() {
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();
  useRevealSections();

  if (isLoggedIn) {
    return (
      <>
        <div className="page-header"><h2>Platform Features</h2><p className="text-muted">Everything you need to run franchise operations efficiently</p></div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: '1.25rem' }}>
          {renderFeatureCells()}
        </div>
      </>
    );
  }

  return (
    <>
      <PublicNav active="features" />
      <section className="landing-section features-section revealed" style={{ paddingTop: '7rem', minHeight: '100vh', background: '#fafaf8' }}>
        <div className="landing-container">
          <div className="features-header">
            <h2 className="section-title" style={{ fontSize: '2.4rem' }}>Platform Features</h2>
            <p className="section-subtitle">Everything you need to run franchise operations efficiently</p>
          </div>
          <div className="features-grid">{renderFeatureCells()}</div>
          <div style={{ textAlign: 'center', marginTop: '2.5rem', paddingBottom: '2rem' }}>
            <p style={{ color: '#6b737d', marginBottom: '0.75rem', fontFamily: "'Inter',sans-serif" }}>Ready to get started?</p>
            <button className="btn-primary-hero" onClick={() => navigate('/register')}>Create Free Account</button>
          </div>
        </div>
      </section>
      <PublicFooter />
    </>
  );
}
