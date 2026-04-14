#!/bin/bash
# Nasazení na produkci (tm-reservations). Spusť z Terminu: ./deploy-prod.sh
set -e
cd "$(dirname "$0")"
echo "=== 1/2 Deploy Cloud Functions (SMS, připomínky, format-content) ==="
firebase deploy --only functions --project tm-reservations --non-interactive
echo ""
echo "=== 2/2 Deploy Hosting (web) ==="
firebase deploy --only hosting --project tm-reservations --non-interactive
echo ""
echo "✔ Produkce nasazená. https://tm-reservations.web.app"
