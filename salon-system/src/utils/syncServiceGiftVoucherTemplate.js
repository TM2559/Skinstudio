import { VOUCHER_TYPES } from '../constants/config';

/** Formulářová data odvozená ze záznamu služby (pro sync / doplnění šablon). */
export function serviceFormFromService(s) {
  return {
    name: s.name,
    price: s.price,
    duration: String(s.duration ?? '60'),
    category: s.category || 'STANDARD',
    isStartingPrice: !!s.isStartingPrice,
    availableForGiftVoucher: true,
  };
}

/**
 * Služby označené pro poukaz, u kterých chybí aktivní šablona ve `voucher_templates`
 * (např. starší data před synchronizací při uložení).
 */
export function servicesNeedingGiftVoucherTemplate(services, voucherTemplates) {
  const list = services || [];
  const templates = voucherTemplates || [];
  return list.filter((s) => {
    if (!s?.availableForGiftVoucher) return false;
    const linked = templates.find((t) => t.service_id === s.id);
    if (!linked) return true;
    if (linked.is_active === false) return true;
    return false;
  });
}

/**
 * Jednorázové doplnění šablon pro všechny takové služby (volá se z adminu při načtení).
 */
export async function backfillGiftVouchersFromServices(services, voucherTemplates, deps) {
  const pending = servicesNeedingGiftVoucherTemplate(services, voucherTemplates);
  let sortSlot = voucherTemplates.length;
  for (const s of pending) {
    await syncServiceGiftVoucherTemplate({
      serviceId: s.id,
      serviceForm: serviceFormFromService(s),
      voucherTemplates: { length: sortSlot },
      ...deps,
    });
    sortSlot += 1;
  }
  return pending.length;
}

/**
 * Po uložení služby v adminu: vytvoří/aktualizuje nebo deaktivuje šablonu poukazu typu „konkrétní služba“
 * podle checkboxu „Dárkový poukaz“, aby web i admin četly stejná data z `voucher_templates`.
 */
export async function syncServiceGiftVoucherTemplate({
  serviceId,
  serviceForm,
  voucherTemplates,
  getCollectionPath,
  COLLECTIONS,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  where,
}) {
  const col = getCollectionPath(COLLECTIONS.VOUCHER_TEMPLATES);
  const snap = await getDocs(query(col, where('service_id', '==', serviceId)));
  const docs = snap.docs;

  const category =
    (serviceForm.category || 'STANDARD').toUpperCase() === 'PMU' ? 'pmu' : 'cosmetics';

  if (serviceForm.availableForGiftVoucher) {
    const payload = {
      type: VOUCHER_TYPES.SERVICE,
      service_id: serviceId,
      category,
      name: serviceForm.name,
      description: '',
      price: parseInt(serviceForm.price, 10) || 0,
      is_active: true,
      is_custom_amount: false,
    };

    if (docs.length === 0) {
      await addDoc(col, {
        ...payload,
        sort_order: voucherTemplates.length,
      });
      return;
    }

    const [first, ...rest] = docs;
    const prev = first.data() || {};
    await updateDoc(first.ref, {
      ...payload,
      sort_order: prev.sort_order ?? voucherTemplates.length,
    });
    await Promise.all(rest.map((d) => deleteDoc(d.ref)));
  } else {
    await Promise.all(
      docs.map((d) => updateDoc(d.ref, { is_active: false }))
    );
  }
}
