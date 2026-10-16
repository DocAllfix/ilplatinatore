#!/usr/bin/env bash
# Importa nel CMS la copia del sito su Aruba: database.sql estratto dall'archivio All-in-One WP
# Migration, piu' la cartella uploads e il plugin wpvibe. Da lanciare in /opt/platinatore-cms.
#
#   ./importa.sh            prima importazione (sostituisce il database del CMS!)
#
# Attesi in ./import/: database.sql, uploads/, plugins/vibe-ai/
#
# Non avvia Caddy: si puo' fare mentre il DNS si propaga.
set -euo pipefail
cd "$(dirname "$0")"

IMPORT=./import
[ -f "$IMPORT/database.sql" ] || { echo "manca $IMPORT/database.sql" >&2; exit 1; }
DOMINIO_CMS=$(grep -E '^DOMINIO_CMS=' .env | cut -d= -f2-)
DB_ROOT=$(grep -E '^DB_ROOT_PASSWORD=' .env | cut -d= -f2-)
VOLUME="$(basename "$PWD")_wp-data"
wp() { docker compose --profile strumenti run --rm -T cli wp "$@"; }

echo "[importa] database e WordPress (senza Caddy)"
docker compose up -d db wp

echo "[importa] database: il dump di All-in-One usa il segnaposto SERVMASK_PREFIX_ al posto del prefisso vero"
sed 's/SERVMASK_PREFIX_/wpsd_/g' "$IMPORT/database.sql" \
  | docker compose exec -T db mariadb -uroot -p"$DB_ROOT" wp_platinatore

echo "[importa] immagini e plugin wpvibe nel volume di WordPress"
docker run --rm -v "$VOLUME":/w -v "$PWD/import":/i:ro alpine sh -c '
  mkdir -p /w/wp-content/uploads /w/wp-content/plugins &&
  cp -a /i/uploads/. /w/wp-content/uploads/ &&
  rm -rf /w/wp-content/plugins/vibe-ai && cp -a /i/plugins/vibe-ai /w/wp-content/plugins/ &&
  chown -R 33:33 /w/wp-content/uploads /w/wp-content/plugins'

echo "[importa] plugin alle stesse versioni di Aruba. Advanced Ads NON si installa: inserirebbe la"
echo "          pubblicita' nel corpo restituito dalla REST, e gli spazi li gestisce il sito."
wp plugin install wordpress-seo --version=28.7 --force --quiet
wp plugin install akismet --version=5.7.2 --force --quiet
wp plugin activate wordpress-seo akismet vibe-ai

# Il dump di All-in-One svuota tema e plugin attivi; il CMS non mostra pagine al pubblico, quindi
# basta il tema predefinito incluso nell'immagine.
wp theme activate "$(wp theme list --field=name --status=inactive | grep -m1 '^twentytwenty')" || true

echo "[importa] dominio: https://www.ilplatinatore.it -> https://$DOMINIO_CMS (gestisce i dati serializzati)"
wp search-replace 'https://www.ilplatinatore.it' "https://$DOMINIO_CMS" --all-tables-with-prefix --skip-columns=guid --precise --report-changed-only
wp search-replace 'https://ilplatinatore.it' "https://$DOMINIO_CMS" --all-tables-with-prefix --skip-columns=guid --precise --report-changed-only

echo "[importa] il CMS non si fa indicizzare e Yoast non avvisa i motori di ricerca"
wp option update blog_public 0
wp option patch update wpseo enable_index_now false
wp option patch update wpseo enable_llms_txt false
wp rewrite structure '/%year%/%monthnum%/%day%/%postname%/' --hard
wp cache flush

echo "[importa] conteggi"
echo "articoli pubblicati: $(wp post list --post_type=post --post_status=publish --format=count)"
echo "programmati:         $(wp post list --post_type=post --post_status=future --format=count)"
echo "allegati:            $(wp post list --post_type=attachment --post_status=inherit --format=count)"
echo "tag:                 $(wp term list post_tag --format=count)"
echo "categorie:           $(wp term list category --format=count)"
echo "utenti:              $(wp user list --format=count)"
