import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import useSEO from '../hooks/useSEO';
import { WEB_CONTENT } from '../constants/content';
import { SEO } from '../constants/seo';

const SECTION_ID = {
  KDO_JSME: 'kdo-jsme',
  JAKÉ_ÚDAJE: 'jake-udaje',
  KOMU: 'komu',
  JAK_DLOUHO: 'jak-dlouho',
  PRÁVA: 'prava',
};

function AccordionSection({ id, title, open, onToggle, children }) {
  return (
    <section className="border-b border-stone-200 last:border-b-0" aria-labelledby={`heading-${id}`}>
      <h2 id={`heading-${id}`}>
        <button
          type="button"
          onClick={onToggle}
          className="w-full flex items-center justify-between gap-4 py-5 text-left font-sans font-semibold text-stone-800 hover:text-stone-900 transition-colors"
          aria-expanded={open}
          aria-controls={`panel-${id}`}
          id={`accordion-${id}`}
        >
          <span>{title}</span>
          <span className="shrink-0 text-stone-400" aria-hidden>
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
        <div
          className="pb-5 font-sans text-[#334155] leading-relaxed"
          style={{ lineHeight: '1.7' }}
        >
          {children}
        </div>
      </div>
    </section>
  );
}

export default function PrivacyPage() {
  const [openId, setOpenId] = useState(SECTION_ID.KDO_JSME);
  const { footer, privacy } = WEB_CONTENT;

  useSEO(SEO.privacy);

  const toggle = (id) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="min-h-screen skin-bg">
      <div className="container mx-auto px-6 py-12 max-w-3xl">
        <p className="mb-6">
          <Link
            to="/"
            className="text-sm font-medium text-stone-500 hover:text-stone-700 transition-colors"
          >
            ← Zpět na úvod
          </Link>
        </p>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-stone-800 mb-2">
          {privacy.pageTitle}
        </h1>
        <p className="text-sm text-stone-500 mb-10">
          Informace o zpracování osobních údajů v souladu s GDPR.
        </p>

        <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
          <div className="px-6 sm:px-8 pt-2 pb-1">
            <AccordionSection
              id={SECTION_ID.KDO_JSME}
              title={privacy.section1Title}
              open={openId === SECTION_ID.KDO_JSME}
              onToggle={() => toggle(SECTION_ID.KDO_JSME)}
            >
              <p className="mb-4">
                Vaše osobní údaje spravuje fyzická osoba {footer.ownerName}, IČ: {footer.ico}, se
                sídlem {footer.location} (dále jen „My“ nebo „Skinstudio“).
              </p>
              <p>
                Můžete nás kdykoliv kontaktovat na e-mailu:{' '}
                <a
                  href={`mailto:${footer.email}`}
                  className="text-[var(--skin-gold-dark)] hover:underline"
                >
                  {footer.email}
                </a>{' '}
                nebo telefonu:{' '}
                <a
                  href={`tel:${footer.phone.replace(/\s/g, '')}`}
                  className="text-[var(--skin-gold-dark)] hover:underline"
                >
                  {footer.phone}
                </a>
                .
              </p>
            </AccordionSection>

            <AccordionSection
              id={SECTION_ID.JAKÉ_ÚDAJE}
              title={privacy.section2Title}
              open={openId === SECTION_ID.JAKÉ_ÚDAJE}
              onToggle={() => toggle(SECTION_ID.JAKÉ_ÚDAJE)}
            >
              <p className="mb-4">
                Abychom vám mohli poskytnout ty nejlepší služby, zpracováváme následující údaje:
              </p>
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-stone-800 mb-1">
                    Identifikační a kontaktní údaje
                  </h3>
                  <p className="mb-1">Jméno, příjmení, telefon, e-mail.</p>
                  <p className="mb-1">
                    <strong>Proč:</strong> K vytvoření a správě rezervace, komunikaci o termínech a
                    fakturaci.
                  </p>
                  <p className="text-sm text-stone-600">
                    <strong>Právní základ:</strong> Plnění smlouvy (vaší objednávky).
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-stone-800 mb-1">
                    Informace o pleti a zdraví (Citlivé údaje)
                  </h3>
                  <p className="mb-1">
                    Typ pleti, alergie, kožní onemocnění nebo kontraindikace procedur.
                  </p>
                  <p className="mb-1">
                    <strong>Proč:</strong> Abychom zajistili vaši bezpečnost a vybrali vhodné
                    produkty. Tyto údaje zaznamenáváme pouze s vaším výslovným souhlasem (např. při
                    vyplnění vstupního dotazníku).
                  </p>
                  <p className="text-sm text-stone-600">
                    <strong>Právní základ:</strong> Váš výslovný souhlas.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-stone-800 mb-1">
                    Historie návštěv a nákupů
                  </h3>
                  <p className="mb-1">
                    Jaké procedury a produkty jste u nás absolvovali/zakoupili.
                  </p>
                  <p className="mb-1">
                    <strong>Proč:</strong> Pro personalizaci našich služeb a doporučení další péče.
                  </p>
                  <p className="text-sm text-stone-600">
                    <strong>Právní základ:</strong> Náš oprávněný zájem na zlepšování služeb.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-stone-800 mb-1">Marketingové údaje</h3>
                  <p className="mb-1">E-mail pro zasílání novinek.</p>
                  <p className="mb-1">
                    <strong>Proč:</strong> K zasílání tipů pro péči o pleť a speciálních nabídek.
                  </p>
                  <p className="text-sm text-stone-600">
                    <strong>Právní základ:</strong> Váš souhlas (nebo oprávněný zájem, pokud jste již
                    naším klientem a neodhlásili jste se).
                  </p>
                </div>
              </div>
            </AccordionSection>

            <AccordionSection
              id={SECTION_ID.KOMU}
              title={privacy.section3Title}
              open={openId === SECTION_ID.KOMU}
              onToggle={() => toggle(SECTION_ID.KOMU)}
            >
              <p>
                Vaše data neprodáváme. Sdílíme je pouze s prověřenými partnery, kteří nám pomáhají
                s chodem studia (např. rezervační systém, poskytovatel webhostingu, účetní
                software). Všichni partneři jsou vázáni mlčenlivostí a přísnými pravidly pro ochranu
                dat.
              </p>
            </AccordionSection>

            <AccordionSection
              id={SECTION_ID.JAK_DLOUHO}
              title={privacy.section4Title}
              open={openId === SECTION_ID.JAK_DLOUHO}
              onToggle={() => toggle(SECTION_ID.JAK_DLOUHO)}
            >
              <p className="mb-4">
                Údaje uchováváme jen po nezbytně nutnou dobu:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong>Fakturační údaje:</strong> 10 let (vyžaduje zákon).
                </li>
                <li>
                  <strong>Údaje pro rezervace a klientskou kartu:</strong> Po dobu, kdy jste naším
                  aktivním klientem, a 3 roky po poslední návštěvě.
                </li>
                <li>
                  <strong>Zdravotní a anamnestické údaje:</strong> Okamžitě mažeme, pokud svůj
                  souhlas odvoláte.
                </li>
              </ul>
            </AccordionSection>

            <AccordionSection
              id={SECTION_ID.PRÁVA}
              title={privacy.section5Title}
              open={openId === SECTION_ID.PRÁVA}
              onToggle={() => toggle(SECTION_ID.PRÁVA)}
            >
              <p className="mb-4">Podle GDPR máte právo:</p>
              <ul className="list-disc pl-5 space-y-2 mb-4">
                <li>Požádat o výpis, jaké údaje o vás máme.</li>
                <li>Požádat o opravu chybných údajů.</li>
                <li>Požádat o výmaz (právo „být zapomenut“).</li>
                <li>
                  Odvolat souhlas (zejména u marketingu a zdravotních údajů). Stačí nám napsat na{' '}
                  <a
                    href={`mailto:${footer.email}`}
                    className="text-[var(--skin-gold-dark)] hover:underline"
                  >
                    {footer.email}
                  </a>
                  .
                </li>
              </ul>
            </AccordionSection>
          </div>
        </div>
      </div>
    </div>
  );
}
