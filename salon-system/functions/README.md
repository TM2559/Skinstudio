# Cloud Functions – BulkGate SMS, připomínky, naplánované úlohy

- **`sendConfirmationSms`** – jedna SMS klientovi hned po vytvoření rezervace (web i manuální v adminu).
- **`sendReminderSms`** – připomínky zítřejších rezervací z adminu (tlačítko Připomínky): SMS přes BulkGate.
- **`sendDailyReminders`** – **naplánovaná funkce** (každý den 16:00 Praha): automaticky odešle připomínky na zítřek (SMS + e-mail podle kontaktu). Vyžaduje BulkGate pro SMS; pro e-mail volitelně EmailJS env (viz níže).

SMS přes [BulkGate](https://www.bulkgate.com/) (HTTP Simple API). E-mail v scheduled funkci přes EmailJS API.

## Nastavení

1. **Proměnné prostředí**  
   Ve složce `functions/` vytvoř soubor `.env` (není v gitu) s obsahem:

   ```
   BULKGATE_APPLICATION_ID=tvé_application_id
   BULKGATE_APPLICATION_TOKEN=tvůj_application_token
   ```

   **Shortcode (volitelné):** Pokud chceš odesílat SMS z krátkého čísla (shortcode), přidej do `.env`:
   ```
   BULKGATE_SENDER_ID=gShort
   BULKGATE_SENDER_ID_VALUE=90999
   ```
   (`90999` nahraď svým shortcode z BulkGate portálu. Jiné typy odesílatele: `gText`, `gSystem`, `gOwn` atd. – viz [BulkGate dokumentace](https://help.bulkgate.com/docs/en/http-simple-transactional-post-json.html).)

   Při prvním `firebase deploy --only functions` může CLI místo toho vyzvat k zadání hodnot a uložit je do `.env.<project_id>`.

   **Pro automatické e-mailové připomínky** (funkce `sendDailyReminders`) přidej do `.env` (volitelné):
   ```
   EMAILJS_SERVICE_ID=tvůj_service_id
   EMAILJS_REMINDER_TEMPLATE_ID=id_šablony_připomínky
   EMAILJS_PUBLIC_KEY=tvůj_public_key
   ```
   Stejné hodnoty jako v frontendu (VITE_EMAILJS_*). Bez nich scheduled funkce pošle jen SMS.

2. **Lokální test**  
   `npm run serve` spustí emulátor; pro přístup k BulkGate API použij stejné `.env`.

3. **Deploy**  
   Z kořene projektu: `firebase deploy --only functions`.

## Když se SMS neodesílají

- **V prohlížeči** po kliknutí na „Odeslat“ u připomínek uvidíš v alertu konkrétní chybu (BulkGate ne nakonfigurován, funkce nedostupná, nebo text od BulkGate API).
- **BulkGate není nakonfigurován** → doplň `BULKGATE_APPLICATION_ID` a `BULKGATE_APPLICATION_TOKEN` do `functions/.env` a znovu spusť `firebase deploy --only functions`.
- **Funkce nedostupná / not-found** → ověř, že jsou funkce nasazené v regionu **europe-west1** (Firebase Console → Functions).
- **BulkGate API chyba** (Invalid phone number, Unknown identity, …) → ověř v BulkGate portálu Application ID a Token; čísla musí být v mezinárodním formátu (420…).
- **Logy** → Firebase Console → Functions → sendReminderSms → Logs; nebo `firebase functions:log`.

## Chování

- **Potvrzení:** Po odeslání rezervace (CustomerView nebo manuální v adminu) se při vyplněném telefonu zavolá `sendConfirmationSms`. Text s plnou diakritikou (správná čeština), datum ve formátu „D. M.“ (např. 14. 2.), šablona: „Potvrzujeme vaši rezervaci.“ + SLUŽBA / TERMÍN + „Těšíme se na vás.“
- **Připomínky (tlačítko):** Admin zvolí „Připomínky“ pro zítřek. Rezervace s telefonem → SMS přes `sendReminderSms` (BulkGate). Rezervace s e-mailem → e-mail přes EmailJS z frontendu. U obou se nastaví `reminderSent: true`.
- **Připomínky (automatické):** `sendDailyReminders` běží každý den v 16:00 (Europe/Prague), načte rezervace na zítřek bez `reminderSent`, odešle SMS (BulkGate) a/nebo e-mail (EmailJS) a nastaví `reminderSent: true`.
