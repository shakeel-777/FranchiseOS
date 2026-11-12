import { useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import AIChatPanel from './AIChatPanel';
import { useAuth } from '../context/AuthContext';

export default function AppLayout() {
  const { isLoggedIn, ready } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    return localStorage.getItem('fos_sidebar_collapsed') === 'true';
  });

  const toggleCollapsed = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('fos_sidebar_collapsed', String(next));
      return next;
    });
  };

  if (!ready) return null;
  if (!isLoggedIn) return <Navigate to="/login" replace />;

  return (
    <div className="app-container">
      {/* Mobile overlay */}
      <div className={`mobile-overlay${sidebarOpen ? ' open' : ''}`} onClick={() => setSidebarOpen(false)} />

      <Sidebar
        open={sidebarOpen}
        collapsed={sidebarCollapsed}
        onToggleCollapse={toggleCollapsed}
        onClose={() => setSidebarOpen(false)}
      />
      <Header
        onMenuToggle={() => setSidebarOpen((o) => !o)}
        sidebarCollapsed={sidebarCollapsed}
      />
      <main className="main">
        <Outlet />
      </main>
      <AIChatPanel />
      <div id="modalRoot" />
    </div>
  );
}
