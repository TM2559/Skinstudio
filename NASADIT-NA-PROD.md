# Nasadit aktuální stav na produkci a GitHub

Spusť v **Terminal.app** (ne v Cursoru) z kořene repa:

```bash
cd /Users/tm/Desktop/reservations

# 1. Odemkni git (kdyby byl lock)
rm -f .git/index.lock

# 2. Kdyby git hlásil "local changes would be overwritten", ulož je do stashu.
#    DŮLEŽITÉ: příkaz spusť z kořene repa (reservations), ne ze salon-system!
git stash push -m "local" -- .github/workflows/firebase-hosting-merge.yml salon-system/firebase.json salon-system/functions/index.js salon-system/functions/package.json

# 3. Přesun na main a sloučit větev feat/thank-you-page
git checkout main
git merge feat/thank-you-page -m "Merge feat/thank-you-page: Thank You, deploy helpers, SMS"

# 4. Push na GitHub (spustí se CI = hosting + functions)
git push origin main

# 5. Zpět na svoji větev (volitelně) a obnov změny ze stashu:
git checkout feat/thank-you-page
git stash pop
```

Hotovo. Po pushi:
- **GitHub** má na `main` aktuální kód.
- **Actions** (Deploy to Firebase Hosting on merge) nasadí hosting i funkce na produkci.

Kdyby merge hlásil konflikt, napiš a upravíme.
