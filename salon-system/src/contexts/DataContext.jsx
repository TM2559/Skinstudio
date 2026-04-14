/* eslint-disable no-undef */
import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { query, onSnapshot } from 'firebase/firestore';
import { signInAnonymously, onAuthStateChanged, onIdTokenChanged, signInWithCustomToken } from 'firebase/auth';
import * as FirebaseConfig from '../firebaseConfig';
import { filterCosmeticsServices } from '../utils/helpers';
import { COLLECTIONS } from '../constants/config';

const DataContext = createContext(null);
const { auth, getCollectionPath } = FirebaseConfig;
const isVitest = typeof import.meta.env.VITEST !== 'undefined' && import.meta.env.VITEST;
const isFirebaseRuntimeConfigured = (() => {
  const isCanvas = typeof __firebase_config !== 'undefined';
  if (isCanvas) return true;
  try {
    return !!import.meta.env.VITE_FIREBASE_API_KEY;
  } catch {
    return true;
  }
})();

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
  /** Objednávky poukazů ve Firestore vyžadují isAdmin – bez claimu by posluchač házel permission-denied a rozbíjel SDK. */
  const [tokenHasAdmin, setTokenHasAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reservations, setReservations] = useState([]);
  const [schedule, setSchedule] = useState({});
  const [schedulePmu, setSchedulePmu] = useState({});
  const [services, setServices] = useState([]);
  const [addons, setAddons] = useState([]);
  const [serviceAddonLinks, setServiceAddonLinks] = useState([]);
  const [voucherTemplates, setVoucherTemplates] = useState([]);
  const [voucherOrders, setVoucherOrders] = useState([]);

  useEffect(() => {
    if (!isFirebaseRuntimeConfigured && !isVitest) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    const unsub = onAuthStateChanged(auth, (u) => {
      if (cancelled) return;
      setUser(u);
      setLoading(false);
    });
    (async () => {
      try {
        await auth.authStateReady?.();
        if (cancelled) return;
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (e) {
        console.error('Auth error:', e);
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
      unsub();
    };
  }, []);

  useEffect(() => {
    if (!isFirebaseRuntimeConfigured) return;
    const unsub = onIdTokenChanged(auth, async (u) => {
      if (!u) {
        setTokenHasAdmin(false);
        return;
      }
      try {
        const r = await u.getIdTokenResult();
        setTokenHasAdmin(!!r.claims.admin);
      } catch {
        setTokenHasAdmin(false);
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!isFirebaseRuntimeConfigured) return;
    if (!user) {
      setVoucherOrders([]);
      return;
    }
    const onError = (label) => (err) => console.error(`Firestore ${label}:`, err);

    const unsubs = [
      onSnapshot(query(getCollectionPath(COLLECTIONS.RESERVATIONS)), (s) => setReservations(mapDocs(s)), onError('reservations')),
      onSnapshot(getCollectionPath(COLLECTIONS.SCHEDULE), (s) => setSchedule(mapDict(s)), onError('schedule')),
      onSnapshot(getCollectionPath(COLLECTIONS.SCHEDULE_PMU), (s) => setSchedulePmu(mapDict(s)), onError('schedule_pmu')),
      onSnapshot(query(getCollectionPath(COLLECTIONS.SERVICES)), (s) => setServices([...mapDocs(s)].sort((a, b) => (a.order || 0) - (b.order || 0))), onError('services')),
      onSnapshot(query(getCollectionPath(COLLECTIONS.ADDONS)), (s) => setAddons(mapDocs(s)), onError('addons')),
      onSnapshot(query(getCollectionPath(COLLECTIONS.SERVICE_ADDON_LINKS)), (s) => setServiceAddonLinks(mapDocs(s)), onError('service_addon_links')),
      onSnapshot(query(getCollectionPath(COLLECTIONS.VOUCHER_TEMPLATES)), (s) => setVoucherTemplates([...mapDocs(s)].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))), onError('voucher_templates')),
    ];
    if (tokenHasAdmin) {
      unsubs.push(
        onSnapshot(
          query(getCollectionPath(COLLECTIONS.VOUCHER_ORDERS)),
          (s) => setVoucherOrders([...mapDocs(s)].sort((a, b) => (b.created_at?.toMillis?.() ?? 0) - (a.created_at?.toMillis?.() ?? 0))),
          onError('voucher_orders'),
        ),
      );
    } else {
      setVoucherOrders([]);
    }
    return () => unsubs.forEach((u) => u());
  }, [user, tokenHasAdmin]);

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
    voucherTemplates,
    voucherOrders,
    servicesStandardOnly,
    servicesWithAddons,
    servicesStandardWithAddons,
  }), [loading, reservations, schedule, schedulePmu, services, addons, serviceAddonLinks, voucherTemplates, voucherOrders, servicesStandardOnly, servicesWithAddons, servicesStandardWithAddons]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within <DataProvider>');
  return ctx;
}
