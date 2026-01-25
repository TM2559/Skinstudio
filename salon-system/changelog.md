📝 Záznam změn (Changelog) - Skin Studio

Tento soubor dokumentuje všechna vylepšení a opravy provedené v projektu.

[1.1.0] - 2026-01-25

✨ Nové funkce (Administrace)

Detail objednávky: Přidáno modální okno s kompletními informacemi o zákazníkovi (Jméno, Služba, Termín, Kontakt).

Rychlé akce v detailu: Možnost přímo zavolat zákazníkovi nebo mu poslat e-mail jediným kliknutím z administrace.

Správa cen: Do systému přidána možnost nastavit cenu pro každou proceduru.

Editace produktů: Rozšířen formulář pro úpravu stávajících služeb (nyní lze měnit název, cenu i interní časový blok).

🎨 Vylepšení uživatelského rozhraní (UI)

Karty služeb pro klienty: Přidáno zobrazení cen. Zároveň byla cena zabezpečena proti zalomení na nový řádek i u dlouhých názvů.

Skrytí délky trvání: Pro zákazníky byla odstraněna informace o délce procedury (nyní slouží pouze jako interní údaj pro kalendář).

Kompaktní pracovní doba: V administraci se nyní zobrazuje stav (Otevřeno/Zavřeno) pouze pro den vybraný v kalendáři, což šetří místo a zvyšuje přehlednost.

Oprava ikon: Ikony bankovky a hodin v admin formuláři jsou nyní perfektně vycentrovány.

🔐 Bezpečnost a Architektura

Zabezpečení pomocí .env: Všechny citlivé údaje (Firebase API klíče, EmailJS ID) byly přesunuty do proměnných prostředí. Kód je nyní připraven pro bezpečné nahrání na GitHub.

Vite integrace: Projekt plně využívá import.meta.env pro lokální vývoj i produkční nasazení.

🐛 Opravy chyb

loginError: Opraveno varování o nepoužité proměnné (chyba se nyní správně zobrazuje uživateli při špatném heslu).

Zamezení probublávání (Event Bubbling): Opravena chyba, kdy se při mazání rezervace omylem otevřel i její detail.

Tento záznam slouží jako podklad pro commit zprávu na GitHub.