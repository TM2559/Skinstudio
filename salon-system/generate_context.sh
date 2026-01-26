#!/bin/bash

# Název výstupního souboru
OUTPUT_FILE="AI_CONTEXT.md"

# Hlavička kontextu
echo "# PROJEKT: Skin Studio (Rezervační systém)" > "$OUTPUT_FILE"
echo "Stack: React + Vite + Firebase + Tailwind + EmailJS" >> "$OUTPUT_FILE"
echo "Date: $(date)" >> "$OUTPUT_FILE"
echo "--------------------------------------------------" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

# --- SMART PROMPT PRO AI ---
# Toto definuje chování AI pro další konverzaci
echo "🔴 INSTRUKCE PRO AI (SYSTEM PROMPT):" >> "$OUTPUT_FILE"
echo "Jsi Lead React Developer a Architekt projektu Skin Studio. Tento soubor obsahuje kompletní a aktuální stav naší codebase." >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"
echo "TVA ROLE A CHOVÁNÍ:" >> "$OUTPUT_FILE"
echo "1. Kontext: Všechny odpovědi musí vycházet POUZE z přiloženého kódu. Pokud něco v kódu chybí, upozorni na to, nevymýšlej si halucinace." >> "$OUTPUT_FILE"
echo "2. Architektura: Dodržuj rozdělení na 'components/AdminView', 'components/CustomerView' a 'utils'. Nemíchej logiku zpět do App.jsx." >> "$OUTPUT_FILE"
echo "3. Bezpečnost: Nikdy nenavrhuj hardcodování hesel. Vždy používej environment variables." >> "$OUTPUT_FILE"
echo "4. Styl: Udržuj konzistenci Tailwind CSS tříd a designu (Stone/Rose colors)." >> "$OUTPUT_FILE"
echo "5. Jazyk: Komunikuj stručně, technicky přesně a v češtině." >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"
echo "POKYN PRO TEĎ:" >> "$OUTPUT_FILE"
echo "Analyzuj přiložené soubory, sestav si mentální mapu závislostí (imports/exports) a potvrď, že jsi připraven pracovat. Neopisuj kód zpátky, jen potvrď 'Kontext načten, čekám na zadání'." >> "$OUTPUT_FILE"
echo "--------------------------------------------------" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

# 1. Automatické vyhledání všech zdrojových kódů v src/ (rekurzivně)
echo "🔍 Vyhledávám soubory v src/..."
find src -type f \( -name "*.js" -o -name "*.jsx" \) | sort > files_to_read.txt

# 2. Přidání důležitých config souborů z kořenového adresáře
if [ -f "vite.config.js" ]; then
  echo "vite.config.js" >> files_to_read.txt
fi
if [ -f "package.json" ]; then
  echo "package.json" >> files_to_read.txt
fi
if [ -f "tailwind.config.js" ]; then
  echo "tailwind.config.js" >> files_to_read.txt
fi

# 3. Čtení souborů a zápis do kontextu
while IFS= read -r file; do
  if [ -f "$file" ]; then
    echo "📦 Balím: $file"
    echo "--- SOUBOR: $file ---" >> "$OUTPUT_FILE"
    
    # Detekce přípony pro správné formátování
    extension="${file##*.}"
    if [ "$extension" == "js" ] || [ "$extension" == "jsx" ]; then
      lang="javascript"
    elif [ "$extension" == "json" ]; then
      lang="json"
    else
      lang=""
    fi
    
    echo "\`\`\`$lang" >> "$OUTPUT_FILE"
    cat "$file" >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"
    echo "\`\`\`" >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"
  else
    echo "⚠️  Varování: Soubor $file nebyl nalezen (přeskočeno)."
  fi
done < files_to_read.txt

# Úklid dočasného souboru
rm files_to_read.txt

echo "--------------------------------------------------"
echo "✅ HOTOVO! Kontext byl uložen do souboru: $OUTPUT_FILE"
echo "👉 Tento soubor nyní nahrajte (přetáhněte) do chatu s AI."