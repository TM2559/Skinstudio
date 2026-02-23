import { useState, useEffect, useMemo } from 'react';
import { query, onSnapshot } from 'firebase/firestore';
import { signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';
import { auth, getCollectionPath } from '../firebaseConfig';
import { filterCosmeticsServices } from '../utils/helpers';

/* eslint-disable no-undef */

export default function useFirebaseData() {
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
    const unsub1 = onSnapshot(query(getCollectionPath('reservations')), (s) =>
      setReservations(s.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    const unsub2 = onSnapshot(getCollectionPath('schedule'), (s) => {
      const data = {};
      s.forEach((d) => (data[d.id] = d.data()));
      setSchedule(data);
    });
    const unsub2b = onSnapshot(getCollectionPath('schedule_pmu'), (s) => {
      const data = {};
      s.forEach((d) => (data[d.id] = d.data()));
      setSchedulePmu(data);
    });
    const unsub3 = onSnapshot(query(getCollectionPath('services')), (s) => {
      const loadedServices = s.docs.map((d) => ({ id: d.id, ...d.data() }));
      setServices([...loadedServices].sort((a, b) => (a.order || 0) - (b.order || 0)));
    });
    const unsub4 = onSnapshot(query(getCollectionPath('addons')), (s) =>
      setAddons(s.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    const unsub5 = onSnapshot(query(getCollectionPath('service_addon_links')), (s) =>
      setServiceAddonLinks(s.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    return () => {
      unsub1();
      unsub2();
      unsub2b();
      unsub3();
      unsub4();
      unsub5();
    };
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

  return {
    user,
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
  };
}
