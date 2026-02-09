# Přehled testů – Skin Studio (salon-system)

Testy běží přes **Vitest** a **React Testing Library**. Spuštění: `npm run test` nebo `npx vitest run`.

---

## 1. `src/utils/helpers.test.js` – pomocné funkce (Utils)

Testuje funkce z `src/utils/helpers.js`: převody času, formátování dat a logiku volných slotů.

### 1.1 Čas a zobrazení

| Test | Co se testuje |
|------|----------------|
| **correctly converts time string to minutes** | Převod řetězce `"01:00"` na minuty (60). |
| **correctly converts minutes to time string** | Převod 60 minut na řetězec `"01:00"`. |
| **formats date key for display** | `formatDateDisplay('2026-01-26')` → `"2026/01/26"`. |
| **generates correct time options** | `generateTimeOptions()` obsahuje alespoň `"06:00"`. |

### 1.2 getSmartSlots – volné sloty a „magnet“ režim

| Test | Co se testuje |
|------|----------------|
| **Strict Clustering: 30 min service sticks ONLY to existing reservation** | Při existující rezervaci (16:00–16:30) a 30min službě: slot 09:00 není (nechceme „drotit“ den), 15:30 a 16:30 jsou. |
| **Empty Day: 30 min service can be ANYWHERE** | Prázdný den: 30min služba může být 09:00, 13:00, 16:30 (first come, first served). |
| **Free Logic: 60 min service can be anywhere** | 60min služba: volné sloty včetně 09:00 a 10:00 i při existující rezervaci. |
| **excludes slots that collide with existing booking** | Obsazený interval 10:00–11:00: sloty 09:30 a 10:00 nejsou v seznamu; 09:00 a 11:00 jsou. |

### 1.3 Datum – formátování


| Test | Co se testuje |
|------|----------------|
| **formatDateKey formats Date to DD-MM-YYYY** | `formatDateKey(new Date(2026, 0, 15))` → `"15-01-2026"`. |
| **formatDateKey pads single digit day and month** | Jednociferný den/měsíc se doplní nulou (např. `"05-01-2026"`). |
| **getDateKeyFromISO parses ISO date (YYYY-MM-DD) to DD-MM-YYYY** | `getDateKeyFromISO('2026-01-26')` → `"26-01-2026"`. |
| **getDateKeyFromISO returns empty string for null/undefined** | Pro `null` nebo `""` vrací prázdný řetězec. |
| **formatDateDisplay returns empty string for falsy input** | Pro prázdný vstup vrací `""`. |

### 1.4 Odkaz do Google kalendáře

| Test | Co se testuje |
|------|----------------|
| **builds valid Google Calendar URL with date in DD-MM-YYYY format** | URL obsahuje `calendar/render`, `action=TEMPLATE`, text, details, location Skin Studio a parametr `dates` ve správném tvaru. |
| **builds valid URL with date in YYYY-MM-DD format** | Stejná funkce funguje i pro vstup ve formátu YYYY-MM-DD. |

---

## 2. `src/components/CustomerView.test.jsx` – rezervační formulář (zákazník)

Testuje komponentu **CustomerView**: výběr služby, termínu a času, formulář a odeslání. Firebase (`addDoc`) a EmailJS jsou **mockované**.

### 2.1 Render a kroky

| Test | Co se testuje |
|------|----------------|
| **renders list of services** | Zobrazení názvů služeb (Klasická masáž, Čištění pleti) a cen (800 Kč, 500 Kč). |
| **shows step headers** | Zobrazení nadpisů kroků: „1. Výběr procedury“, „2. Termín“, „3. Čas“ a blok „Rezervace“. |

### 2.2 Výběr služby a termínu

| Test | Co se testuje |
|------|----------------|
| **selecting a service highlights it and shows date picker** | Po kliknutí na službu (Čištění pleti) se nezobrazí hláška „žádné termíny“ (při platném rozvrhu). |
| **shows "no dates" message when schedule has no available days** | Při prázdném `schedule` a vybrané službě se zobrazí „Momentálně nejsou vypsány žádné termíny.“ |
| **with schedule and service shows date buttons and time slots** | Při vybrané službě a rozvrhu existují tlačítka s časy (např. 09:00, 09:30). |

### 2.3 Formulář a odeslání

| Test | Co se testuje |
|------|----------------|
| **form has name, phone, email inputs and submit button** | Po výběru služby a času jsou v formuláři pole jméno, telefon, e-mail a tlačítko „Potvrdit termín“. |
| **submit is disabled without time selected** | Bez zvoleného času má formulář třídu `pointer-events-none` (nelze odeslat). |
| **calls onBookingSuccess after successful submit** | Po vyplnění a odeslání je zavolán Firebase `addDoc` a callback `onBookingSuccess`. |

### 2.4 Props a motiv

| Test | Co se testuje |
|------|----------------|
| **applies initialServiceId when provided** | Při `initialServiceId="s2"` je služba Čištění pleti předvybraná (vizuálně zvýrazněná, např. `.border-l-2`). |
| **renders with dark theme when theme=dark** | Při `theme="dark"` se v DOM objeví třída pro tmavý režim (např. `.bg-stone-950`). |

---

## 3. `src/components/ReservationApp.test.jsx` – kontejner rezervací

Testuje **ReservationApp**: přepínání view (customer / login), přihlášení a režim **widgetOnly**. **React Router** (`useSearchParams`, `useLocation`) je mockován.

### 3.1 Výchozí a přihlášení

| Test | Co se testuje |
|------|----------------|
| **renders customer view by default** | Při `view='customer'` se zobrazí „Skin Studio“ a seznam služeb (CustomerView). |
| **shows login form when view is login** | Při `view='login'` se zobrazí „Admin Vstup“, pole hesla, tlačítko „Přihlásit“ a odkaz „Zpět na web“. |
| **calls handleLogin on login form submit** | Odeslání přihlašovacího formuláře volá `handleLogin`. |
| **calls setView when "Zpět na web" is clicked** | Klik na „Zpět na web“ volá `setView('customer')`. |

### 3.2 Loading a widgetOnly

| Test | Co se testuje |
|------|----------------|
| **shows loading spinner when loading is true** | Při `loading=true` je v DOM prvek s třídou `animate-spin`. |
| **widgetOnly mode renders CustomerView without logo banner** | Při `widgetOnly=true` je zobrazen CustomerView se službami, ale text „Skin Studio“ (banner) se neobjeví. |
| **renders CustomerView with services in widgetOnly** | V režimu `widgetOnly` se služby z props předají do CustomerView a zobrazí se (např. „Masáž“). |

---

## 3.5. `src/components/Layout.test.jsx` – navigace a odkaz Rezervace

Testuje **Layout**: odkaz REZERVACE a volání `setView('customer')` při kliknutí, aby po přihlášení do admina při přechodu z jiné stránky (např. Kosmetika) na Rezervace zůstal zobrazen rezervační formulář, ne admin.

| Test | Co se testuje |
|------|----------------|
| **renders REZERVACE link** | V navigaci je odkaz „REZERVACE“. |
| **calls setView("customer") when REZERVACE link is clicked** | Při předaném `setView` a kliknutí na REZERVACE se volá `setView('customer')`. |
| **does not throw when setView is not provided and REZERVACE is clicked** | Bez `setView` klik na REZERVACE nevyhodí chybu. |
| **when on Kosmetika page with setView, clicking REZERVACE calls setView("customer")** | Na stránce /kosmetika s předaným `setView` klik na REZERVACE volá `setView('customer')` (oprava chyby: po přihlášení do admina přechod Kosmetika → Rezervace má zobrazit formulář). |

---

## 4. `src/components/admin/AdminServicesTab.test.jsx` – záložka Služby (admin)

Testuje komponentu **AdminServicesTab**: formulář pro novou/upravovanou službu, tlačítko Zrušit, volání onStartEdit při kliknutí na Upravit.

| Test | Co se testuje |
|------|----------------|
| **renders list of services and form for new service** | Zobrazení nadpisu Služby, „Nový produkt / Služba“, seznam služeb a prázdný formulář s tlačítkem „+ Přidat“. |
| **when editingServiceId is set shows "Upravit produkt" and form filled with service data** | V režimu úpravy: nadpis „Upravit produkt“, tlačítka „Uložit změny“ a „Zrušit“, pole Název a Cena vyplněná dle serviceForm. |
| **calls onCancelEdit when Zrušit is clicked** | Klik na „Zrušit“ volá onCancelEdit. |
| **calls onStartEdit with service when edit button is clicked on a service row** | Klik na tlačítko „Upravit“ u služby (aria-label „Upravit Klasická masáž“) volá onStartEdit s příslušným objektem služby. |

---

## 5. `src/components/AdminView.test.jsx` – admin panel a úprava služby

Testuje **AdminView** s mockovaným Firebase: po kliknutí na záložku Služby a na „Upravit“ u služby musí zůstat zobrazen formulář pro úpravu (ne prázdná obrazovka).

| Test | Co se testuje |
|------|----------------|
| **after clicking Služby and then Edit on a service, edit form is visible (not blank screen)** | Klik na záložku „Služby“, pak na „Upravit“ u první služby → zobrazí se „Upravit produkt“, „Uložit změny“, „Zrušit“ a pole Název s hodnotou služby. Ověřuje opravu chyby, kdy se dříve přepínalo na neexistující záložku „settings“ a obrazovka zůstala prázdná. |

---

## Shrnutí

- **helpers.test.js**: 15 testů (čas, datum, getSmartSlots, Google Calendar).
- **CustomerView.test.jsx**: 10 testů (render, výběr služby/termínu/času, formulář, odeslání, initialServiceId, dark theme).
- **ReservationApp.test.jsx**: 7 testů (customer/login view, handleLogin, setView, loading, widgetOnly).
- **AdminServicesTab.test.jsx**: 4 testy (seznam služeb, režim úpravy, Zrušit, onStartEdit).
- **AdminView.test.jsx**: 1 test (úprava služby nezobrazí prázdnou obrazovku).
- **Layout.test.jsx**: 4 testy (odkaz REZERVACE, setView při kliku, chování na stránce Kosmetika).

**Celkem: 42 testů.**  
Pro běh testů bez watch režimu: `npx vitest run`.
