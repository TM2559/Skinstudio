import React from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import { Loader2, Lock } from 'lucide-react';
import CustomerView from './CustomerView';
import AdminView from './AdminView';

export default function ReservationApp({
  loading,
  view,
  setView,
  adminPassword,
  setAdminPassword,
  loginError,
  setLoginError,
  handleLogoClick,
  handleLogin,
  services,
  schedule,
  schedulePmu = {},
  reservations,
  addons = [],
  serviceAddonLinks = [],
  widgetOnly = false,
  mode = 'light',
}) {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const initialServiceId = searchParams.get('service') || null;
  // PMU page must always use dark widget (bg-stone-950, rose gold accents)
  const isPmuRoute = widgetOnly && location.pathname === '/pmu';
  const isDark = mode === 'dark' || isPmuRoute;
  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-stone-400" size={32} />
      </div>
    );
  }

  const cardClass = isDark
    ? 'rounded-2xl overflow-hidden border border-stone-800 bg-stone-950 shadow-xl'
    : 'rounded-xl sm:rounded-2xl shadow-lg overflow-hidden';
  const cardStyle = isDark ? {} : { backgroundColor: 'var(--skin-white)', border: '1px solid var(--skin-beige-muted)' };
  const innerClass = isDark ? 'p-4 sm:p-8 bg-stone-950' : 'p-4 sm:p-10 bg-white';

  if (widgetOnly) {
    return (
      <div className="max-w-4xl mx-auto px-3 sm:px-4 py-6">
        <div className={cardClass} style={cardStyle}>
          <div className={innerClass}>
            <CustomerView
              services={services}
              schedule={schedule}
              schedulePmu={schedulePmu}
              reservations={reservations}
              initialServiceId={initialServiceId}
              theme={isDark ? 'dark' : 'light'}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-4 py-8">
      <div className={cardClass} style={cardStyle}>
        {/* Banner – typografické logo */}
        <div
          className="w-full border-b py-6 sm:py-8 cursor-default select-none active:opacity-95 transition-opacity text-center"
          style={{ borderColor: 'var(--skin-beige-muted)', backgroundColor: 'var(--skin-cream)' }}
          onClick={handleLogoClick}
          onKeyDown={(e) => e.key === 'Enter' && handleLogoClick()}
          role="button"
          tabIndex={0}
          aria-label="Logo"
        >
          <span className="font-display font-bold text-2xl sm:text-3xl tracking-wide text-[var(--skin-charcoal)]">
            Skin Studio
          </span>
        </div>

        <div className={innerClass}>
          {view === 'customer' && (
            <CustomerView
              services={services}
              schedule={schedule}
              schedulePmu={schedulePmu}
              reservations={reservations}
              initialServiceId={initialServiceId}
            />
          )}

          {view === 'login' && (
            <div className="max-w-sm mx-auto py-16 sm:py-20 text-center animate-in zoom-in">
              <Lock className="mx-auto mb-4 text-stone-200" size={48} />
              <h2 className="font-serif text-2xl mb-6 text-stone-800 font-bold">Admin Vstup</h2>
              <form onSubmit={handleLogin} className="space-y-4">
                <input
                  autoFocus
                  type="password"
                  placeholder="Heslo"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="w-full p-4 rounded-xl border border-stone-200 text-center text-lg outline-none focus:ring-1 focus:ring-stone-400"
                />
                {loginError && (
                  <p className="text-red-500 text-xs font-bold animate-pulse">{loginError}</p>
                )}
                <button
                  type="submit"
                  className="w-full bg-stone-800 text-white py-4 rounded-xl font-bold uppercase tracking-widest text-[10px] hover:bg-black transition-all"
                >
                  Přihlásit
                </button>
                <button
                  type="button"
                  onClick={() => setView('customer')}
                  className="text-xs text-stone-400 hover:underline"
                >
                  Zpět na web
                </button>
              </form>
            </div>
          )}

          {view === 'admin' && (
            <AdminView
              services={services}
              schedule={schedule}
              schedulePmu={schedulePmu}
              reservations={reservations}
              addons={addons}
              serviceAddonLinks={serviceAddonLinks}
              onLogout={() => {
                setView('customer');
                setAdminPassword('');
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
