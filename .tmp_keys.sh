#\!/usr/bin/env bash
set -euo pipefail
file='app-react/src/i18n/uiTranslator.js'
extract(){
  local name="$1"
  awk -v name="$name" '
    $0 ~ "const "name" = \\{" {inobj=1; next}
    inobj && $0 ~ /^};/ {inobj=0; exit}
    inobj {
      if (match($0, /^[[:space:]]*\047([^\047]+)\047[[:space:]]*:/, m)) print m[1]
    }
  ' "$file" | sort -u
}
extract EN_TRANSLATIONS > .tmp_en.txt
for lang in FR_TRANSLATIONS PT_TRANSLATIONS DE_TRANSLATIONS IT_TRANSLATIONS; do
  extract "$lang" > ".tmp_${lang}.txt"
  echo "== $lang =="
  echo -n "keys="; wc -l < ".tmp_${lang}.txt"
  echo -n "missing="; comm -23 .tmp_en.txt ".tmp_${lang}.txt" | wc -l
  echo "sample missing:"
  comm -23 .tmp_en.txt ".tmp_${lang}.txt" | head -n 25
  echo
 done
