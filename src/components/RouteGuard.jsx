import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { canOpenRoute } from '../utils/format';

// Wraps a page component and enforces the same route permission rules as
// canOpenRoute() in the original app (role-gated + franchise-gated routes).
export default function RouteGuard({ route, children }) {
  const { currentUser } = useAuth();
  const toast = useToast();
  const allowed = canOpenRoute(currentUser, route);

  useEffect(() => {
    if (!allowed) toast("You don't have permission to view that page.", 'error');
  }, [allowed]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!allowed) return <Navigate to="/dashboard" replace />;
  return children;
}
