# Push na GitHub a spuštění buildu

Spusť v **Terminal.app** (jedno po druhém) a sleduj výstup:

---

### 1. Jsi v kořeni repa a na main?
```bash
cd /Users/tm/Desktop/reservations
git branch
```
Mělo by být u `main` hvězdička. Když ne: `git checkout main`.

---

### 2. Je main před origin? (máš lokálně sloučené změny)
```bash
git fetch origin
git log main -1 --oneline
git log origin/main -1 --oneline
```
Když je **první hash jiný než druhý** (main novější než origin/main), máš co pushnout.  
Když jsou **stejné**, merge na main u tebe není – napiš a doladíme.

---

### 3. Push s viditelným výstupem
```bash
git push origin main --verbose
```
- Uvidíš např. `Enumerating objects...`, `Writing objects: 100%`, `Total ...` a na konci např. `6bb4be4..afc102d  main -> main`.
- Když píše **Everything up-to-date**, na GitHub se nic neposílá (main už tam tak je).
- Když píše **chybu** (auth, rejected), zkopíruj celou chybu.

---

### 4. Po úspěšném pushi – workflow
Na GitHubu: **https://github.com/TM2559/Skinstudio/actions**

- Měl by se objevit běh **„Deploy to Firebase Hosting on merge“** (žlutý / zelený).
- Když **nic neběží**: v repozitáři **Settings** → **Actions** → **General** → „Allow all actions and reusable workflows“ (nebo aspoň povolené Actions).

---

### 5. Když hlavní workflow neběží – nasadit jen funkce (SMS)
V **Actions** vlevo zvol **„Deploy Functions only“** → **Run workflow** → **Run workflow**.  
Tím se nasadí jen Cloud Functions (bez buildu webu).

---

### 6. Když na GitHubu nevidíš vůbec žádný build (žádný běh v Actions)
- **Push musíš udělat z Terminálu** (ne z Cursoru): `git push origin main --verbose`. Po pushi se workflow spustí sám.
- **Zkontroluj, že jsou Actions zapnuté:** Repozitář → **Settings** → **Actions** → **General** → „Allow all actions and reusable workflows“ (nebo „Allow [repo] actions“).
- **Spuštění bez pushi:** V **Actions** vlevo vyber **„Deploy to Firebase Hosting on merge“** → **Run workflow** → větévka **main** → **Run workflow**. Build poběží ručně.
