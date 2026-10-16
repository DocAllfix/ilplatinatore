#!/usr/bin/env bash
# Avvio dello stack del CMS. Da lanciare in /opt/platinatore-cms DOPO setup-vps.sh e dopo aver
# copiato i file (docker-compose.yml, Caddyfile, mu-plugins/, php/, backup.sh, restore-test.sh).
#
#   SITO_PUBBLICO=https://<progetto>.vercel.app ./installa.sh
#
# Idempotente: se .env esiste, i segreti NON si rigenerano mai. Rigenerarli scollegherebbe il CMS
# dal sito (i token non combacerebbero piu') e nessuno capirebbe perche'.
#
# Differenza dal riferimento di Academy: qui i segreti non si stampano a video. Restano in .env
# e in credenziali-dashboard.txt (permessi 600), e da li' si portano su Vercel senza mostrarli.
set -euo pipefail
cd "$(dirname "$0")"

DOMINIO_CMS="${DOMINIO_CMS:-cms.ilplatinatore.it}"

# --- 1. segreti ------------------------------------------------------------------------
if [ -f .env ]; then
  echo "[installa] .env gia' presente: i segreti restano quelli."
else
  SITO_PUBBLICO="${SITO_PUBBLICO:?Serve SITO_PUBBLICO (il sito di prova su vercel.app)}"
  echo "[installa] genero i segreti"
  ADMIN_UTENTE="${ADMIN_UTENTE:-redazione}"
  # leggibile e da riscrivere a mano: niente simboli
  ADMIN_PASSWORD=$(openssl rand -base64 18 | tr -d '/+=' | cut -c1-20)
  # l'hash lo calcola Caddy in un container usa e getta
  ADMIN_HASH=$(docker run --rm caddy:2-alpine caddy hash-password --plaintext "$ADMIN_PASSWORD")
  umask 077
  cat > .env <<ENV
DOMINIO_CMS=$DOMINIO_CMS
SITO_PUBBLICO=$SITO_PUBBLICO
DB_ROOT_PASSWORD=$(openssl rand -hex 24)
DB_PASSWORD=$(openssl rand -hex 24)
WEBHOOK_TOKEN=$(openssl rand -hex 32)
PREVIEW_TOKEN=$(openssl rand -hex 32)
ADMIN_UTENTE=$ADMIN_UTENTE
ADMIN_HASH=$ADMIN_HASH
STORAGE_BOX=${STORAGE_BOX:-}
ENV
  # l'hash bcrypt contiene `$`: per docker compose va raddoppiato, altrimenti arriva troncato
  sed -i '/^ADMIN_HASH=/ s/\$/$$/g' .env
  printf 'utente: %s\npassword: %s\n' "$ADMIN_UTENTE" "$ADMIN_PASSWORD" > credenziali-dashboard.txt
  chmod 600 .env credenziali-dashboard.txt
  echo "[installa] password della dashboard in credenziali-dashboard.txt (non stampata)"
fi

chmod +x backup.sh restore-test.sh 2>/dev/null || true

# Solo i segreti, senza avviare Caddy: serve per importare il sito mentre il DNS si propaga.
# Avviare Caddy prima vorrebbe dire richieste di certificato fallite (Let's Encrypt ne tollera
# poche all'ora).
if [ "${SOLO_SEGRETI:-0}" = "1" ]; then
  echo "[installa] segreti pronti, stack non avviato (SOLO_SEGRETI=1)"
  exit 0
fi

# --- 2. avvio --------------------------------------------------------------------------
docker compose up -d
echo "[installa] attendo il certificato TLS"
for _ in $(seq 1 60); do
  if curl -sSf -o /dev/null "https://$DOMINIO_CMS/wp-json/" 2>/dev/null \
     || curl -s -o /dev/null -w '%{http_code}' "https://$DOMINIO_CMS/" 2>/dev/null | grep -qE '^(200|301|302|404)$'; then
    echo "[installa] HTTPS attivo"
    break
  fi
  sleep 5
done

# --- 3. verifica: le condizioni senza cui il CMS fa danni -----------------------------
esito=0
rosso() { echo "ROSSO $*"; esito=1; }
echo "=== Verifica contro https://$DOMINIO_CMS ==="

robots=$(curl -sI "https://$DOMINIO_CMS/" | tr -d '\r' | grep -i '^x-robots-tag:' || true)
echo "$robots" | grep -qi noindex && echo "OK    noindex sulle pagine" || rosso "la home del CMS non dichiara noindex"

robots=$(curl -sI "https://$DOMINIO_CMS/wp-json/" | tr -d '\r' | grep -i '^x-robots-tag:' || true)
echo "$robots" | grep -qi noindex && echo "OK    noindex sulla REST" || rosso "la REST non dichiara noindex"

for percorso in /wp-sitemap.xml /sitemap_index.xml /post-sitemap.xml /llms.txt; do
  codice=$(curl -s -o /dev/null -w '%{http_code}' "https://$DOMINIO_CMS$percorso")
  [ "$codice" = "404" ] && echo "OK    $percorso -> 404" || rosso "$percorso -> $codice"
done

codice=$(curl -s -o /dev/null -w '%{http_code}' "https://$DOMINIO_CMS/xmlrpc.php")
[ "$codice" = "403" ] && echo "OK    xmlrpc.php -> 403" || rosso "xmlrpc.php -> $codice"

codice=$(curl -s -o /dev/null -w '%{http_code}' "https://$DOMINIO_CMS/wp-login.php")
[ "$codice" = "401" ] && echo "OK    wp-login.php chiede la password di Caddy" || rosso "wp-login.php -> $codice"

[ "$esito" -eq 0 ] && echo "=== Stack in piedi e verificato ===" || echo "=== CI SONO CONTROLLI ROSSI ===" >&2
exit "$esito"
