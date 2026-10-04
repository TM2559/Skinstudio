# Skin Studio – appka na plochu (PWA)

Jednoduchá appka na telefon: **přehled směn a rezervací** a rychlé zadání termínu, **mimo admin**.
Není v App Store – je to webová stránka, kterou si jednou přidáš na plochu a spouští se jako běžná appka.

**Adresa:** `https://skinstudio.cz/app`

## Přidání na plochu (iPhone, jednorázově)

1. Otevři v **Safari**: `https://skinstudio.cz/app`
2. Ťukni na **Sdílet** (ikona čtverečku se šipkou dole).
3. **Přidat na plochu** → **Přidat**.
4. Na ploše přibude ikona „Skin Studio". Od teď ji spouštíš jako appku (na celou obrazovku, bez adresního řádku).

> Android/Chrome: menu ⋮ → „Přidat na plochu / Instalovat aplikaci".

## Přihlášení

Při prvním spuštění appka vyzve k přihlášení:
- **Face ID / Touch ID** (pokud je nastavené v adminu), nebo
- **heslem** (stejné admin heslo).

Po přihlášení zůstane appka na **tomto telefonu odemčená 12 hodin** (`ADMIN.UNLOCK_TTL_MS`) –
přepnutí do SMS a zpět ji nezamkne. Jiný telefon se vždy musí přihlásit sám.

## Přehled (hlavní obrazovka)

- Týden po dnech: **směna** (kosmetika / PMU), **rezervace** a zeleně **volná okna**.
- Šipky = předchozí / další týden, **Dnes**, **Jít na datum / +týdny** (skok o 1, 2, 4, 6, 8 týdnů bez listování).
- Klepnutí na **volné okno** → nová rezervace s předvyplněným dnem a časem.
- Klepnutí na **rezervaci** → detail: zavolat, SMS, e-mail a **Objednat znovu za 3 / 4 / 6 / 8 týdnů**
  (předvyplní klientku, službu a datum).
- **+** u dne → nová rezervace na ten den.

## Plný admin bez klikání na logo

Skrytá adresa **`https://skinstudio.cz/sprava`** (není nikde na webu odkázaná) otevře rovnou přihlášení
do plného admina – dá se také přidat na plochu. Na odemčeném telefonu (12 h) jde rovnou do admina.
Odhlášení v adminu telefon zase zamkne. 7× klik na logo na `/rezervace` funguje dál.

## Zadání rezervace

Jedna obrazovka:
Záložka **Nová rezervace** (nebo klepnutí na volné okno / + v přehledu):
1. **Služba z ceníku** – vyber z rozbalovacího seznamu. Tím se automaticky nastaví **správné trvání i cena** (bere se přímo z ceníku).
2. **Datum** (výchozí dnešek; tlačítka **+3 / +4 / +6 / +8 týd.**) a **Čas**.
3. **Jméno klienta**.
4. **Telefon / e-mail** – nepovinné (vyplň, jen když chceš).
5. Volitelně zaškrtni **„Poslat klientovi potvrzení"** (pošle SMS/e-mail; vyžaduje telefon nebo e-mail).
6. **Uložit rezervaci**.

Rezervace se objeví úplně stejně jako z webu nebo z adminu (kalendář, připomínky, editace).
Pokud se termín překrývá s jiným téhož dne, appka to **žlutě upozorní** – uložit můžeš i tak.

## Poznámky

- Rezervace z appky mají `source: 'app'` (odlišení od `web` / `admin`).
- Appka běží na stejném Firebase jako web; nasazení je součástí běžného `firebase deploy` (hosting).
- Login je chráněný stejným admin claimem jako celý admin (Face ID / heslo).
