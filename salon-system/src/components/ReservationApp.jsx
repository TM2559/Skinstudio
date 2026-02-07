import React, { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Loader2, Lock } from 'lucide-react';
import CustomerView from './CustomerView';
import AdminView from './AdminView';

const CATEGORY_STANDARD = 'STANDARD';
const CATEGORY_PMU = 'PMU';

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
  setSchedule,
  schedulePmu,
  setSchedulePmu,
  reservations,
  addons = [],
  serviceAddonLinks = [],
  mode = 'light',
  widgetOnly = false,
}) {
  const [searchParams] = useSearchParams();
  const initialServiceId = searchParams.get('service') || null;

  const filteredServices = useMemo(() => {
    const category = mode === 'dark' ? CATEGORY_PMU : CATEGORY_STANDARD;
    return services.filter((s) => (s.category || CATEGORY_STANDARD) === category);
  }, [services, mode]);

  const effectiveSchedule = mode === 'dark' && schedulePmu ? schedulePmu : schedule;

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-stone-400" size={32} />
      </div>
    );
  }

  const isDark = mode === 'dark';

  const content = (
    <div className={`p-4 sm:p-10 ${isDark ? 'bg-stone-950' : 'bg-white'}`}>
      {(widgetOnly || view === 'customer') && (
        <CustomerView
          services={filteredServices}
          schedule={effectiveSchedule}
          reservations={reservations}
          initialServiceId={initialServiceId}
          mode={mode}
        />
      )}

      {!widgetOnly && view === 'login' && (
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

      {!widgetOnly && view === 'admin' && (
        <AdminView
          services={services}
          schedule={schedule}
          setSchedule={setSchedule}
          schedulePmu={schedulePmu}
          setSchedulePmu={setSchedulePmu}
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
  );

  if (widgetOnly) {
    return (
      <div className="max-w-4xl mx-auto px-3 sm:px-4 py-8">
        <div className={`rounded-xl sm:rounded-2xl shadow-lg overflow-hidden ${isDark ? 'bg-stone-950 border border-stone-800' : ''}`}>
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-4 py-8">
      <div
        className={`rounded-xl sm:rounded-2xl shadow-lg overflow-hidden ${isDark ? 'bg-stone-950 border border-stone-800' : ''}`}
        style={!isDark ? { backgroundColor: 'var(--skin-white)', border: '1px solid var(--skin-beige-muted)' } : undefined}
      >
        <div
          className={`w-full border-b py-6 sm:py-8 cursor-default select-none active:opacity-95 transition-opacity text-center ${isDark ? 'border-stone-800 bg-stone-950' : ''}`}
          style={!isDark ? { borderColor: 'var(--skin-beige-muted)', backgroundColor: 'var(--skin-cream)' } : undefined}
          onClick={handleLogoClick}
          onKeyDown={(e) => e.key === 'Enter' && handleLogoClick()}
          role="button"
          tabIndex={0}
          aria-label="Logo"
        >
          <span className={`font-display font-bold text-2xl sm:text-3xl tracking-wide ${isDark ? 'text-white' : 'text-[var(--skin-charcoal)]'}`}>
            Skin Studio
          </span>
        </div>
        {content}
      </div>
    </div>
  );
}
