#!/usr/bin/env bash
# Controlli veloci di sito, immagini e CMS (usati dalla sorveglianza ogni 10 minuti e dopo ogni
# pubblicazione, .github/workflows/). Esce con 1 se anche un solo controllo fallisce.
# Uso: SITO=https://... CMS=https://... scripts/qa/sorveglia.sh [rompi]
set -u
SITO=${SITO:-https://ilplatinatore.vercel.app}
CMS=${CMS:-https://49-13-164-162.sslip.io}
errori=0
prova() { # descrizione, indirizzo, testo che deve esserci (facoltativo)
  corpo=$(curl -sS -m 20 -w '\n%{http_code} %{time_total}' "$2" 2>&1) || true
  stato=$(printf '%s' "$corpo" | tail -n1)
  codice=${stato%% *}
  if [ "$codice" != "200" ]; then
    echo "::error::$1: risposta $stato ($2)"; errori=$((errori+1)); return
  fi
  if [ -n "${3:-}" ] && ! printf '%s' "$corpo" | grep -q "$3"; then
    echo "::error::$1: risponde ma manca «$3» ($2)"; errori=$((errori+1)); return
  fi
  echo "ok  $1: $stato"
}
prova "Home completa"        "$SITO/"                                   '<section aria-label="Ultime guide"'
prova "Guida al Platino"     "$SITO/2026/10/13/valor-mortis-guida-platino-tutti-trofei/" 'Valor Mortis'
prova "Hub del gioco"        "$SITO/tag/valor-mortis/"                  'Il percorso consigliato'
prova "Hub grande"           "$SITO/tag/crimson-desert/"                'Il percorso consigliato'
prova "Archivio"             "$SITO/category/news/"                     'Meno recenti'
prova "Sfida"                "$SITO/sfida/"                             'Sfida n.'
prova "Sfida (dati)"         "$SITO/api/sfida-oggi/"                    '"numero"'
prova "Sitemap"              "$SITO/sitemap_index.xml"                  'sitemap'
prova "Feed"                 "$SITO/feed/"                              '<rss'
prova "Immagine dal sito"    "$SITO/wp-content/uploads/2026/10/Valor-Mortis-guida-al-Platino-tutti-i-39-trofei-e-roadmap-completa-300x169.jpg?v=2"
prova "REST del CMS"         "$CMS/wp-json/wp/v2/posts?per_page=1&_fields=id" '"id"'
prova "Immagine dal CMS"     "$CMS/wp-content/uploads/2026/10/Valor-Mortis-guida-al-Platino-tutti-i-39-trofei-e-roadmap-completa-300x169.jpg"
if [ "${1:-}" = "rompi" ]; then
  prova "Guasto messo apposta" "$SITO/pagina-che-non-esiste-per-prova/"
fi
# il sito di prova deve restare fuori da Google finche' non si passa
if ! curl -sSI -m 20 "$SITO/" | grep -qi '^x-robots-tag: noindex'; then
  echo "::error::Il sito di prova ha perso il noindex"; errori=$((errori+1))
fi
[ "$errori" -eq 0 ] || { echo "$errori controlli falliti"; exit 1; }
echo "tutti i controlli verdi"
