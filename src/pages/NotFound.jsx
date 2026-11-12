import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div style={{ textAlign: 'center', padding: '4rem' }}>
      <h1>404</h1>
      <p className="text-muted">Page not found</p>
      <Link to="/dashboard">Go home</Link>
    </div>
  );
}
