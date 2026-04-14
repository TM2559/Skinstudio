import React from 'react';
import { useLocation, Navigate, useNavigate } from 'react-router-dom';
import { BookingSuccess } from './CustomerView';

export default function ThankYouPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state;

  if (!state?.serviceName) return <Navigate to="/" replace />;

  const isDark = state.theme === 'dark';
  const backUrl = isDark ? '/pmu' : '/';

  return (
    <div
      className={`min-h-screen flex items-center justify-center px-4 py-12 font-sans ${isDark ? 'bg-stone-950' : ''}`}
      style={!isDark ? { backgroundColor: 'var(--skin-cream)' } : undefined}
    >
      <div className={`w-full max-w-lg p-6 sm:p-10 rounded-2xl border shadow-xl ${isDark ? 'bg-stone-950 border-stone-800' : 'bg-white border-stone-100'}`}>
        <BookingSuccess
          isDark={isDark}
          reservationDetails={state}
          onReset={() => navigate(backUrl)}
        />
      </div>
    </div>
  );
}
