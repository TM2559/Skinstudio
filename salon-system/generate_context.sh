#!/bin/bash

# Název výstupního souboru
OUTPUT="AI_CONTEXT.md"

# 1. HLAVIČKA A INSTRUKCE
# Tady definujeme, co má AI vědět o roli a pravidlech
echo "# PROJEKT: Skin Studio (Rezervační systém)" > "$OUTPUT"
echo "Stack: React + Vite + Firebase + Tailwind + EmailJS + Vitest" >> "$OUTPUT"
echo "Date: $(date)" >> "$OUTPUT"
echo "--------------------------------------------------" >> "$OUTPUT"
echo "" >> "$OUTPUT"
echo "🔴 INSTRUKCE PRO AI (SYSTEM PROMPT):" >> "$OUTPUT"
echo "Jsi Lead React Developer a Architekt projektu Skin Studio. Tento soubor obsahuje kompletní a aktuální stav naší codebase." >> "$OUTPUT"
echo "" >> "$OUTPUT"
echo "TVA ROLE A CHOVÁNÍ:" >> "$OUTPUT"
echo "1. Kontext: Všechny odpovědi musí vycházet POUZE z přiloženého kódu. Pokud něco v kódu chybí, upozorni na to." >> "$OUTPUT"
echo "2. Architektura: Dodržuj rozdělení na 'components/AdminView', 'components/CustomerView' a 'utils'." >> "$OUTPUT"
echo "3. Bezpečnost: Nikdy nenavrhuj hardcodování hesel. Vždy používej environment variables." >> "$OUTPUT"
echo "4. Styl: Udržuj konzistenci Tailwind CSS tříd a designu (Stone/Rose colors)." >> "$OUTPUT"
echo "5. Jazyk: Komunikuj stručně, technicky přesně a v češtině." >> "$OUTPUT"
echo "6. Testování: Projekt používá Vitest. Udržuj testy funkční při změnách v 'utils'." >> "$OUTPUT"
echo "7. Logika: V utils/helpers.js je implementována 'Hybridní logika' (Smart Slots). 30min služby mají 'Magnet' režim, delší jsou volné. NEMĚNIT bezdůvodně." >> "$OUTPUT"
echo "" >> "$OUTPUT"
echo "POKYN PRO TEĎ:" >> "$OUTPUT"
echo "Analyzuj přiložené soubory, sestav si mentální mapu závislostí a potvrď, že jsi připraven pracovat." >> "$OUTPUT"
echo "--------------------------------------------------" >> "$OUTPUT"
echo "" >> "$OUTPUT"

# Funkce pro přidání souboru do kontextu
add_file() {
    local file_path=$1
    local lang=$2
    
    if [ -f "$file_path" ]; then
        echo "--- SOUBOR: $file_path ---" >> "$OUTPUT"
        echo "\`\`\`$lang" >> "$OUTPUT"
        cat "$file_path" >> "$OUTPUT"
        echo "" >> "$OUTPUT" # Newline for safety before closing tick
        echo "\`\`\`" >> "$OUTPUT"
        echo "" >> "$OUTPUT"
        echo "" >> "$OUTPUT"
        echo "Přidán: $file_path"
    else
        echo "⚠️  VAROVÁNÍ: Soubor $file_path nenalezen (přeskakuji)"
    fi
}

# 2. PŘIDÁNÍ SOUBORŮ

# A) Konfigurace (ty jsou v kořenu, necháme ručně pro kontrolu)
echo "📦 Přidávám konfiguraci..."
add_file "package.json" "json"
add_file "vite.config.js" "javascript"
add_file "tailwind.config.js" "javascript"

# B) Automatický sběr ze složky SRC (CHYTRÁ LOGIKA 🧠)
# Najde všechny .jsx, .js, .css soubory, seřadí je a přidá
# Tím se automaticky přidají i 'src/utils/helpers.test.js' a 'src/setupTests.js'
echo "🔄 Automaticky prohledávám složku src/..."

find src -type f \( -name "*.jsx" -o -name "*.js" -o -name "*.css" \) | sort | while read -r file; do
    
    # Jednoduchá detekce jazyka pro syntax highlighting
    extension="${file##*.}"
    lang="javascript"
    
    if [ "$extension" = "css" ]; then 
        lang="css"
    elif [ "$extension" = "json" ]; then
        lang="json"
    fi
    
    add_file "$file" "$lang"
done

echo "✅ HOTOVO! Kontext byl vygenerován do souboru: $OUTPUT"