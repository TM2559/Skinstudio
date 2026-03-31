import React, { useState, useCallback } from 'react';

/**
 * Reusable Selection Chip for upsell services.
 * Pill-shaped, premium feel with idle/hover/selected states and micro-interaction.
 *
 * @param {Object} service - { name: string, price: number | string } (price shown is the discounted price)
 * @param {boolean} [selected] - Controlled selected state (optional; component is uncontrolled if omitted)
 * @param {function} onToggle - (isActive: boolean) => void — called when selection changes
 * @param {function} [onSelect] - Optional (service, isActive) => void for convenience
 */
const UpsellChip = ({ service, selected: controlledSelected, onToggle, onSelect }) => {
  const [internalSelected, setInternalSelected] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  const isControlled = controlledSelected !== undefined;
  const selected = isControlled ? controlledSelected : internalSelected;

  const handleClick = useCallback(() => {
    const next = !selected;
    if (!isControlled) setInternalSelected(next);
    onToggle?.(next);
    onSelect?.(service, next);
    // Micro-interaction: brief scale feedback
    setIsPressed(true);
    const t = setTimeout(() => setIsPressed(false), 120);
    return () => clearTimeout(t);
  }, [selected, isControlled, service, onToggle, onSelect]);

  const priceDisplay = service.price != null ? (service.isStartingPrice ? `od ${service.price} Kč` : `${service.price} Kč`) : '';

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`
        rounded-full border px-4 py-2 text-xs font-medium uppercase tracking-wide
        transition-all duration-200 ease-out
        select-none
        ${selected
          ? 'border-[#1A1A1A] bg-[#1A1A1A] text-white'
          : 'border-[#E5E5E5] bg-transparent text-[#666] hover:border-[#CCC] hover:bg-[#F5F5F5]'
        }
        ${isPressed ? 'scale-95' : 'scale-100'}
      `}
      style={{ transitionProperty: 'background-color, border-color, color, transform' }}
    >
      {selected ? (
        <>✓ {service.name} added</>
      ) : (
        <>+ Add {service.name} for {priceDisplay}</>
      )}
    </button>
  );
};

export default UpsellChip;
