# Code Review: TM2559/Skinstudio

**Datum:** 2. 2. 2026  
**Projekt:** Rezervační systém pro salon (React + Vite + Firebase + EmailJS)

---

## Kritické problémy

### 1. Hardcoded Firebase credentials v `firebase.js`

**Soubor:** `salon-system/src/firebase.js`

V repozitáři je soubor `firebase.js` s **vyplněnými Firebase API klíči** (apiKey, projectId, appId, …). Soubor není nikde importován (aplikace používá `firebaseConfig.js`), ale **klíče jsou veřejně v Gitu**.

**Doporučení:**
- Soubor **smazat** nebo ho nepřidávat do repozitáře (přidat do `.gitignore`).
- V Firebase Console zvážit **rotaci/regeneraci API klíčů**, protože mohly uniknout.
- Nadále používat pouze `firebaseConfig.js` s env proměnnými (`VITE_*`).

---

### 2. Admin heslo v kódu

**Soubor:** `salon-system/src/App.jsx` (řádek 76)

```javascript
if (adminPassword === 'salon123') { setView('admin'); setLoginError(''); }
```

Heslo je přímo v kódu. Kdokoli s přístupem ke zdrojákům (nebo k buildu) ho vidí.

**Doporučení:**
- Heslo brát z env: `import.meta.env.VITE_ADMIN_PASSWORD` (nebo název dle konvence).
- Do GitHub Actions přidat secret a předávat ho při buildu.
- V produkci použít silné heslo a nikdy ho necommittovat.

---

### 3. Chybějící `ADMIN_TEMPLATE` v EmailJS konfiguraci

**Soubory:** `firebaseConfig.js`, `CustomerView.jsx`

V `firebaseConfig.js` exportujete `EMAILJS_CONFIG` s: `SERVICE_ID`, `CONFIRM_TEMPLATE`, `REMINDER_TEMPLATE`, `PUBLIC_KEY`.  
**`ADMIN_TEMPLATE` tam není.**

V `CustomerView.jsx` (ř. 100–119) se volá `EMAILJS_CONFIG.ADMIN_TEMPLATE` – je vždy `undefined`, takže **notifikace adminovi po rezervaci se neodesílají**.

**Doporučení:**
- Do `firebaseConfig.js` přidat:  
  `ADMIN_TEMPLATE: getEnv('VITE_EMAILJS_ADMIN_TEMPLATE_ID')`
- V GitHub Actions (oba workflow) přidat env:  
  `VITE_EMAILJS_ADMIN_TEMPLATE_ID: ${{ secrets.VITE_EMAILJS_ADMIN_TEMPLATE_ID }}`
- V EmailJS vytvořit šablonu pro admina a její ID uložit do GitHub Secrets.

---

## Střední problémy

### 4. Překlep v GitHub Actions – double `}}`

**Soubory:**
- `.github/workflows/firebase-hosting-merge.yml` (ř. 31)
- `.github/workflows/firebase-hosting-pull-request.yml` (ř. 31)

```yaml
firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT_TM_RESERVATIONS }}'
```

Je tam `}}` na konci – správně by mělo být jen `}}` pro konec výrazu, název secretu by měl být bez mezery a bez druhé `}`.  
Správně např.:

```yaml
firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT_TM_RESERVATIONS }}'
```

(Ověřte si název secretu v repo – pokud se jmenuje přesně `FIREBASE_SERVICE_ACCOUNT_TM_RESERVATIONS }}`, pak je chyba v názvu secretu, ne v YAML.)

**Doporučení:** Zkontrolovat název secretu v Settings → Secrets; v YAML mít jeden výraz `${{ secrets.NAZEV }}`.

---

### 5. `.DS_Store` v repozitáři

V repozitáři jsou soubory `.DS_Store` (root a `.github/`). Zbytečně znečišťují Git.

**Doporučení:**
- Přidat do kořenového `.gitignore`: `**/.DS_Store` nebo `.DS_Store`
- Odstranit z Gitu:  
  `git rm --cached .DS_Store .github/.DS_Store`  
  a commitnout.

---

### 6. `eslint-disable no-undef` v `App.jsx` a `firebaseConfig.js`

Používáte globals (`__initial_auth_token`, `__firebase_config`, `__app_id`) bez deklarace, proto je vypnuté `no-undef`.

**Doporučení:**
- V `eslint.config.js` v `languageOptions.globals` přidat tyto globals (např. `__initial_auth_token: 'readonly'`), nebo
- Jejich definici/zavádění popsat v komentáři u konfigurace a ponechat cílený disable jen u konkrétního řádku, ne u celého souboru.

---

### 7. Chybějící validace odpovědí EmailJS

Po `fetch()` k EmailJS API se nekontroluje `response.ok` ani tělo odpovědi. Při chybě (např. špatný template, limit) uživatel může vidět „Potvrzeno“, i když e-mail neodešel.

**Doporučení:**
- Kontrolovat `response.ok` a v případě chyby např. logovat a zobrazit uživateli hlášku typu „Rezervace byla uložena, ale potvrzovací e-mail se nepodařilo odeslat. Kontaktujte nás prosím.“
- Stejnou logiku aplikovat i pro odesílání připomínek v `AdminView`.

---

## Drobné / návrhy na vylepšení

### 8. Konzistence názvů env proměnných

V workflow používáte `VITE_EMAILJS_CONFIRM_TEMPLATE_ID`, v kódu `getEnv('VITE_EMAILJS_CONFIRM_TEMPLATE_ID')` – to sedí. U `ADMIN_TEMPLATE` doplnit stejnou konvenci (`VITE_EMAILJS_ADMIN_TEMPLATE_ID`).

---

### 9. Rozdělení `AdminView.jsx`

Soubor má přes 400 řádků, kombinuje rezervace, směny, služby, modaly a drag & drop. Čtení a údržba by se zlepšily rozdělením na menší komponenty (např. `ReservationList`, `SettingsServices`, `ManualBookingModal`, `ReminderModal`).

---

### 10. Testy

`helpers.test.js` dobře pokrývá `Utils` (včetně `getSmartSlots`). Chybí testy pro React komponenty a pro integraci s Firebase (např. mock Firestore). Zvážit přidání alespoň jednoho smoke testu pro `CustomerView` / `AdminView` (např. s mocked Firebase a EmailJS).

---

### 11. Firebase Security Rules

V repozitáři není vidět konfigurace Firestore security rules. Ověřte, že:
- anonymní uživatel může jen číst potřebná data a zapisovat rezervace s rozumnými omezeními,
- mazání a úpravy rezervací/služeb/směn jsou povoleny jen po ověření (např. custom token nebo jiný mechanismus), ne jen z frontendu.

---

## Shrnutí

| Priorita   | Počet |
|-----------|--------|
| Kritické  | 3      |
| Střední   | 4      |
| Drobné    | 4      |

Nejurgentnější: odstranit nebo ignorovat `firebase.js` s klíči, změnit admin heslo na env, doplnit `ADMIN_TEMPLATE` a opravit workflow. Po té doporučuji rotovat Firebase API klíče a zkontrolovat Security Rules.
