import { useMemo } from 'react';
import { useData } from '../contexts/DataContext';

/** ID služeb, na které jde objednat dárkový poukaz (aktivní šablona poukazu navázaná na službu). */
export default function useGiftVoucherServiceIds() {
  const { voucherTemplates } = useData();
  return useMemo(
    () =>
      new Set(
        (voucherTemplates || [])
          .filter((t) => t.is_active !== false && t.service_id)
          .map((t) => t.service_id)
      ),
    [voucherTemplates]
  );
}
