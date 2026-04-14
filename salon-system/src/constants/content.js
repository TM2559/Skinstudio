/**
 * Centralized web content – all static Czech text for homepage, header, and footer.
 * Components import WEB_CONTENT and map these values; no hardcoded copy in JSX.
 */

export const WEB_CONTENT = {
  voucherCheckout: {
    backToSite: 'Zpět na web',
    heroImageAlt: 'Dárkové poukazy Skin Studio',
    pageTitle: 'Dárkový poukaz',
  },
  header: {
    brandName: 'Skin Studio',
    ariaLabelHome: 'Skin Studio – Domů',
    ariaLabelMenu: 'Menu',
    ariaLabelInstagram: 'Instagram',
    navItems: [
      { label: 'KOSMETIKA', to: '/kosmetika' },
      { label: 'CENÍK', to: '/', hash: 'cenik' },
      { label: 'PERMANENTNÍ MAKE-UP', to: '/pmu', hash: 'pmu' },
      { label: 'DÁRKOVÉ POUKAZY', to: '/darkove-poukazy' },
      { label: 'KONTAKT', to: '/', hash: 'kontakt' },
      { label: 'REZERVACE', to: '/rezervace', cta: true },
    ],
  },

  hero: {
    /** Single H1 for homepage – SEO: Kosmetika Uherský Brod */
    seoTitle: 'Skin Studio – Prémiová kosmetika a péče o pleť Uherský Brod',
    subtitle: 'SKIN STUDIO LUCIE METELKOVÉ',
    title: 'Vaše pleť, vaše sebevědomí.',
    signature: 'S láskou k detailu, Lucie',
    body: 'Vytvořila jsem místo, kde se čas točí jen kolem vás. Mým cílem není vás měnit, ale vyzdvihnout to nejkrásnější ve vás.',
    cta: 'Objednat termín',
  },

  /** Landing page section H2s – keyword-rich for SEO */
  landing: {
    sectionAbout: 'Kosmetika Uherský Brod – Anti-aging a péče o pleť',
    sectionServices: 'Naše služby: Laminace obočí a Lifting řas',
    sectionReviews: 'Recenze klientek ze Skin Studia',
    sectionContact: 'Kontakt – Kosmetika Skin Studio Uherský Brod',
    sectionInstagram: 'Sledujte nás na Instagramu – kosmetika a péče o pleť Uherský Brod',
  },
  /** Descriptive alt text for images (SEO + accessibility) */
  imageAlts: {
    instagramGallery: 'Kosmetika a péče o pleť – Skin Studio Lucie Metelková, Uherský Brod',
    portrait: 'Lucie Metelková – prémiová kosmetika a péče o pleť, Skin Studio Uherský Brod',
    pmuSpotlight: 'Ukázka permanentního make-upu – před a po, Skin Studio',
  },

  filozofie: {
    heading: 'Filozofie',
    paragraphs: [
      'Jmenuji se Lucie Metelková a kosmetika je pro mě víc než jen práce – je to spojení odbornosti, relaxace a preciznosti. Kladu absolutní důraz na čistotu, špičkové postupy a zdraví vaší pleti.',
      'V mém studiu v Uherském Brodě nenajdete „pásovou výrobu“. Každá pleť je jedinečná, a proto je i každé mé ošetření 100% individuální. Ať už řešíme akné, vrásky, nebo jen toužíte po dokonalém obočí díky laminaci, mým cílem je, abyste odcházela nejen krásnější, ale i dokonale odpočatá.',
      'Zastavte se a dopřejte si svůj „Me Time“ okamžik v prostředí, kde se čas točí jen kolem vás.',
    ],
    /** Optional phrase to render in bold in the second paragraph */
    paragraph2Bold: 'Uherském Brodě',
    bullets: ['Individuální přístup', 'Kvalitní kosmetika', 'Příjemné prostředí', 'Odborná péče'],
    signatureName: 'Lucie',
  },

  pmu: {
    spotlightLabel: 'SPECIALIZACE',
    headline: 'Vaše já.',
    headlineItalic: 'Jen dokonalejší.',
    body: 'Mým cílem není vytvořit make-up, ale podtrhnout vaše rysy tak jemně, že si okolí všimne jen toho, jak skvěle vypadáte. Neviditelná práce, viditelný rozdíl.',
    cta: 'Více o permanentním make-upu',
    /** Optional: path to PMU Spotlight image (e.g. /pmu-spotlight.jpg). Falls back to placeholder. */
    spotlightImage: '/pmu-spotlight.jpg',
  },

  promeny: {
    heading: 'Proměny',
    emptyState: 'Proměny před/po budou zobrazeny, jakmile je v administraci přidáte (Fotografie → Proměny).',
    carouselAriaLabel: 'Proměny',
    transformationAriaLabel: 'Proměna',
    defaultTitle: 'Před a po',
  },

  cenik: {
    heading: 'Ceník',
    subtext: 'Vyberte si ošetření a rezervujte termín on-line.',
    loading: 'Načítání procedur a ceníku…',
    ctaReservovat: 'Rezervovat termín',
    ctaRezervovatShort: 'Rezervovat',
  },

  footer: {
    brandHeading: 'SKIN STUDIO',
    ownerName: 'Mgr. Lucie Metelková',
    /** Word to replace with Red Outline Heart icon (e.g. "srdci" → icon) */
    heartReplacementWord: 'srdci',
    tagline: 'Prémiová péče o pleť a permanentní make-up v srdci Uherského Brodu.',
    contactHeading: 'KONTAKT',
    location: 'Masarykovo náměstí 72 (Budova ČSOB – 1. patro), Uherský Brod',
    locationWithTown: 'Masarykovo náměstí 72 (Budova ČSOB – 1. patro), Uherský Brod',
    email: 'lucie@skinstudio.cz',
    phone: '+420 724 875 558',
    ico: '03120368',
    tradeRegisterText: 'Osoba zapsaná v živnostenském rejstříku.',
    copyright: '© 2024 Skin Studio Lucie Metelková. Všechna práva vyhrazena.',
    /** Odkaz v patičce na stránku Zpracování osobních údajů */
    privacyLinkLabel: 'Zpracování osobních údajů',
  },

  /** Stránka Zpracování osobních údajů (GDPR) – nadpisy pro accordion */
  privacy: {
    pageTitle: 'Zpracování osobních údajů',
    section1Title: '1. Kdo jsme (Správce údajů)',
    section2Title: '2. Jaké údaje sbíráme a proč (Účel a právní základ)',
    section3Title: '3. Komu údaje předáváme (Zpracovatelé)',
    section4Title: '4. Jak dlouho data uchováváme',
    section5Title: '5. Jaká jsou vaše práva',
  },

  /** Contact section (e.g. on landing / #kontakt) */
  kontakt: {
    heading: 'Kontakt',
    subtext: 'Domluvte si termín návštěvy. Těším se na vás.',
    followHeading: 'Sledujte nás',
    locationLabel: 'Uherský Brod',
    emailPublic: 'info@skinstudio.cz',
    cta: 'Objednat termín',
    copyright: '© 2024 Skin Studio Lucie Metelková',
  },

  /** PMU page – dark theme */
  pmuPage: {
    header: {
      brandName: 'Skin Studio',
      ariaLabelHome: 'Skin Studio – Domů',
      ariaLabelMenu: 'Menu',
      navKosmetika: 'KOSMETIKA',
      navFilozofie: 'FILOZOFIE',
      navPortfolio: 'PORTFOLIO',
      navKontakt: 'KONTAKT',
      navRezervace: 'Rezervace',
    },
    hero: {
      subtitle: 'Permanent Make-Up',
      title: 'Umění trvalé krásy',
      body: 'Precizní linky. Přirozený výsledek. Výjimečný zážitek.',
      cta: 'Objednat konzultaci',
    },
    philosophy: {
      heading: 'Filozofie',
      subheading: 'Jemnost, která zůstává',
      paragraphs: [
        'Permanentní make-up vnímám jako neviditelného pomocníka. Jeho úkolem není přebít vaši tvář, ale tiše podtrhnout to, co je na ní krásné.',
        'Pracuji tak, aby výsledek působil vzdušně a přirozeně. Cílem je, abyste se ráno probudila s pocitem, že jste upravená, ale stále jste to vy.',
      ],
    },
    portfolio: {
      heading: 'Portfolio',
      carouselAriaLabel: 'PMU proměny',
      transformationAriaLabel: 'Proměna',
      defaultTitle: 'Před a po',
      demoNote: 'Demo – vlastní před/po přidáte v adminu v záložce Fotografie → Proměny (kategorie PMU).',
    },
    cenik: {
      heading: 'Ceník a rezervace',
      loading: 'Služby se připravují…',
      priceNote: 'Přesné ceny a termíny vám sdělíme při rezervaci nebo na konzultaci.',
      priceDleCeniku: 'dle ceníku',
      cta: 'Rezervovat termín',
    },
    /** Default Markdown descriptions for PMU services when not set in Firestore. Key = service name. */
    serviceDescriptionDefaults: {
      'Meziřasová linka': '**Dlouhotrvající krása:** Probouzejte se upravená každé ráno.\n\n* **Přirozený vzhled:** Žádné ostré kontury, jen jemné stínování.\n* **Výdrž:** 1,5–2 roky.',
      'Rty - Soft Lips': '**Dlouhotrvající krása:** Probouzejte se upravená každé ráno.\n\n* **Přirozený vzhled:** Žádné ostré kontury, jen jemné stínování.\n* **Výdrž:** 1,5–2 roky.',
      'Pudrové obočí': '**Dlouhotrvající krása:** Probouzejte se upravená každé ráno.\n\n* **Přirozený vzhled:** Žádné ostré kontury, jen jemné stínování.\n* **Výdrž:** 1,5–2 roky.',
    },
    rezervace: {
      heading: 'Rezervace PMU',
    },
    footer: {
      brandHeading: 'Skin Studio',
      ownerName: 'Mgr. Lucie Metelková',
      heartReplacementWord: 'srdci',
      tagline: 'Prémiová péče o pleť a permanentní make-up v srdci Uherského Brodu.',
      navHeading: 'Navigace',
      navDomu: 'Domů',
      navFilozofie: 'Filozofie',
      navPortfolio: 'Portfolio',
      navCenik: 'Ceník',
      navRezervace: 'Rezervace',
      contactHeading: 'Kontakt',
      location: 'Masarykovo náměstí 72 (Budova ČSOB – 1. patro), Uherský Brod',
      email: 'lucie@skinstudio.cz',
      phone: '+420 724 875 558',
      instagramLabel: 'Instagram',
      copyright: '© 2026 Skin Studio Lucie Metelková',
    },
  },
};
