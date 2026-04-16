import React, { useEffect, lazy, Suspense } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

import Layout from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';
import { useData } from './contexts/DataContext';
import { useAdminAuth } from './contexts/AdminAuthContext';

const ReservationApp = lazy(() => import('./components/ReservationApp'));
const CosmeticsPage = lazy(() => import('./components/CosmeticsPage'));
const PMUPage = lazy(() => import('./components/PMUPage'));
const ThankYouPage = lazy(() => import('./components/ThankYouPage'));
const PrivacyPage = lazy(() => import('./components/PrivacyPage'));
const GiftVoucherCheckoutPage = lazy(() => import('./components/voucher/GiftVoucherCheckoutPage'));
const VoucherSuccessPage = lazy(() => import('./components/voucher/VoucherSuccessPage'));

function PageLoader() {
  return (
    <div className="min-h-[40vh] flex items-center justify-center">
      <Loader2 className="animate-spin text-stone-400" size={24} />
    </div>
  );
}

export default function App() {
  const location = useLocation();
  const data = useData();
  const adminAuth = useAdminAuth();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  if (data.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <Loader2 className="animate-spin text-stone-400" size={32} />
      </div>
    );
  }

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route
          path="/"
          element={
            <Layout setView={adminAuth.setView}>
              <CosmeticsPage services={data.servicesStandardOnly} />
            </Layout>
          }
        />
        <Route
          path="/kosmetika"
          element={
            <Layout setView={adminAuth.setView}>
              <CosmeticsPage services={data.servicesStandardOnly} />
            </Layout>
          }
        />
        <Route
          path="/pmu"
          element={
            <ErrorBoundary resetKey={location.key}>
              <PMUPage
                services={data.servicesWithAddons}
                schedule={data.schedulePmu}
                reservations={data.reservations}
              />
            </ErrorBoundary>
          }
        />
        <Route
          path="/dekujeme"
          element={
            <ErrorBoundary resetKey={location.key}>
              <ThankYouPage />
            </ErrorBoundary>
          }
        />
        <Route
          path="/darkove-poukazy"
          element={
            <ErrorBoundary resetKey={location.key}>
              <GiftVoucherCheckoutPage />
            </ErrorBoundary>
          }
        />
        <Route
          path="/poukaz/success"
          element={
            <ErrorBoundary resetKey={location.key}>
              <VoucherSuccessPage />
            </ErrorBoundary>
          }
        />
        <Route
          path="/zpracovani-osobnich-udaju"
          element={
            <Layout setView={adminAuth.setView}>
              <PrivacyPage />
            </Layout>
          }
        />
        <Route path="/cenik" element={<Navigate to="/#cenik" replace />} />
        <Route
          path="/rezervace"
          element={
            <Layout
              setView={adminAuth.setView}
              hideFooter={adminAuth.view === 'admin'}
              hideHeader={adminAuth.view === 'admin'}
              hideInstagram={adminAuth.view === 'admin'}
            >
              <ReservationApp
                loading={false}
                view={adminAuth.view}
                setView={adminAuth.setView}
                adminPassword={adminAuth.adminPassword}
                setAdminPassword={adminAuth.setAdminPassword}
                loginError={adminAuth.loginError}
                setLoginError={adminAuth.setLoginError}
                handleLogoClick={adminAuth.handleLogoClick}
                handleLogin={adminAuth.handleLogin}
                isLoggingIn={adminAuth.isLoggingIn}
                onWebAuthnLoginSuccess={adminAuth.handleWebAuthnLoginSuccess}
                showFaceIdSetupPrompt={adminAuth.showFaceIdSetupPrompt}
                onSkipFaceIdSetup={adminAuth.handleSkipFaceIdSetup}
                onFaceIdSetupDone={adminAuth.handleFaceIdSetupDone}
                services={data.servicesWithAddons}
                schedule={data.schedule}
                schedulePmu={data.schedulePmu}
                reservations={data.reservations}
                addons={data.addons}
                serviceAddonLinks={data.serviceAddonLinks}
                voucherTemplates={data.voucherTemplates}
                voucherOrders={data.voucherOrders}
              />
            </Layout>
          }
        />
      </Routes>
    </Suspense>
  );
}
