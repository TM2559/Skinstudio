# Cloud Functions – BulkGate SMS

- **`sendConfirmationSms`** – jedna SMS klientovi hned po vytvoření rezervace (web i manuální v adminu).
- **`sendReminderSms`** – připomínky zítřejších rezervací z adminu (tlačítko Připomínky).

Obojí přes [BulkGate](https://www.bulkgate.com/) (HTTP Simple API).

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
- **Připomínky:** Admin zvolí „Připomínky“ pro zítřek; pro rezervace s telefonem se zavolá `sendReminderSms`, odešle se SMS a nastaví `reminderSent: true`. Rezervace jen s e-mailem řeší frontend (EmailJS).
