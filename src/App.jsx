import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { NotificationProvider } from './context/NotificationContext';
import PublicLayout from './components/PublicLayout';
import HybridLayout from './components/HybridLayout';
import AppLayout from './components/AppLayout';
import RouteGuard from './components/RouteGuard';

import Landing from './pages/public/Landing';
import Features from './pages/public/Features';
import About from './pages/public/About';
import Contact from './pages/public/Contact';
import Modules from './pages/public/Modules';
import { Terms, Privacy } from './pages/public/Legal';
import Login from './pages/public/Login';
import Register from './pages/public/Register';

import Dashboard from './pages/app/Dashboard';
import Franchises from './pages/app/Franchises';
import Users from './pages/app/Users';
import Products from './pages/app/Products';
import Inventory from './pages/app/Inventory';
import Sales from './pages/app/Sales';
import Expenses from './pages/app/Expenses';
import Approvals from './pages/app/Approvals';
import Compliance from './pages/app/Compliance';
import Marketing from './pages/app/Marketing';
import Reports from './pages/app/Reports';
import Notifications from './pages/app/Notifications';
import Settings from './pages/app/Settings';
import Audit from './pages/app/Audit';
import Directory from './pages/app/Directory';
import Chat from './pages/app/Chat';

import NotFound from './pages/NotFound';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <NotificationProvider>
          <Routes>
            {/* Public marketing site */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<Navigate to="/landing" replace />} />
              <Route path="/landing" element={<Landing />} />
              <Route path="/features" element={<Features />} />
              <Route path="/about" element={<About />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
            </Route>

            {/* Routes that render differently for visitors vs. logged-in users:
                public marketing page when logged out, in-app page (with
                Sidebar/Header) when logged in */}
            <Route element={<HybridLayout />}>
              <Route path="/contact" element={<Contact />} />
              <Route path="/modules" element={<Modules />} />
            </Route>

            {/* Authenticated app */}
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/franchises" element={<RouteGuard route="franchises"><Franchises /></RouteGuard>} />
              <Route path="/users" element={<RouteGuard route="users"><Users /></RouteGuard>} />
              <Route path="/products" element={<RouteGuard route="products"><Products /></RouteGuard>} />
              <Route path="/inventory" element={<RouteGuard route="inventory"><Inventory /></RouteGuard>} />
              <Route path="/sales" element={<RouteGuard route="sales"><Sales /></RouteGuard>} />
              <Route path="/expenses" element={<RouteGuard route="expenses"><Expenses /></RouteGuard>} />
              <Route path="/approvals" element={<RouteGuard route="approvals"><Approvals /></RouteGuard>} />
              <Route path="/compliance" element={<RouteGuard route="compliance"><Compliance /></RouteGuard>} />
              <Route path="/marketing" element={<RouteGuard route="marketing"><Marketing /></RouteGuard>} />
              <Route path="/reports" element={<RouteGuard route="reports"><Reports /></RouteGuard>} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/audit" element={<RouteGuard route="audit"><Audit /></RouteGuard>} />
              <Route path="/discover" element={<Directory />} />
              <Route path="/messages" element={<Chat />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
          </NotificationProvider>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
