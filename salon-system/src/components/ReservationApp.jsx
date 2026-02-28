import React, { useState, useEffect } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import { Loader2, Lock, ScanFace } from 'lucide-react';
import { startAuthentication } from '@simplewebauthn/browser';
import { platformAuthenticatorIsAvailable } from '@simplewebauthn/browser';
import CustomerView from './CustomerView';
import AdminView from './AdminView';
import useSEO from '../hooks/useSEO';
import { SEO } from '../constants/seo';
import {
  getAdminWebAuthnLoginOptions,
  verifyAdminWebAuthnLogin,
  getAdminWebAuthnRegistrationOptions,
  verifyAdminWebAuthnRegistration,
} from '../firebaseConfig';
import { startRegistration } from '@simplewebauthn/browser';

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
  onWebAuthnLoginSuccess,
  showFaceIdSetupPrompt = false,
  onSkipFaceIdSetup,
  onFaceIdSetupDone,
  services,
  schedule,
  schedulePmu = {},
  reservations,
  addons = [],
  serviceAddonLinks = [],
  widgetOnly = false,
  mode = 'light',
}) {
  const [faceIdAvailable, setFaceIdAvailable] = useState(false);
  const [webauthnLoading, setWebauthnLoading] = useState(false);
  const [faceIdConfigured, setFaceIdConfigured] = useState(null);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [faceIdSetupLoading, setFaceIdSetupLoading] = useState(false);
  const [faceIdSetupError, setFaceIdSetupError] = useState('');

  useEffect(() => {
    let cancelled = false;
    platformAuthenticatorIsAvailable().then((ok) => {
      if (!cancelled) setFaceIdAvailable(!!ok);
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (view !== 'login') return;
    let cancelled = false;
    setFaceIdConfigured(null);
    setShowPasswordForm(false);
    getAdminWebAuthnLoginOptions({ origin: window.location.origin })
      .then(() => { if (!cancelled) setFaceIdConfigured(true); })
      .catch(() => { if (!cancelled) setFaceIdConfigured(false); });
    return () => { cancelled = true; };
  }, [view]);
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const initialServiceId = searchParams.get('service') || null;
  const isRezervacePage = location.pathname === '/rezervace';
  useSEO(isRezervacePage ? SEO.rezervace : { title: '', description: '' });
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
              <h2 className="font-display text-2xl mb-6 text-stone-800 font-bold">Admin Vstup</h2>

              {/* Face ID jako první, pokud je dostupný a už nastaven */}
              {faceIdAvailable && faceIdConfigured === true && onWebAuthnLoginSuccess && (
                <div className="space-y-4 mb-6">
                  <button
                    type="button"
                    disabled={webauthnLoading}
                    onClick={async () => {
                      setLoginError('');
                      setWebauthnLoading(true);
                      try {
                        const origin = window.location.origin;
                        const { data: options } = await getAdminWebAuthnLoginOptions({ origin });
                        if (!options) throw new Error('Nepodařilo načíst možnosti přihlášení.');
                        const assertion = await startAuthentication(options);
                        const { data } = await verifyAdminWebAuthnLogin({ origin, assertion });
                        if (data?.verified) onWebAuthnLoginSuccess();
                        else setLoginError('Přihlášení Face ID selhalo.');
                      } catch (err) {
                        if (err.name === 'NotAllowedError') {
                          setLoginError('Přihlášení bylo zrušeno.');
                        } else {
                          setLoginError(err.message || 'Face ID přihlášení selhalo.');
                        }
                      } finally {
                        setWebauthnLoading(false);
                      }
                    }}
                    className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-stone-800 text-white font-bold uppercase tracking-widest text-[10px] hover:bg-black transition-all disabled:opacity-60"
                  >
                    {webauthnLoading ? (
                      <Loader2 className="animate-spin" size={20} />
                    ) : (
                      <ScanFace size={20} />
                    )}
                    {webauthnLoading ? 'Přihlašuji…' : 'Přihlásit pomocí Face ID'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPasswordForm(true)}
                    className="text-sm text-stone-500 hover:text-stone-700 underline"
                  >
                    Přihlásit heslem
                  </button>
                </div>
              )}

              {/* Formulář hesla: vždy když Face ID není první, nebo uživatel zvolil „Přihlásit heslem“ */}
              {(faceIdConfigured !== true || showPasswordForm || !faceIdAvailable) && (
                <form onSubmit={handleLogin} className="space-y-4">
                  <input
                    autoFocus={showPasswordForm || faceIdConfigured === false}
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
                  {faceIdConfigured === true && faceIdAvailable && (
                    <button
                      type="button"
                      onClick={() => setShowPasswordForm(false)}
                      className="text-sm text-stone-500 hover:text-stone-700 underline"
                    >
                      Zpět na Face ID
                    </button>
                  )}
                </form>
              )}

              <button
                type="button"
                onClick={() => setView('customer')}
                className="mt-4 text-xs text-stone-400 hover:underline block mx-auto"
              >
                Zpět na web
              </button>
            </div>
          )}

          {/* Modal: po přihlášení heslem – nabídka nastavení Face ID */}
          {showFaceIdSetupPrompt && view === 'login' && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => !faceIdSetupLoading && onSkipFaceIdSetup?.()}>
              <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 text-center" onClick={(e) => e.stopPropagation()}>
                <ScanFace className="mx-auto mb-3 text-stone-400" size={40} />
                <h3 className="font-display font-bold text-lg text-stone-800 mb-2">Nastavit Face ID?</h3>
                <p className="text-sm text-stone-500 mb-6">Příště se budete moci přihlásit jedním dotykem bez hesla.</p>
                {faceIdSetupError && <p className="text-red-500 text-xs mb-3">{faceIdSetupError}</p>}
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    disabled={faceIdSetupLoading}
                    onClick={async () => {
                      setFaceIdSetupError('');
                      setFaceIdSetupLoading(true);
                      try {
                        const origin = window.location.origin;
                        const { data: options } = await getAdminWebAuthnRegistrationOptions({ password: adminPassword, origin });
                        if (!options) throw new Error('Nepodařilo načíst možnosti.');
                        const credential = await startRegistration(options);
                        const { data } = await verifyAdminWebAuthnRegistration({ password: adminPassword, origin, credential });
                        if (data?.verified) onFaceIdSetupDone?.();
                        else setFaceIdSetupError('Nastavení se nepovedlo.');
                      } catch (err) {
                        if (err.name === 'NotAllowedError') {
                          setFaceIdSetupError('Registrace byla zrušena.');
                        } else {
                          setFaceIdSetupError(err.message || 'Nastavení Face ID selhalo.');
                        }
                      } finally {
                        setFaceIdSetupLoading(false);
                      }
                    }}
                    className="w-full py-3 rounded-xl bg-stone-800 text-white font-medium disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {faceIdSetupLoading ? <Loader2 className="animate-spin" size={18} /> : <ScanFace size={18} />}
                    {faceIdSetupLoading ? 'Nastavuji…' : 'Ano, nastavit Face ID'}
                  </button>
                  <button
                    type="button"
                    disabled={faceIdSetupLoading}
                    onClick={() => onSkipFaceIdSetup?.()}
                    className="w-full py-2 text-sm text-stone-500 hover:text-stone-700"
                  >
                    Přeskočit
                  </button>
                </div>
              </div>
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
