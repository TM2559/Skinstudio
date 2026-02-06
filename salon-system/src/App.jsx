/* eslint-disable no-undef */
import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { query, onSnapshot } from 'firebase/firestore';
import { signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';

import Layout from './components/Layout';
import LandingPage from './components/LandingPage';
import ReservationApp from './components/ReservationApp';
import { auth, getCollectionPath } from './firebaseConfig';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reservations, setReservations] = useState([]);
  const [schedule, setSchedule] = useState({});
  const [services, setServices] = useState([]);
  const [view, setView] = useState('customer');
  const [adminPassword, setAdminPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [clicks, setClicks] = useState(0);

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

  useEffect(() => {
    const init = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (e) {
        console.error('Auth error:', e);
      }
    };
    init();
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user) return;
    const unsub1 = onSnapshot(query(getCollectionPath('reservations')), (s) =>
      setReservations(s.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    const unsub2 = onSnapshot(getCollectionPath('schedule'), (s) => {
      const data = {};
      s.forEach((d) => (data[d.id] = d.data()));
      setSchedule(data);
    });
    const unsub3 = onSnapshot(query(getCollectionPath('services')), (s) => {
      const loadedServices = s.docs.map((d) => ({ id: d.id, ...d.data() }));
      setServices([...loadedServices].sort((a, b) => (a.order || 0) - (b.order || 0)));
    });
    return () => {
      unsub1();
      unsub2();
      unsub3();
    };
  }, [user]);

  const handleLogin = (e) => {
    e.preventDefault();
    if (adminPassword === 'salon123') {
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
    <Routes>
      <Route
        path="/"
        element={
          <Layout>
            <LandingPage services={services} />
          </Layout>
        }
      />
      <Route
        path="/rezervace"
        element={
          <Layout>
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
              services={services}
              schedule={schedule}
              reservations={reservations}
            />
          </Layout>
        }
      />
    </Routes>
  );
}
