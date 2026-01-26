#!/bin/bash

# Název výstupního souboru
OUTPUT_FILE="AI_CONTEXT.md"

# Hlavička kontextu
echo "# PROJEKT: Skin Studio (Rezervační systém)" > "$OUTPUT_FILE"
echo "Stack: React + Vite + Firebase + Tailwind + EmailJS" >> "$OUTPUT_FILE"
echo "Date: $(date)" >> "$OUTPUT_FILE"
echo "--------------------------------------------------" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

# 1. Automatické vyhledání všech zdrojových kódů v src/ (rekurzivně)
# Hledá soubory končící na .js, .jsx, .css (volitelně)
echo "🔍 Vyhledávám soubory v src/..."
find src -type f \( -name "*.js" -o -name "*.jsx" \) | sort > files_to_read.txt

# 2. Přidání důležitých config souborů z kořenového adresáře
# Pokud existují, přidáme je do seznamu
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
    
    # Detekce přípony pro správné formátování v Markdownu
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
echo "👉 Tento soubor nyní jednoduše přetáhněte (drag & drop) do chatu s AI."