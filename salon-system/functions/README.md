# Cloud Functions – BulkGate SMS, Resend e-maily, připomínky

- **`sendConfirmationSms`** – jedna SMS klientovi hned po vytvoření rezervace (web i manuální v adminu).
- **`sendBookingEmails`** – potvrzení rezervace klientovi + kopie adminovi přes [Resend](https://resend.com/) (React Email šablony v `email/`).
- **`sendReminderSms`** – připomínky zítřejších rezervací z adminu (tlačítko Připomínky): SMS přes BulkGate.
- **`sendReminderEmails`** – dávkové e-mailové připomínky z adminu (stejné šablony jako u plánovače).
- **`sendDailyReminders`** – **naplánovaná funkce** (každý den 16:00 Praha): připomínky na zítřek (SMS BulkGate + e-mail Resend podle kontaktu).

SMS přes [BulkGate](https://www.bulkgate.com/) (HTTP Simple API). E-maily přes Resend; HTML šablony jsou v [`email/mail.jsx`](email/mail.jsx) (React Email) a sdílené údaje studia v [`email/brand.js`](email/brand.js). Po úpravě šablon spusť ve složce `functions/` znovu `npm run build` před deployem.

## Build (povinný před deployem)

Zdroj funkcí je v `src/index.js`; výstup pro Firebase je `lib/index.js` (esbuild + JSX pro React Email). Při `firebase deploy` se spustí `predeploy` v [`firebase.json`](../firebase.json) (`npm ci` + `npm run build` ve složce functions).

Lokálně: `npm run build` ve složce `functions/` před emulátorem, nebo použij `npm run serve` (build + emulátor).

## EmailJS vs Resend (přepínač)

- **Frontend (`salon-system/.env`):** `VITE_USE_RESEND_EMAILS=true` → callable Resend. Jinak (výchozí) → **EmailJS** z prohlížeče (`VITE_EMAILJS_*`). Můžeš nasadit nový hosting bez přepnutí – EmailJS zůstane aktivní, dokud nenastavíš `true`.
- **Plánovač `sendDailyReminders`:** pokud je v prostředí funkcí nastavený **Resend** (`RESEND_API_KEY` + `RESEND_FROM`), použije se. Pokud ne, použije se **EmailJS** z env funkcí (`EMAILJS_SERVICE_ID`, `EMAILJS_REMINDER_TEMPLATE_ID`, `EMAILJS_PUBLIC_KEY`) – stejné hodnoty jako u šablon na webu.

## Lokální test Resend (emulátor funkcí)

1. Ve **`functions/.env`** vyplň `RESEND_API_KEY`, `RESEND_FROM`, `RESEND_REPLY_TO`, `RESEND_ADMIN_TO` (stejně jako v produkci).
2. **`cd functions && npm run build`**
3. Z kořene **`salon-system/`**: `firebase emulators:start --only functions` (port **5001** – viz `firebase.json` → `emulators`).
4. Ve **`salon-system/.env`**: `VITE_USE_EMULATORS=true` a `VITE_USE_RESEND_EMAILS=true`, pak **`npm run dev`** a znovu načti stránku.

Callable funkce (`sendBookingEmails` …) poběží v emulátoru a načtou `functions/.env`. **Firestore zůstává produkční** – rezervace se ukládí do živého projektu (stejně jako dřív bez emulátoru). Po testu nastav `VITE_USE_EMULATORS=false`, pokud zase chceš jen produkční funkce.

## Lokální web (`npm run dev`) a e-maily

React běží na `localhost`, ale **callable funkce** (`sendBookingEmails` atd.) se volají na **nasazený Firebase projekt** (region `europe-west1`), ne z tvého `functions/.env` na disku.

- Aby po rezervaci z lokálu e-mail **došel**, musí být na tom projektu **nasazené** aktuální funkce a v **Google Cloud / Firebase** (nebo v secrets při deployi z CI) nastavené **`RESEND_API_KEY`** a **`RESEND_FROM`**.
- Soubor `functions/.env` se použije při **`firebase deploy`**, emulátoru, nebo když si sám spustíš funkce lokálně – **nesamostatně** při jen `vite` na portu 5173.

Pokud e-mail nedorazí, v konzoli prohlížeče (F12) uvidíš chybu callable (např. `failed-precondition` = Resend není v prostředí funkcí). Po uložení rezervace zobrazí aplikace také upozornění, když odeslání e-mailu selže.

## Nastavení

1. **Proměnné prostředí**  
   Ve složce `functions/` vytvoř soubor `.env` (není v gitu). Minimálně pro SMS:

   ```
   BULKGATE_APPLICATION_ID=tvé_application_id
   BULKGATE_APPLICATION_TOKEN=tvůj_application_token
   ```

   **Shortcode (volitelné):** Pokud chceš odesílat SMS z krátkého čísla (shortcode), přidej:

   ```
   BULKGATE_SENDER_ID=gShort
   BULKGATE_SENDER_ID_VALUE=90999
   ```

   (`90999` nahraď svým shortcode z BulkGate portálu. Viz [BulkGate dokumentace](https://help.bulkgate.com/docs/en/http-simple-transactional-post-json.html).)

   **Resend (e-maily):** Ověř doménu v Resend, vytvoř API klíč a nastav v `.env` nebo v Firebase Functions konfiguraci:

   ```
   RESEND_API_KEY=re_...
   RESEND_FROM=Skin Studio <noreply@tvoje-domena.cz>
   RESEND_REPLY_TO=rezervace@skinstudio.cz
   RESEND_ADMIN_TO=rezervace@skinstudio.cz
   ```

   Bez `RESEND_API_KEY` a `RESEND_FROM` callable e-maily vrátí chybu; plánovač `sendDailyReminders` pošle jen SMS. `RESEND_ADMIN_TO` je volitelné – bez něj se neodešle kopie pro salon při nové rezervaci.

   Parametry lze zadat i přes `firebase functions:config:set` / Secrets podle dokumentace Firebase; v kódu jsou podporované i `defineString` parametry `RESEND_*` (viz `src/resendMail.js`).

2. **Lokální test**  
   `npm run serve` ve složce `functions/` spustí build a emulátor.

3. **Deploy**  
   Z kořene `salon-system/`: `firebase deploy --only functions`.

## Když se SMS neodesílají

- **V prohlížeči** po kliknutí na „Odeslat“ u připomínek uvidíš v alertu konkrétní chybu (BulkGate ne nakonfigurován, funkce nedostupná, nebo text od BulkGate API).
- **BulkGate není nakonfigurován** → doplň `BULKGATE_APPLICATION_ID` a `BULKGATE_APPLICATION_TOKEN` do `functions/.env` a znovu nasaď funkce.
- **Funkce nedostupná / not-found** → ověř region **europe-west1** (Firebase Console → Functions).
- **BulkGate API chyba** → ověř Application ID a Token; čísla v E.164 (420…).
- **Logy** → Firebase Console → Functions → Logs; nebo `firebase functions:log`.

## Chování

- **Potvrzení:** Při vyplněném telefonu se zavolá `sendConfirmationSms`. Při vyplněném e-mailu se z webu zavolá `sendBookingEmails` (potvrzení + admin).
- **Připomínky (tlačítko):** SMS přes `sendReminderSms`; e-maily přes `sendReminderEmails` (dávka). Admin UI pak označí řádky jako odeslané.
- **Připomínky (automatické):** `sendDailyReminders` v 16:00 – SMS a/nebo e-mail Resend, nastavení `reminderSent`.
