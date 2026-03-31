# Shrnutí projektu: Skinstudio (Salon System)

## Co to je?

**Webová rezervační aplikace pro kosmetický salon** (Skin Studio). Zákazníci si v prohlížeči vyberou proceduru, datum a čas a rezervaci potvrdí; majitel/salon má admin rozhraní pro správu termínů, služeb a odesílání připomínek.

---

## Pro zákazníka (veřejná část)

1. **Výběr procedury** – ze seznamu služeb (název, cena, délka v minutách).
2. **Výběr data** – z dostupných dnů (max. 30 dní dopředu), podle nastavených směn v adminu.
3. **Výběr času** – z volných slotů daného dne (respektuje délku procedury a už obsazené termíny; u krátkých procedur „lepí“ sloty k sobě, aby se den nerozdrobil).
4. **Vyplnění údajů** – jméno, telefon, e-mail.
5. **Odeslání** – rezervace se uloží do Firebase; zákazník dostane potvrzení e-mailem (EmailJS), admin může dostat notifikaci (pokud je nastavený šablonový e-mail).

**Skrytý vstup do adminu:** 7× kliknutí na logo → zobrazí se přihlašovací formulář.

---

## Pro admina (po přihlášení heslem)

- **Rezervace** – denní přehled rezervací podle vybraného data, vyhledávání podle jména/telefonu/e-mailu, klik na rezervaci = detail (zavolat, e-mail, uložit do kalendáře .ics, smazat).
- **Připomínky** – hromadné odeslání e-mailových připomínek zákazníkům na zítřejší termíny (EmailJS).
- **Manuální rezervace** – vytvoření rezervace za zákazníka (služba, datum, čas, jméno, telefon, e-mail).
- **Směny** – pro vybraný den nastavení pracovních bloků (např. 09:00–12:00, 13:00–17:00). Podle toho se zákazníkům zobrazují dostupné dny a časy.
- **Služby** – přidávání/úpravy/mazání procedur (název, cena, délka), změna pořadí (drag & drop nebo šipky).
- **Archiv** – historie starších rezervací s vyhledáváním.

---

## Technologie

| Vrstva        | Technologie                          |
|---------------|--------------------------------------|
| Frontend      | React 19, Vite, Tailwind CSS, Lucide ikony |
| Data & auth   | Firebase (Firestore, Anonymous Auth) |
| E-maily       | EmailJS (potvrzení zákazníkovi, připomínky, notifikace adminovi) |
| Hosting       | Firebase Hosting (deploy z GitHub Actions na `main` a na PR)     |

---

## Data v Firebase

- **reservations** – rezervace (datum, čas, jméno, telefon, e-mail, služba, cena, délka, odeslána připomínka, zdroj: web/admin).
- **schedule** – dokumenty podle data (např. `25-01-2026`) s poli `periods` (bloky `start`/`end`) nebo starší formát `start`/`end`.
- **services** – služby (název, cena, duration, pořadí `order`).

---

## Stručně

Aplikace **umožňuje zákazníkům rezervovat termíny on-line** podle toho, co má salon v administraci nastavené (směny a služby), **ukládá rezervace do Firebase** a **komunikuje e-mailem** (potvrzení, připomínky, admin notifikace). Admin má jeden přehled nad rezervacemi, směnami a službami a může rezervace i ručně vytvářet a spravovat.
