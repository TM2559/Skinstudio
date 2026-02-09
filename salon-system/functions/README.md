# Cloud Functions – BulkGate SMS

Funkce `sendReminderSms` odesílá SMS připomínky přes [BulkGate](https://www.bulkgate.com/) (HTTP Simple API).

## Nastavení

1. **Proměnné prostředí**  
   Ve složce `functions/` vytvoř soubor `.env` (není v gitu) s obsahem:

   ```
   BULKGATE_APPLICATION_ID=tvé_application_id
   BULKGATE_APPLICATION_TOKEN=tvůj_application_token
   ```

   Při prvním `firebase deploy --only functions` může CLI místo toho vyzvat k zadání hodnot a uložit je do `.env.<project_id>`.

2. **Lokální test**  
   `npm run serve` spustí emulátor; pro přístup k BulkGate API použij stejné `.env`.

3. **Deploy**  
   Z kořene projektu: `firebase deploy --only functions`.

## Když se SMS neodesílají

- **V prohlížeči** po kliknutí na „Odeslat“ u připomínek uvidíš v alertu konkrétní chybu (BulkGate ne nakonfigurován, funkce nedostupná, nebo text od BulkGate API).
- **BulkGate není nakonfigurován** → doplň `BULKGATE_APPLICATION_ID` a `BULKGATE_APPLICATION_TOKEN` do `functions/.env` a znovu spusť `firebase deploy --only functions`.
- **Funkce nedostupná / not-found** → ověř, že jsou funkce nasazené v regionu **europe-central1** (Firebase Console → Functions).
- **BulkGate API chyba** (Invalid phone number, Unknown identity, …) → ověř v BulkGate portálu Application ID a Token; čísla musí být v mezinárodním formátu (420…).
- **Logy** → Firebase Console → Functions → sendReminderSms → Logs; nebo `firebase functions:log`.

## Chování

- Admin v aplikaci zvolí „Připomínky“ pro zítřek. Pro rezervace s vyplněným telefonem se zavolá tato funkce.
- Funkce pro každou rezervaci s platným číslem (E.164, 420…) odešle SMS přes BulkGate a v Firestore nastaví `reminderSent: true`.
- Rezervace pouze s e-mailem dál zpracovává frontend (EmailJS).
