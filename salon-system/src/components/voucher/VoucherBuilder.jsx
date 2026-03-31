import React from 'react';
import StickyPreview from './StickyPreview';

/**
 * Dvousloupcový layout od lg: náhled | formulář + patička. Na mobilu jen formulář + patička.
 */
export default function VoucherBuilder({ preview, form, footer }) {
  return (
    <div className="flex flex-col min-h-[calc(100vh-80px)] lg:h-[calc(100vh-80px)] lg:overflow-hidden bg-[#FFFCF9] lg:grid lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:grid-rows-[minmax(0,1fr)_auto]">
      <StickyPreview className="lg:row-span-2 lg:col-start-1">{preview}</StickyPreview>
      <div className="flex flex-col min-h-0 min-w-0 overflow-hidden lg:col-start-2 lg:row-start-1 bg-[#FFFCF9]">{form}</div>
      <div className="lg:col-start-2 lg:row-start-2 shrink-0 min-h-0">{footer}</div>
    </div>
  );
}
