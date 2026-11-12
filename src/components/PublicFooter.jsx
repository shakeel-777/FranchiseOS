import { Link, useNavigate } from 'react-router-dom';

export default function PublicFooter() {
  const navigate = useNavigate();
  return (
    <footer className="landing-footer">
      <div className="footer-grid">
        <div className="footer-brand-col">
          <div className="mark">FO</div>
          <p>Enterprise franchise operations platform. Manage every location, track revenue, automate compliance — from one place.</p>
        </div>
        <div className="footer-col">
          <h5>Product</h5>
          <Link to="/features">Features</Link>
          <Link to="/modules">Modules</Link>
          <Link to="/contact">Contact</Link>
          <Link to="/register">Sign Up</Link>
        </div>
        <div className="footer-col">
          <h5>Company</h5>
          <Link to="/about">About</Link>
          <Link to="/terms">Terms</Link>
          <Link to="/privacy">Privacy</Link>
        </div>
        <div className="footer-col">
          <h5>Reach Us</h5>
          <a href="mailto:hello@franchiseos.com">hello@franchiseos.com</a>
          <span>San Francisco, CA</span>
        </div>
      </div>
      <div className="footer-bottom">
        <span>&copy; 2026 FranchiseOS</span>
        <span>Windows &amp; Linux</span>
      </div>
    </footer>
  );
}
