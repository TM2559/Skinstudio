# Rychlá rezervace – appka na plochu (PWA)

Jednoduchá appka pro zadávání termínů z telefonu, **mimo admin**. Není v App Store –
je to webová stránka, kterou si jednou přidáš na plochu a spouští se jako běžná appka.

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

Po přihlášení zůstaneš na daném telefonu přihlášená – příště appku jen otevřeš a rovnou zadáváš.

## Zadání rezervace

Jedna obrazovka:
1. **Služba z ceníku** – vyber z rozbalovacího seznamu. Tím se automaticky nastaví **správné trvání i cena** (bere se přímo z ceníku).
2. **Datum** (výchozí dnešek) a **Čas**.
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
