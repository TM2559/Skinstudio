import React from 'react';
import SectionHeading from './SectionHeading';

const cardBase =
  'relative overflow-hidden transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 cursor-pointer px-6 py-7 border border-[#E4E4E7] bg-[#FFFFFF]';
const cardSelected = 'border-[#C5A880] ring-1 ring-inset ring-[#C5A880] bg-[#FAFAFA]';

export default function PackagingOptions({ packaging, onPackaging }) {
  return (
    <section id="voucher-step-packaging" className="scroll-mt-24" aria-labelledby="step-packaging-heading">
      <SectionHeading id="step-packaging-heading">Dárkové balení</SectionHeading>
      <fieldset className="flex flex-col gap-3 border-0 p-0 m-0">
        <legend className="sr-only">Vyberte balení</legend>
        <label
          className={`${cardBase} ${packaging === 'envelope' ? cardSelected : 'hover:bg-[#FAFAFA]'}`}
        >
          <input
            type="radio"
            name="packaging"
            value="envelope"
            checked={packaging === 'envelope'}
            onChange={() => onPackaging('envelope')}
            className="sr-only"
            aria-checked={packaging === 'envelope'}
          />
          <div className="min-w-0">
            <span className="font-medium text-[17px] text-[#2a2624] tracking-tight block">Dárková obálka</span>
            <p className="text-sm text-[#6b6560] mt-2 leading-relaxed max-w-md">Zdobená sušenými květinami a stuhou.</p>
          </div>
          <span className="font-semibold text-[#2a2624] shrink-0 tabular-nums">V ceně</span>
        </label>
        <label
          className={`${cardBase} ${packaging === 'box' ? cardSelected : 'hover:bg-[#FAFAFA]'}`}
        >
          <input
            type="radio"
            name="packaging"
            value="box"
            checked={packaging === 'box'}
            onChange={() => onPackaging('box')}
            className="sr-only"
            aria-checked={packaging === 'box'}
          />
          <div className="min-w-0">
            <span className="font-medium text-[17px] text-[#2a2624] tracking-tight block">Luxusní dárková krabička</span>
            <p className="text-sm text-[#6b6560] mt-2 leading-relaxed max-w-md">S elegantní výplní, zdobením a stuhou.</p>
          </div>
          <span className="font-semibold text-[#2a2624] shrink-0 tabular-nums">+ 100 Kč</span>
        </label>
      </fieldset>
    </section>
  );
}
