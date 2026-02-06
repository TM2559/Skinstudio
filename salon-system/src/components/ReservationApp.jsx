import React from 'react';
import { useSearchParams } from 'react-router-dom';
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
  reservations,
}) {
  const [searchParams] = useSearchParams();
  const initialServiceId = searchParams.get('service') || null;
  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-stone-400" size={32} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-4 py-8">
      <div
        className="rounded-xl sm:rounded-2xl shadow-lg overflow-hidden"
        style={{ backgroundColor: 'var(--skin-white)', border: '1px solid var(--skin-beige-muted)' }}
      >
        {/* Banner – logo na celou šířku */}
        <div
          className="w-full border-b cursor-default select-none active:opacity-95 transition-opacity"
          style={{ borderColor: 'var(--skin-beige-muted)', backgroundColor: 'var(--skin-cream)' }}
          onClick={handleLogoClick}
          onKeyDown={(e) => e.key === 'Enter' && handleLogoClick()}
          role="button"
          tabIndex={0}
          aria-label="Logo"
        >
          <img
            src="/skinstudio_titulka.png"
            alt="Skin Studio"
            className="w-full h-auto object-contain object-center max-h-40 sm:max-h-48 block"
          />
        </div>

        <div className="p-4 sm:p-10 bg-white">
          {view === 'customer' && (
            <CustomerView
              services={services}
              schedule={schedule}
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
              reservations={reservations}
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
