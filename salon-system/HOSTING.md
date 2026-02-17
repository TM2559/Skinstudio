# Firebase Hosting – vlastní doména (skinstudio.cz, www.skinstudio.cz)

Aby fungovala jak **skinstudio.cz**, tak **www.skinstudio.cz**:

## 1. Přidání domény ve Firebase Console

1. Otevři [Firebase Console](https://console.firebase.google.com/) → projekt **tm-reservations**.
2. V levém menu: **Hosting** → **Add custom domain** (nebo „Přidat vlastní doménu“).
3. Přidej obě domény (pokud ještě nejsou):
   - **skinstudio.cz** (apex)
   - **www.skinstudio.cz** (subdoména)

## 2. Ověření vlastnictví domény

- Firebase ti ukáže **TXT záznam** pro ověření.
- U poskytovatele DNS (např. Wedos, Forpsi, Cloudflare) přidej tento TXT záznam.
- Po uložení (a případně šíření DNS, až 24 h) klikni ve Firebase na **Verify**.

## 3. Nastavení DNS záznamů

Po ověření Firebase zobrazí, které záznamy přidat. Typicky:

- Pro **skinstudio.cz**: **A** záznamy na IP adresy od Firebase (nebo přes CNAME, pokud to Firebase u apexu umožňuje).
- Pro **www.skinstudio.cz**: **A** nebo **CNAME** záznam pro `www` na cíl od Firebase (např. `tm-reservations.web.app`).

Přesné hodnoty vždy ber z Firebase Console (mohou se u projektu lišit).

## 4. Po nasazení

- Obě domény budou servírovat stejný obsah z Firebase Hosting.
- SSL certifikáty Firebase vystaví a obnoví automaticky.
- TXT záznam pro ověření nech v DNS trvale (Firebase ho používá i pro obnovu certifikátů).

## Core Web Vitals – WebP (volitelné)

Pro lepší LCP a menší datový objem přidej do `public/` soubor **lucie-portrait.webp** (konverze z `lucie-portrait.jpg`). V kódu je pak možné použít `<picture>` s `<source type="image/webp">` a stávající JPG jako fallback.

## Odkazy

- [Firebase – Connect a custom domain](https://firebase.google.com/docs/hosting/custom-domain)
- [Firebase – DNS setup assistance](https://firebase.google.com/support/troubleshooter/hosting/dns/help)
