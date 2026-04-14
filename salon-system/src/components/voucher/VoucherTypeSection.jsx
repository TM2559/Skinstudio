import React from 'react';
import { Tag, PenLine, Sparkles, Check } from 'lucide-react';
import { formatPrice, templateAmountMinKc } from './voucherCheckoutUtils';

const CARD_MODES = [
  {
    mode: 'value',
    Icon: Tag,
    title: 'Hodnotový poukaz',
    desc: 'Předdefinovaná hodnota',
  },
  {
    mode: 'custom',
    Icon: PenLine,
    title: 'Vlastní hodnota',
    desc: 'Libovolná částka',
  },
  {
    mode: 'service',
    Icon: Sparkles,
    title: 'Konkrétní ošetření',
    desc: 'Kosmetika nebo PMU',
  },
];

// Interní: cenové čipy pro fixní nominály
function PriceChips({ vouchers, selectedVoucher, onSelect }) {
  if (!vouchers.length) return <p className="text-[13px] text-[#737373] py-4">Žádné nominály nejsou nastaveny.</p>;
  return (
    <div className="flex flex-wrap gap-3 py-4">
      {vouchers.map((v) => {
        const sel = selectedVoucher?.id === v.id;
        return (
          <button
            key={v.id}
            type="button"
            onClick={() => onSelect(v)}
            aria-pressed={sel}
            className={`px-6 py-3 border text-[15px] font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C5A880] ${
              sel
                ? 'border-[#C5A880] bg-[#FAF7F3] text-[#2a2624]'
                : 'border-[#E4E4E7] bg-white text-[#2a2624] hover:border-[#C5A880] hover:bg-[#FAF7F3]'
            }`}
          >
            {formatPrice(v.price)}
          </button>
        );
      })}
    </div>
  );
}

// Interní: input pro vlastní částku
function CustomAmountInput({ voucher, customAmountDraft, onDraftChange, inputRef, showError }) {
  const minKc = templateAmountMinKc(voucher);
  return (
    <div className="py-4">
      <p className="text-[13px] text-[#737373] mb-4">Minimální částka: {formatPrice(minKc)}</p>
      <div className="flex items-baseline gap-3">
        <input
          ref={inputRef}
          type="number"
          min={minKc}
          step={100}
          value={customAmountDraft}
          onChange={(e) => onDraftChange(e.target.value)}
          placeholder="1000"
          aria-label="Vlastní částka v korunách"
          className={`w-36 bg-transparent border-0 border-b-2 rounded-none py-2 px-0 text-2xl font-medium focus:outline-none tabular-nums transition-colors ${
            showError
              ? 'border-[#EF4444] text-[#EF4444]'
              : 'border-[#E4E4E7] text-[#2a2624] focus:border-[#C5A880]'
          }`}
        />
        <span className="text-xl text-[#6b6560]">Kč</span>
      </div>
      {showError && (
        <p className="mt-2 text-[11px] font-medium text-[#EF4444]">Zadejte částku alespoň {formatPrice(minKc)}.</p>
      )}
    </div>
  );
}

// Interní: seznam konkrétních služeb
function ServiceList({ cosmeticsVouchers, pmuVouchers, selectedVoucher, onSelect }) {
  const sections = [
    { label: 'Kosmetika', vouchers: cosmeticsVouchers },
    { label: 'Permanentní makeup', vouchers: pmuVouchers },
  ].filter((s) => s.vouchers.length > 0);

  if (!sections.length) return <p className="text-[13px] text-[#737373] py-4">Žádná ošetření nejsou nastavena.</p>;

  return (
    <div className="py-4 flex flex-col gap-5">
      {sections.map((section) => (
        <div key={section.label}>
          <p className="text-[11px] uppercase tracking-[0.18em] text-[#9c9590] mb-2">{section.label}</p>
          <div className="flex flex-col gap-px bg-[#E4E4E7] border border-[#E4E4E7]">
            {section.vouchers.map((v) => {
              const sel = selectedVoucher?.id === v.id;
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => onSelect(v)}
                  aria-pressed={sel}
                  className={`w-full text-left px-5 py-4 flex items-center justify-between gap-4 transition-colors focus:outline-none focus-visible:ring-inset focus-visible:ring-2 focus-visible:ring-[#C5A880] ${
                    sel ? 'bg-[#FAF7F3]' : 'bg-white hover:bg-[#FAFAFA]'
                  }`}
                >
                  <div className="min-w-0">
                    <span className="block text-[15px] font-medium text-[#2a2624]">{v.name}</span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-[15px] font-semibold text-[#2a2624] tabular-nums">{formatPrice(v.price)}</span>
                    {sel && <Check size={16} className="text-[#C5A880]" strokeWidth={2.5} />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function VoucherTypeSection({
  // Dostupné vouchery
  fixedValueVouchers,      // value category, is_custom_amount: false
  customVoucher,           // value category, is_custom_amount: true (null pokud neexistuje)
  cosmeticsVouchers,
  pmuVouchers,
  // Stav
  activeMode,              // null | 'value' | 'custom' | 'service'
  onSelectMode,
  selectedVoucher,
  onSelectVoucher,
  customAmountDraft,
  onCustomAmountDraft,
  customAmountInputRef,
  showAmountError,
  showTypeError,
}) {
  // Které karty ukázat (jen ty kde existují vouchery)
  const cards = CARD_MODES.filter((c) => {
    if (c.mode === 'value') return fixedValueVouchers.length > 0;
    if (c.mode === 'custom') return !!customVoucher;
    if (c.mode === 'service') return cosmeticsVouchers.length > 0 || pmuVouchers.length > 0;
    return false;
  });

  // Popis vybrané položky v kartě (pro header)
  function getSelectionLabel(mode) {
    if (activeMode !== mode || !selectedVoucher) return null;
    if (mode === 'custom') {
      const n = parseInt(String(customAmountDraft).replace(/\s/g, ''), 10);
      return Number.isFinite(n) && n > 0 ? formatPrice(n) : null;
    }
    return selectedVoucher.name || formatPrice(selectedVoucher.price);
  }

  function handleCardClick(mode) {
    if (activeMode === mode) return; // klik na aktivní kartu nic nedělá
    onSelectMode(mode);
    // Při přepnutí karty resetovat výběr voucheru (pokud je z jiné karty)
    if (selectedVoucher) {
      const currentCardMode =
        selectedVoucher.is_custom_amount ? 'custom'
        : ['cosmetics', 'pmu'].includes(selectedVoucher._displayCategory) ? 'service'
        : 'value';
      if (currentCardMode !== mode) onSelectVoucher(null);
    }
    // Auto-select pro kartu custom (je tam jen jeden voucher)
    if (mode === 'custom' && customVoucher) {
      onSelectVoucher(customVoucher);
      setTimeout(() => customAmountInputRef?.current?.focus(), 50);
    }
  }

  return (
    <div id="voucher-step-type" className="scroll-mt-24">
      {/* Tři karty v řadě */}
      <div
        className={`grid gap-3 ${cards.length === 3 ? 'grid-cols-3' : cards.length === 2 ? 'grid-cols-2' : 'grid-cols-1'}`}
        role="radiogroup"
        aria-label="Typ dárkového poukazu"
      >
        {cards.map(({ mode, Icon, title, desc }) => {
          const isActive = activeMode === mode;
          const selLabel = getSelectionLabel(mode);
          return (
            <button
              key={mode}
              type="button"
              role="radio"
              aria-checked={isActive}
              onClick={() => handleCardClick(mode)}
              className={`text-left p-4 sm:p-5 border transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C5A880] ${
                isActive
                  ? 'border-[#C5A880] bg-[#FAF7F3] ring-1 ring-inset ring-[#C5A880]'
                  : showTypeError
                  ? 'border-[#EF4444] bg-white hover:bg-[#FAFAFA]'
                  : 'border-[#E4E4E7] bg-white hover:bg-[#FAFAFA] hover:border-[#C5A880]'
              }`}
            >
              <Icon
                size={18}
                className={`mb-2 sm:mb-3 ${isActive ? 'text-[#C5A880]' : 'text-[#9c9590]'}`}
                aria-hidden
              />
              <span className="block text-[13px] sm:text-[14px] font-medium text-[#2a2624] leading-tight">
                {title}
              </span>
              <span className="hidden sm:block text-[12px] text-[#6b6560] mt-0.5">{desc}</span>
              {selLabel && (
                <span className="block text-[12px] font-semibold text-[#C5A880] mt-1 truncate">
                  ✓ {selLabel}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {showTypeError && (
        <p className="text-[11px] font-medium text-[#EF4444] mt-1.5" role="alert">
          Vyberte typ dárkového poukazu.
        </p>
      )}

      {/* Expandovaný panel */}
      {activeMode && (
        <div className="mt-3 border border-[#E4E4E7] bg-white px-5 sm:px-7">
          {activeMode === 'value' && (
            <PriceChips
              vouchers={fixedValueVouchers}
              selectedVoucher={selectedVoucher}
              onSelect={onSelectVoucher}
            />
          )}
          {activeMode === 'custom' && customVoucher && (
            <CustomAmountInput
              voucher={customVoucher}
              customAmountDraft={customAmountDraft}
              onDraftChange={onCustomAmountDraft}
              inputRef={customAmountInputRef}
              showError={showAmountError}
            />
          )}
          {activeMode === 'service' && (
            <ServiceList
              cosmeticsVouchers={cosmeticsVouchers}
              pmuVouchers={pmuVouchers}
              selectedVoucher={selectedVoucher}
              onSelect={onSelectVoucher}
            />
          )}
        </div>
      )}
    </div>
  );
}
