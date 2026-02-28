/* eslint-disable no-undef */
import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { query, onSnapshot } from 'firebase/firestore';
import { signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';
import { auth, getCollectionPath } from '../firebaseConfig';
import { filterCosmeticsServices } from '../utils/helpers';
import { COLLECTIONS } from '../constants/config';

const DataContext = createContext(null);

function mapDocs(snapshot) {
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

function mapDict(snapshot) {
  const data = {};
  snapshot.forEach((d) => (data[d.id] = d.data()));
  return data;
}

export function DataProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reservations, setReservations] = useState([]);
  const [schedule, setSchedule] = useState({});
  const [schedulePmu, setSchedulePmu] = useState({});
  const [services, setServices] = useState([]);
  const [addons, setAddons] = useState([]);
  const [serviceAddonLinks, setServiceAddonLinks] = useState([]);

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
    const onError = (label) => (err) => console.error(`Firestore ${label}:`, err);

    const unsubs = [
      onSnapshot(query(getCollectionPath(COLLECTIONS.RESERVATIONS)), (s) => setReservations(mapDocs(s)), onError('reservations')),
      onSnapshot(getCollectionPath(COLLECTIONS.SCHEDULE), (s) => setSchedule(mapDict(s)), onError('schedule')),
      onSnapshot(getCollectionPath(COLLECTIONS.SCHEDULE_PMU), (s) => setSchedulePmu(mapDict(s)), onError('schedule_pmu')),
      onSnapshot(query(getCollectionPath(COLLECTIONS.SERVICES)), (s) => setServices([...mapDocs(s)].sort((a, b) => (a.order || 0) - (b.order || 0))), onError('services')),
      onSnapshot(query(getCollectionPath(COLLECTIONS.ADDONS)), (s) => setAddons(mapDocs(s)), onError('addons')),
      onSnapshot(query(getCollectionPath(COLLECTIONS.SERVICE_ADDON_LINKS)), (s) => setServiceAddonLinks(mapDocs(s)), onError('service_addon_links')),
    ];
    return () => unsubs.forEach((u) => u());
  }, [user]);

  const servicesStandardOnly = useMemo(
    () => filterCosmeticsServices(services),
    [services]
  );

  const servicesWithAddons = useMemo(() => {
    return services.map((service) => {
      const links = serviceAddonLinks.filter((l) => l.main_service_id === service.id);
      const available_addons = links
        .map((link) => {
          const addon = addons.find((a) => a.id === link.addon_id);
          if (!addon || addon.is_active === false) return null;
          const final_price = link.custom_price != null ? link.custom_price : addon.default_price;
          return {
            id: addon.id,
            name: addon.name,
            price: final_price,
            duration_minutes: addon.duration_minutes,
            is_recommended: !!link.is_recommended,
            price_behavior: addon.price_behavior === 'REPLACE' ? 'REPLACE' : 'ADD',
          };
        })
        .filter(Boolean);
      return { ...service, available_addons };
    });
  }, [services, addons, serviceAddonLinks]);

  const servicesStandardWithAddons = useMemo(
    () => filterCosmeticsServices(servicesWithAddons),
    [servicesWithAddons]
  );

  const value = useMemo(() => ({
    loading,
    reservations,
    schedule,
    schedulePmu,
    services,
    addons,
    serviceAddonLinks,
    servicesStandardOnly,
    servicesWithAddons,
    servicesStandardWithAddons,
  }), [loading, reservations, schedule, schedulePmu, services, addons, serviceAddonLinks, servicesStandardOnly, servicesWithAddons, servicesStandardWithAddons]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within <DataProvider>');
  return ctx;
}
