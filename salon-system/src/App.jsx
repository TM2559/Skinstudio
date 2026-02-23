import React, { useState, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

import Layout from './components/Layout';
import ReservationApp from './components/ReservationApp';
import CosmeticsPage from './components/CosmeticsPage';
import PMUPage from './components/PMUPage';
import ErrorBoundary from './components/ErrorBoundary';
import useFirebaseData from './hooks/useFirebaseData';

export default function App() {
  const location = useLocation();
  const {
    loading,
    reservations,
    schedule,
    schedulePmu,
    addons,
    serviceAddonLinks,
    servicesStandardOnly,
    servicesWithAddons,
  } = useFirebaseData();

  const [view, setView] = useState('customer');
  const [adminPassword, setAdminPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [clicks, setClicks] = useState(0);

  useEffect(() => {
    if (location.pathname === '/rezervace') {
      setView('customer');
      window.scrollTo(0, 0);
    }
  }, [location.pathname]);

  useEffect(() => {
    if (clicks > 0) {
      const t = setTimeout(() => setClicks(0), 2000);
      return () => clearTimeout(t);
    }
  }, [clicks]);

  const handleLogoClick = () => {
    const newCount = clicks + 1;
    if (newCount >= 7) {
      setView('login');
      setClicks(0);
    } else {
      setClicks(newCount);
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (adminPassword === import.meta.env.VITE_ADMIN_PASSWORD) {
      setView('admin');
      setLoginError('');
    } else {
      setLoginError('Chybné heslo');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <Loader2 className="animate-spin text-stone-400" size={32} />
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <Routes>
        <Route
          path="/"
          element={
            <Layout setView={setView}>
              <CosmeticsPage services={servicesStandardOnly} />
            </Layout>
          }
        />
        <Route
          path="/kosmetika"
          element={
            <Layout setView={setView}>
              <CosmeticsPage services={servicesStandardOnly} />
            </Layout>
          }
        />
        <Route
          path="/pmu"
          element={
            <ErrorBoundary>
              <PMUPage
                services={servicesWithAddons}
                schedule={schedulePmu}
                reservations={reservations}
              />
            </ErrorBoundary>
          }
        />
        <Route
          path="/rezervace"
          element={
            <Layout setView={setView}>
              <ErrorBoundary>
                <ReservationApp
                  loading={false}
                  view={view}
                  setView={setView}
                  adminPassword={adminPassword}
                  setAdminPassword={setAdminPassword}
                  loginError={loginError}
                  setLoginError={setLoginError}
                  handleLogoClick={handleLogoClick}
                  handleLogin={handleLogin}
                  services={servicesWithAddons}
                  schedule={schedule}
                  schedulePmu={schedulePmu}
                  reservations={reservations}
                  addons={addons}
                  serviceAddonLinks={serviceAddonLinks}
                />
              </ErrorBoundary>
            </Layout>
          }
        />
      </Routes>
    </ErrorBoundary>
  );
}
