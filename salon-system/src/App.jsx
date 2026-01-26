/* eslint-disable no-undef */
import React, { useState, useEffect } from 'react';
import { Loader2, Scissors, Lock } from 'lucide-react';
import { query, onSnapshot } from "firebase/firestore";
import { signInAnonymously, onAuthStateChanged, signInWithCustomToken } from "firebase/auth";

// --- DŮLEŽITÉ: Tady propojujeme nové soubory ---
import CustomerView from './components/CustomerView';
import AdminView from './components/AdminView'; // <--- Toto načte vaši úpravu!
import { auth, getCollectionPath } from './firebaseConfig';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Data State
  const [reservations, setReservations] = useState([]);
  const [schedule, setSchedule] = useState({});
  const [services, setServices] = useState([]);

  // View State
  const [view, setView] = useState('customer');
  const [adminPassword, setAdminPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [clicks, setClicks] = useState(0);

  // Reset klikání
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

  // Auth & Data
  useEffect(() => {
    const init = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (e) { console.error("Auth error:", e); }
    };
    init();
    const unsub = onAuthStateChanged(auth, u => { setUser(u); setLoading(false); });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user) return;
    const unsub1 = onSnapshot(query(getCollectionPath("reservations")), s => setReservations(s.docs.map(d => ({id: d.id, ...d.data()}))));
    const unsub2 = onSnapshot(getCollectionPath("schedule"), s => { const data = {}; s.forEach(d => data[d.id] = d.data()); setSchedule(data); });
    const unsub3 = onSnapshot(query(getCollectionPath("services")), s => setServices(s.docs.map(d => ({id: d.id, ...d.data()}))));
    return () => { unsub1(); unsub2(); unsub3(); };
  }, [user]);

  const handleLogin = (e) => {
    e.preventDefault();
    if (adminPassword === 'salon123') { setView('admin'); setLoginError(''); }
    else setLoginError('Chybné heslo');
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-stone-50"><Loader2 className="animate-spin text-stone-400"/></div>;

  return (
    <div className="min-h-screen bg-stone-50 font-sans text-stone-800 pb-10 overflow-x-hidden">
      <div className="max-w-4xl mx-auto px-3 sm:px-4 mt-10">
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl border border-stone-100 overflow-hidden">
          
          <div className="bg-white p-10 text-center border-b border-stone-50">
            <div className="mx-auto cursor-default inline-block select-none" onClick={handleLogoClick}>
               <img src="/skinstudio_logo.jpg" alt="Skin Studio" className="h-40 w-auto mx-auto object-contain mix-blend-multiply opacity-95 active:scale-95 transition-transform" />
            </div>
          </div>

          <div className="p-4 sm:p-10 bg-white">
            {view === 'customer' && (
              <CustomerView services={services} schedule={schedule} reservations={reservations} />
            )}

            {view === 'login' && (
              <div className="max-w-sm mx-auto py-20 text-center animate-in zoom-in">
                <Lock className="mx-auto mb-4 text-stone-200" size={48} />
                <h2 className="font-serif text-2xl mb-6 text-stone-800 font-bold">Admin Vstup</h2>
                <form onSubmit={handleLogin} className="space-y-4">
                  <input autoFocus type="password" placeholder="Heslo" value={adminPassword} onChange={e => setAdminPassword(e.target.value)} className="w-full p-4 rounded-xl border border-stone-200 text-center text-lg outline-none focus:ring-1 focus:ring-stone-400" />
                  {loginError && <p className="text-red-500 text-xs font-bold animate-pulse">{loginError}</p>}
                  <button type="submit" className="w-full bg-stone-800 text-white py-4 rounded-xl font-bold uppercase tracking-widest text-[10px] hover:bg-black transition-all">Přihlásit</button>
                  <button type="button" onClick={() => setView('customer')} className="text-xs text-stone-400 hover:underline">Zpět na web</button>
                </form>
              </div>
            )}

            {view === 'admin' && (
              <AdminView 
                services={services} 
                schedule={schedule} 
                reservations={reservations} 
                onLogout={() => { setView('customer'); setAdminPassword(''); }}
              />
            )}
          </div>

        </div>
        <p className="text-center text-stone-300 text-[10px] mt-10 tracking-[0.3em] uppercase">© 2026 Skin Studio</p>
      </div>
    </div>
  );
}