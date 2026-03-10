import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

const SECTION_ID = {
  KDO_JSME: 'kdo-jsme',
  JAKÉ_ÚDAJE: 'jake-udaje',
  KOMU: 'komu',
  JAK_DLOUHO: 'jak-dlouho',
  PRÁVA: 'prava',
};

function AccordionSection({ id, title, open, onToggle, children, isDark }) {
  const borderClass = isDark ? 'border-stone-700' : 'border-stone-200';
  const titleClass = isDark
    ? 'text-stone-100 hover:text-white'
    : 'text-stone-800 hover:text-stone-900';
  const chevronClass = isDark ? 'text-stone-500' : 'text-stone-400';
  const bodyClass = isDark ? 'text-stone-300' : 'text-[#334155]';
  const linkClass = isDark ? 'text-[#daa59c] hover:underline' : 'text-[var(--skin-gold-dark)] hover:underline';

  return (
    <section className={`border-b last:border-b-0 ${borderClass}`} aria-labelledby={`heading-${id}`}>
      <h2 id={`heading-${id}`}>
        <button
          type="button"
          onClick={onToggle}
          className={`w-full flex items-center justify-between gap-4 py-5 text-left font-sans font-semibold transition-colors ${titleClass}`}
          aria-expanded={open}
          aria-controls={`panel-${id}`}
          id={`accordion-${id}`}
        >
          <span>{title}</span>
          <span className={`shrink-0 ${chevronClass}`} aria-hidden>
            {open ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </span>
        </button>
      </h2>
      <div
        id={`panel-${id}`}
        role="region"
        aria-labelledby={`heading-${id}`}
        hidden={!open}
        className="overflow-hidden"
      >
        <div className={`pb-5 font-sans leading-relaxed ${bodyClass}`} style={{ lineHeight: '1.7' }}>
          {children}
        </div>
      </div>
    </section>
  );
}

/** Shared privacy policy accordion content. Used by PrivacyPage and PrivacySlideOver. */
export default function PrivacyContent({ footer, privacy, isDark = false }) {
  const [openId, setOpenId] = useState(SECTION_ID.KDO_JSME);
  const toggle = (id) => setOpenId((prev) => (prev === id ? null : id));
  const linkClass = isDark ? 'text-[#daa59c] hover:underline' : 'text-[var(--skin-gold-dark)] hover:underline';
  const h3Class = isDark ? 'text-stone-200' : 'text-stone-800';
  const smallClass = isDark ? 'text-stone-400' : 'text-stone-600';

  return (
    <>
      <AccordionSection
        id={SECTION_ID.KDO_JSME}
        title={privacy.section1Title}
        open={openId === SECTION_ID.KDO_JSME}
        onToggle={() => toggle(SECTION_ID.KDO_JSME)}
        isDark={isDark}
      >
        <p className="mb-4">
          Vaše osobní údaje spravuje fyzická osoba {footer.ownerName}, IČ: {footer.ico}, se
          sídlem {footer.location} (dále jen „My“ nebo „Skinstudio“).
        </p>
        <p>
          Můžete nás kdykoliv kontaktovat na e-mailu:{' '}
          <a href={`mailto:${footer.email}`} className={linkClass}>{footer.email}</a>{' '}
          nebo telefonu:{' '}
          <a href={`tel:${footer.phone.replace(/\s/g, '')}`} className={linkClass}>{footer.phone}</a>.
        </p>
      </AccordionSection>

      <AccordionSection
        id={SECTION_ID.JAKÉ_ÚDAJE}
        title={privacy.section2Title}
        open={openId === SECTION_ID.JAKÉ_ÚDAJE}
        onToggle={() => toggle(SECTION_ID.JAKÉ_ÚDAJE)}
        isDark={isDark}
      >
        <p className="mb-4">Abychom vám mohli poskytnout ty nejlepší služby, zpracováváme následující údaje:</p>
        <div className="space-y-6">
          <div>
            <h3 className={`font-semibold mb-1 ${h3Class}`}>Identifikační a kontaktní údaje</h3>
            <p className="mb-1">Jméno, příjmení, telefon, e-mail.</p>
            <p className="mb-1"><strong>Proč:</strong> K vytvoření a správě rezervace, komunikaci o termínech a fakturaci.</p>
            <p className={`text-sm ${smallClass}`}><strong>Právní základ:</strong> Plnění smlouvy (vaší objednávky).</p>
          </div>
          <div>
            <h3 className={`font-semibold mb-1 ${h3Class}`}>Informace o pleti a zdraví (Citlivé údaje)</h3>
            <p className="mb-1">Typ pleti, alergie, kožní onemocnění nebo kontraindikace procedur.</p>
            <p className="mb-1"><strong>Proč:</strong> Abychom zajistili vaši bezpečnost a vybrali vhodné produkty. Tyto údaje zaznamenáváme pouze s vaším výslovným souhlasem (např. při vyplnění vstupního dotazníku).</p>
            <p className={`text-sm ${smallClass}`}><strong>Právní základ:</strong> Váš výslovný souhlas.</p>
          </div>
          <div>
            <h3 className={`font-semibold mb-1 ${h3Class}`}>Historie návštěv a nákupů</h3>
            <p className="mb-1">Jaké procedury a produkty jste u nás absolvovali/zakoupili.</p>
            <p className="mb-1"><strong>Proč:</strong> Pro personalizaci našich služeb a doporučení další péče.</p>
            <p className={`text-sm ${smallClass}`}><strong>Právní základ:</strong> Náš oprávněný zájem na zlepšování služeb.</p>
          </div>
          <div>
            <h3 className={`font-semibold mb-1 ${h3Class}`}>Marketingové údaje</h3>
            <p className="mb-1">E-mail pro zasílání novinek.</p>
            <p className="mb-1"><strong>Proč:</strong> K zasílání tipů pro péči o pleť a speciálních nabídek.</p>
            <p className={`text-sm ${smallClass}`}><strong>Právní základ:</strong> Váš souhlas (nebo oprávněný zájem, pokud jste již naším klientem a neodhlásili jste se).</p>
          </div>
        </div>
      </AccordionSection>

      <AccordionSection
        id={SECTION_ID.KOMU}
        title={privacy.section3Title}
        open={openId === SECTION_ID.KOMU}
        onToggle={() => toggle(SECTION_ID.KOMU)}
        isDark={isDark}
      >
        <p>
          Vaše data neprodáváme. Sdílíme je pouze s prověřenými partnery, kteří nám pomáhají
          s chodem studia (např. rezervační systém, poskytovatel webhostingu, účetní software).
          Všichni partneři jsou vázáni mlčenlivostí a přísnými pravidly pro ochranu dat.
        </p>
      </AccordionSection>

      <AccordionSection
        id={SECTION_ID.JAK_DLOUHO}
        title={privacy.section4Title}
        open={openId === SECTION_ID.JAK_DLOUHO}
        onToggle={() => toggle(SECTION_ID.JAK_DLOUHO)}
        isDark={isDark}
      >
        <p className="mb-4">Údaje uchováváme jen po nezbytně nutnou dobu:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong>Fakturační údaje:</strong> 10 let (vyžaduje zákon).</li>
          <li><strong>Údaje pro rezervace a klientskou kartu:</strong> Po dobu, kdy jste naším aktivním klientem, a 3 roky po poslední návštěvě.</li>
          <li><strong>Zdravotní a anamnestické údaje:</strong> Okamžitě mažeme, pokud svůj souhlas odvoláte.</li>
        </ul>
      </AccordionSection>

      <AccordionSection
        id={SECTION_ID.PRÁVA}
        title={privacy.section5Title}
        open={openId === SECTION_ID.PRÁVA}
        onToggle={() => toggle(SECTION_ID.PRÁVA)}
        isDark={isDark}
      >
        <p className="mb-4">Podle GDPR máte právo:</p>
        <ul className="list-disc pl-5 space-y-2 mb-4">
          <li>Požádat o výpis, jaké údaje o vás máme.</li>
          <li>Požádat o opravu chybných údajů.</li>
          <li>Požádat o výmaz (právo „být zapomenut“).</li>
          <li>Odvolat souhlas (zejména u marketingu a zdravotních údajů). Stačí nám napsat na <a href={`mailto:${footer.email}`} className={linkClass}>{footer.email}</a>.</li>
        </ul>
      </AccordionSection>
    </>
  );
}
