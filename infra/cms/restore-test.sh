#!/usr/bin/env bash
# Prova di ripristino, ogni lunedi'. Un backup non verificato e' un file che speri si apra.
# Adattato da restore-test.sh di Academy/EvalisDeck. Senza toccare il CMS in esercizio:
#   1. eta' del backup piu' recente (un cron morto non fa rumore)
#   2. checksum del manifest
#   3. decifratura e contenuto di wp-content ed env
#   4. ripristino del dump in un MariaDB EFFIMERO e conteggio di articoli e utenti
#   5. le immagini sulla Storage Box ci sono (conteggio a confronto con quelle locali)
# Exit 0 = ripristino verificato.
set -euo pipefail
cd "$(dirname "$0")"

BACKUP_DIR="${BACKUP_DIR:-/var/backups/platinatore-cms}"
PASS_FILE="${BACKUP_PASSPHRASE_FILE:?Imposta BACKUP_PASSPHRASE_FILE}"
TARGET="${1:-$(find "$BACKUP_DIR" -mindepth 1 -maxdepth 1 -type d | sort | tail -1)}"
[ -n "$TARGET" ] && [ -d "$TARGET" ] || { echo "ERRORE: nessun backup in $BACKUP_DIR" >&2; exit 1; }
echo "[restore-test] verifica di $TARGET"

ETA_ORE=$(( ( $(date +%s) - $(stat -c %Y "$TARGET") ) / 3600 ))
[ "$ETA_ORE" -le 36 ] || { echo "ERRORE: il backup piu' recente ha $ETA_ORE ore: il cron non gira" >&2; exit 1; }

( cd "$TARGET" && sha256sum -c --quiet SHA256SUMS ) || { echo "ERRORE: checksum falliti" >&2; exit 1; }
dec() { gpg --batch --quiet --decrypt --passphrase-file "$PASS_FILE" "$1"; }

VOCI=$(dec "$TARGET/wp-content.tar.gz.gpg" | tar -tzf - | wc -l)
[ "$VOCI" -gt 0 ] || { echo "ERRORE: wp-content vuoto" >&2; exit 1; }
for v in WEBHOOK_TOKEN PREVIEW_TOKEN DB_PASSWORD; do
  dec "$TARGET/env.gpg" | grep -q "^$v=..*" || { echo "ERRORE: env.gpg senza $v" >&2; exit 1; }
done
echo "[restore-test] wp-content: $VOCI voci; env con i token"

EFFIMERO="platinatore-restore-test-$$"
docker run -d --rm --name "$EFFIMERO" -e MARIADB_ROOT_PASSWORD=restoretest mariadb:11.8 >/dev/null
trap 'docker stop "$EFFIMERO" >/dev/null 2>&1 || true' EXIT
for _ in $(seq 1 60); do
  docker exec "$EFFIMERO" mariadb -uroot -prestoretest -e 'SELECT 1' >/dev/null 2>&1 && break
  sleep 1
done
dec "$TARGET/db.sql.gz.gpg" | gunzip | docker exec -i "$EFFIMERO" mariadb -uroot -prestoretest >/dev/null

ARTICOLI=$(docker exec "$EFFIMERO" mariadb -uroot -prestoretest -N -B -e \
  "SELECT COUNT(*) FROM wp_platinatore.wpsd_posts WHERE post_type='post' AND post_status='publish';")
UTENTI=$(docker exec "$EFFIMERO" mariadb -uroot -prestoretest -N -B -e "SELECT COUNT(*) FROM wp_platinatore.wpsd_users;")
[ "$ARTICOLI" -ge 1000 ] || { echo "ERRORE: solo $ARTICOLI articoli nel ripristino" >&2; exit 1; }
[ "$UTENTI" -ge 1 ]      || { echo "ERRORE: nessun utente nel ripristino" >&2; exit 1; }
echo "[restore-test] database ripristinato: articoli=$ARTICOLI utenti=$UTENTI"

STORAGE_BOX=$(grep -E '^STORAGE_BOX=' .env | cut -d= -f2- || true)
if [ -n "$STORAGE_BOX" ]; then
  UPLOADS=$(docker volume inspect -f '{{ .Mountpoint }}' "$(basename "$PWD")_wp-data")/wp-content/uploads
  LOCALI=$(find "$UPLOADS" -type f | wc -l)
  # rsync --dry-run elenca cio' che MANCA fuori: deve essere quasi niente
  MANCANTI=$(rsync -an --out-format='%n' -e 'ssh -p 23' "$UPLOADS/" "$STORAGE_BOX:uploads/" | grep -vc '/$' || true)
  echo "[restore-test] immagini locali=$LOCALI, mancanti sulla Storage Box=$MANCANTI"
  [ "$MANCANTI" -le 50 ] || { echo "ERRORE: troppe immagini non copiate fuori" >&2; exit 1; }
fi
echo "[restore-test] VERIFICATO: da questo backup si riparte."
