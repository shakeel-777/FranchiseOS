import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import AIChatPanel from './AIChatPanel';
import { useAuth } from '../context/AuthContext';

// For routes like /modules and /contact that render different content
// depending on auth state: logged-out visitors get the public marketing
// page (which supplies its own PublicNav/PublicFooter internally), while
// logged-in users get the in-app version and need the real Sidebar/Header
// chrome around it — the plain PublicLayout wrapper left them chrome-less.
export default function HybridLayout() {
  const { isLoggedIn, ready } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!ready) return null;

  if (!isLoggedIn) {
    return (
      <div className="landing-page">
        <Outlet />
      </div>
    );
  }

  return (
    <>
      <Sidebar open={sidebarOpen} />
      <Header onMenuToggle={() => setSidebarOpen((o) => !o)} />
      <main className="main">
        <Outlet />
      </main>
      <AIChatPanel />
      <div id="modalRoot" />
    </>
  );
}
