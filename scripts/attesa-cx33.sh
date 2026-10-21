#!/usr/bin/env bash
# Aspetta il CX33 (controllo ogni 2 minuti, fino a 48 ore). Appena e' libero in Europa:
# --prepara subito (il server e' nostro); se e' a Norimberga anche --cambia (stesso IPv4).
# Altrove si ferma dopo --prepara: serve il record A di cms.ilplatinatore.it sul nuovo indirizzo.
cd "$(dirname "$0")/.."
fine=$(( $(date +%s) + 48*3600 ))
while [ "$(date +%s)" -lt "$fine" ]; do
  riga=$(python -X utf8 -I infra/cms/sposta-server.py --stato 2>&1 | grep "disponibile in")
  if [ -n "$riga" ] && ! echo "$riga" | grep -q "nessun luogo"; then
    echo "$(date '+%d/%m %H:%M') $riga"
    python -X utf8 -u -I infra/cms/sposta-server.py --prepara || { echo "PREPARAZIONE FALLITA"; exit 1; }
    if python -X utf8 -I infra/cms/sposta-server.py --stato | grep -q "platinatore-cms-cx33: cx33 nbg1"; then
      python -X utf8 -u -I infra/cms/sposta-server.py --cambia || { echo "CAMBIO FALLITO"; exit 1; }
      echo "TRASLOCO COMPLETATO (stesso IPv4)"
    else
      echo "PREPARATO FUORI NORIMBERGA: serve il cambio del record A, poi --cambia-dns"
    fi
    exit 0
  fi
  sleep 120
done
echo "48 ore senza disponibilita'"
