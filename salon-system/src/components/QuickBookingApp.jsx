import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { addDoc } from 'firebase/firestore';
import { startAuthentication } from '@simplewebauthn/browser';
import { Loader2, ScanFace, Check, CalendarPlus, AlertTriangle } from 'lucide-react';
import {
  auth,
  getCollectionPath,
  callVerifyAdminPassword,
  getAdminWebAuthnConfigured,
  getAdminWebAuthnLoginOptions,
  verifyAdminWebAuthnLogin,
} from '../firebaseConfig';
import { ensureAnonymousAuthForCallable, packWebAuthnCredentialForCallable } from '../utils/webAuthnCallable';
import { COLLECTIONS } from '../constants/config';
import { useData } from '../contexts/DataContext';
import { Utils } from '../utils/helpers';
import { sendBookingConfirmations } from '../services/notificationService';

/**
 * Jednoduchá „appka pro admina" (manželku) – jedna obrazovka pro rychlé zadání rezervace.
 * Určeno na iPhone jako PWA: Safari → Sdílet → Přidat na plochu (ikona jako appka).
 * Služba se vybírá z reálného ceníku, takže trvání i cena sedí vždy.
 * Zapisuje do stejné kolekce `reservations` jako web/admin (source: 'app').
 */
export default function QuickBookingApp() {
  const { services, reservations } = useData();

  // --- Auth ---
  const [authState, setAuthState] = useState('checking'); // checking | need-login | authed
  const [faceIdConfigured, setFaceIdConfigured] = useState(null);
  const [busy, setBusy] = useState(false);
  const [authError, setAuthError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState('');
  const optionsRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        await ensureAnonymousAuthForCallable();
        const res = await auth.currentUser?.getIdTokenResult();
        if (res?.claims?.admin) {
          setAuthState('authed');
          return;
        }
      } catch { /* ignore */ }
      setAuthState('need-login');
    })();
  }, []);

  // Přednačtení Face ID options (kvůli Safari musí být první await po kliknutí = startAuthentication).
  useEffect(() => {
    if (authState !== 'need-login') return;
    let cancelled = false;
    (async () => {
      try {
        const origin = window.location.origin;
        const { data } = await getAdminWebAuthnConfigured({ origin });
        if (cancelled) return;
        if (data?.configured) {
          setFaceIdConfigured(true);
          const { data: opts } = await getAdminWebAuthnLoginOptions({ origin });
          if (!cancelled) optionsRef.current = opts || null;
        } else {
          setFaceIdConfigured(false);
          setShowPassword(true);
        }
      } catch {
        if (!cancelled) {
          setFaceIdConfigured(false);
          setShowPassword(true);
        }
      }
    })();
    return () => { cancelled = true; };
  }, [authState]);

  const loginFaceId = useCallback(async () => {
    setAuthError('');
    setBusy(true);
    try {
      const origin = window.location.origin;
      let options = optionsRef.current;
      if (!options) {
        const { data } = await getAdminWebAuthnLoginOptions({ origin });
        options = data;
      }
      const assertion = await startAuthentication({ optionsJSON: options });
      await ensureAnonymousAuthForCallable();
      const { data } = await verifyAdminWebAuthnLogin({
        origin,
        assertion: packWebAuthnCredentialForCallable(assertion),
      });
      if (data?.verified) {
        await auth.currentUser?.getIdToken(true);
        setAuthState('authed');
      } else {
        setAuthError('Přihlášení Face ID selhalo.');
      }
    } catch (err) {
      if (err?.name === 'NotAllowedError') setAuthError('Přihlášení bylo zrušeno.');
      else {
        optionsRef.current = null;
        setAuthError(err?.message || 'Face ID přihlášení selhalo.');
      }
    } finally {
      setBusy(false);
    }
  }, []);

  const loginPassword = useCallback(async (e) => {
    e.preventDefault();
    if (!password) return;
    setAuthError('');
    setBusy(true);
    try {
      const { data } = await callVerifyAdminPassword({ password });
      if (data?.verified) {
        await auth.currentUser?.getIdToken(true);
        setPassword('');
        setAuthState('authed');
      } else {
        setAuthError('Chybné heslo.');
      }
    } catch {
      setAuthError('Přihlášení selhalo.');
    } finally {
      setBusy(false);
    }
  }, [password]);

  // --- Formulář ---
  const bookableServices = useMemo(
    () => services.filter((s) => s.name && s.duration),
    [services]
  );
  const [serviceId, setServiceId] = useState('');
  const [date, setDate] = useState(Utils.getLocalISODate());
  const [time, setTime] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [notify, setNotify] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [done, setDone] = useState(null);

  const selectedService = bookableServices.find((s) => s.id === serviceId) || null;
  const dateKey = Utils.getDateKeyFromISO(date);

  const overlap = useMemo(() => {
    if (!selectedService || !time) return null;
    const start = Utils.timeToMinutes(time);
    if (start == null) return null;
    const end = start + (parseInt(selectedService.duration, 10) || 60);
    const clash = reservations
      .filter((r) => r.date === dateKey)
      .find((r) => {
        const rs = Utils.timeToMinutes(r.time);
        if (rs == null) return false;
        const re = rs + (Number(r.duration) || 60);
        return start < re && rs < end;
      });
    return clash ? `${clash.time} · ${clash.serviceName || ''} (${clash.name || ''})` : null;
  }, [selectedService, time, dateKey, reservations]);

  const canSubmit = serviceId && time && name.trim() && !saving;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit || !selectedService) return;
    setFormError('');
    setSaving(true);
    const duration = parseInt(selectedService.duration, 10) || 60;
    const trimmedName = name.trim();
    const trimmedPhone = phone.trim() || null;
    const trimmedEmail = email.trim() || null;
    try {
      await addDoc(getCollectionPath(COLLECTIONS.RESERVATIONS), {
        date: dateKey,
        time,
        name: trimmedName,
        phone: trimmedPhone,
        email: trimmedEmail,
        serviceName: selectedService.name,
        duration,
        price: selectedService.price || 0,
        created: new Date().toISOString(),
        reminderSent: false,
        source: 'app',
      });
      if (notify && (trimmedPhone || trimmedEmail)) {
        try {
          await sendBookingConfirmations({
            name: trimmedName,
            phone: trimmedPhone,
            email: trimmedEmail,
            date: dateKey,
            time,
            serviceName: selectedService.name,
            duration,
          });
        } catch { /* notifikace nesmí shodit uložení */ }
      }
      setDone({ name: trimmedName, time, serviceName: selectedService.name, dateKey, duration });
      setName('');
      setPhone('');
      setEmail('');
      setTime('');
    } catch (err) {
      setFormError('Uložení selhalo: ' + (err?.message || 'zkuste to znovu'));
    } finally {
      setSaving(false);
    }
  };

  // --- Render ---
  const shell = (children) => (
    <div className="min-h-screen bg-[var(--skin-cream,#faf7f2)] text-[var(--skin-charcoal,#2b2b2b)] flex flex-col"
      style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <header className="px-5 pt-6 pb-4 text-center border-b" style={{ borderColor: 'var(--skin-beige-muted,#e7ded2)' }}>
        <div className="font-display font-bold text-xl tracking-wide">Skin Studio</div>
        <div className="text-[11px] uppercase tracking-[0.2em] text-stone-500 mt-1">Rychlá rezervace</div>
      </header>
      <main className="flex-1 w-full max-w-md mx-auto px-5 py-6">{children}</main>
    </div>
  );

  if (authState === 'checking') {
    return shell(
      <div className="flex items-center justify-center py-24 text-stone-400">
        <Loader2 className="animate-spin" size={28} />
      </div>
    );
  }

  if (authState === 'need-login') {
    return shell(
      <div className="max-w-sm mx-auto py-10 text-center">
        <h2 className="font-display text-2xl font-bold mb-6">Přihlášení</h2>
        {authError && <p className="text-sm text-red-600 mb-4">{authError}</p>}

        {faceIdConfigured === true && !showPassword && (
          <div className="space-y-4">
            <button
              type="button"
              onClick={loginFaceId}
              disabled={busy}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-stone-800 text-white font-bold uppercase tracking-widest text-[11px] hover:bg-black transition-all disabled:opacity-60"
            >
              {busy ? <Loader2 className="animate-spin" size={20} /> : <ScanFace size={20} />}
              {busy ? 'Přihlašuji…' : 'Přihlásit pomocí Face ID'}
            </button>
            <button type="button" onClick={() => setShowPassword(true)} className="text-sm text-stone-500 underline">
              Přihlásit heslem
            </button>
          </div>
        )}

        {(showPassword || faceIdConfigured === false) && (
          <form onSubmit={loginPassword} className="space-y-4">
            <input
              autoFocus
              type="password"
              placeholder="Heslo"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-4 rounded-2xl border border-stone-200 text-center text-lg outline-none focus:ring-1 focus:ring-stone-400"
            />
            <button
              type="submit"
              disabled={busy || !password}
              className="w-full py-4 rounded-2xl bg-stone-800 text-white font-bold uppercase tracking-widest text-[11px] hover:bg-black transition-all disabled:opacity-60"
            >
              {busy ? 'Přihlašuji…' : 'Přihlásit'}
            </button>
            {faceIdConfigured === true && (
              <button type="button" onClick={() => { setShowPassword(false); setAuthError(''); }} className="text-sm text-stone-500 underline">
                Zpět na Face ID
              </button>
            )}
          </form>
        )}

        {faceIdConfigured === null && (
          <div className="flex items-center justify-center py-6 text-stone-400"><Loader2 className="animate-spin" size={20} /></div>
        )}
      </div>
    );
  }

  // authed
  const inputCls = 'w-full p-3.5 rounded-2xl border border-stone-200 bg-white text-base outline-none focus:ring-1 focus:ring-stone-400';
  const labelCls = 'block text-[11px] font-semibold uppercase tracking-wider text-stone-500 mb-1.5';

  return shell(
    <>
      {done && (
        <div className="mb-5 rounded-2xl bg-emerald-50 border border-emerald-200 p-4 flex items-start gap-3">
          <Check className="text-emerald-600 shrink-0 mt-0.5" size={20} />
          <div className="text-sm text-emerald-900">
            <div className="font-semibold">Rezervace uložena</div>
            <div className="text-emerald-800">
              {done.name} · {Utils.formatDateDisplay(done.dateKey)} v {done.time} · {done.serviceName}
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={labelCls}>Služba z ceníku</label>
          <select value={serviceId} onChange={(e) => setServiceId(e.target.value)} className={inputCls} required>
            <option value="">— vyber službu —</option>
            {bookableServices.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} · {s.duration} min{s.price ? ` · ${s.price} Kč` : ''}
              </option>
            ))}
          </select>
          {selectedService && (
            <p className="text-xs text-stone-500 mt-1.5">
              Trvání {selectedService.duration} min{selectedService.price ? ` · ${selectedService.price} Kč` : ''}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Datum</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} required />
          </div>
          <div>
            <label className={labelCls}>Čas</label>
            <input type="time" value={time} onChange={(e) => setTime(e.target.value)} step="900" className={inputCls} required />
          </div>
        </div>

        {overlap && (
          <div className="rounded-2xl bg-amber-50 border border-amber-200 p-3 flex items-start gap-2 text-sm text-amber-900">
            <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={18} />
            <span>Překrývá se s: {overlap}. Uložit můžeš i tak.</span>
          </div>
        )}

        <div>
          <label className={labelCls}>Jméno klienta</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Jméno a příjmení" className={inputCls} required />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Telefon <span className="text-stone-400 normal-case">(nepovinné)</span></label>
            <input type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="—" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>E-mail <span className="text-stone-400 normal-case">(nepovinné)</span></label>
            <input type="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="—" className={inputCls} />
          </div>
        </div>

        <label className="flex items-center gap-3 py-1 text-sm text-stone-700">
          <input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} className="w-5 h-5 rounded accent-stone-800" />
          Poslat klientovi potvrzení (SMS / e-mail)
        </label>
        {notify && !phone.trim() && !email.trim() && (
          <p className="text-xs text-amber-700 -mt-2">Pro potvrzení vyplň telefon nebo e-mail.</p>
        )}

        {formError && <p className="text-sm text-red-600">{formError}</p>}

        <button
          type="submit"
          disabled={!canSubmit}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-stone-800 text-white font-bold uppercase tracking-widest text-[12px] hover:bg-black transition-all disabled:opacity-40"
        >
          {saving ? <Loader2 className="animate-spin" size={20} /> : <CalendarPlus size={20} />}
          {saving ? 'Ukládám…' : 'Uložit rezervaci'}
        </button>
      </form>
    </>
  );
}
