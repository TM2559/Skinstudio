#!/bin/bash
set -e
cd "$(dirname "$0")"
rm -f .git/index.lock .git/HEAD.lock .git/refs/heads/*.lock 2>/dev/null || true
git add .github/workflows/firebase-hosting-merge.yml \
  salon-system/firebase.json \
  salon-system/functions/index.js \
  salon-system/src/components/AdminView.jsx \
  salon-system/src/components/CustomerView.jsx \
  salon-system/src/firebaseConfig.js
git commit -m "fix: nový text SMS potvrzení + deploy functions v CI"
echo "Commit hotov. Push: git push origin $(git branch --show-current)"
