## Cursor Cloud specific instructions

### Project overview

Skin Studio is a React + Vite salon booking system for a Czech beauty studio. The main application lives in `salon-system/`. There is no Docker, no monorepo tooling — just npm.

### Running the app

- **Dev server:** `npm run dev` from `salon-system/` (Vite on port 5173)
- **Tests:** `npx vitest run` from `salon-system/` (60 tests, all self-contained with mocks)
- **Lint:** `npx eslint .` from `salon-system/` (pre-existing lint errors exist in the codebase)
- **Build:** `npm run build` runs tests first, then `vite build`

### Firebase env vars

The app requires `VITE_FIREBASE_*` env vars for Firebase initialization. Without them, 2 test suites (`ReservationApp.test.jsx`, `AdminImageOptimization.test.js`) fail at module load because `firebaseConfig.js` calls `getAuth(app)` at import time with an empty API key. The same credentials are already committed in the legacy `src/firebase.js` file. A `.env` file in `salon-system/` with these values resolves the issue.

### Non-obvious caveats

- The `npm run test` script runs vitest in **watch mode**. Use `npx vitest run` for a single run suitable for CI/automation.
- ESLint exits with errors (pre-existing); this does not block development.
- The Express API server (`npm run server` on port 3001) is optional — only needed for the "Magic Wand" AI content formatting feature and requires `OPENAI_API_KEY` or `GEMINI_API_KEY`.
- Firebase Cloud Functions live in `salon-system/functions/` and require a separate `npm install`. They are optional for local development.
- **Admin login:** 7× klik na logo „Skin Studio“ otevře přihlášení. Heslo je z `VITE_ADMIN_PASSWORD` (`.env` v `salon-system/`). Pro Face ID / Touch ID musí být v prostředí Functions nastaveno `ADMIN_PASSWORD` (stejná hodnota) a po prvním přihlášení heslem lze v adminu nastavit Face ID (ikona u odhlášení).
