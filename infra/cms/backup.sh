#!/usr/bin/env bash
# Backup notturno del CMS. Adattato da backup.sh di Academy/EvalisDeck, con una differenza:
# le IMMAGINI non finiscono in un archivio completo ogni notte (1,8 GB di JPEG e WebP che non si
# comprimono, per 90 giorni, farebbero circa 160 GB), ma in una copia incrementale.
#
# Cosa salva:
#   1. dump del database, cifrato            (account, sali, impostazioni: va cifrato)
#   2. wp-content SENZA uploads, cifrato     (plugin, temi, mu-plugin: pochi MB)
#   3. .env, cifrato                          (i token condivisi con Vercel)
#   4. uploads, in chiaro e incrementale      (sono le immagini gia' pubbliche del sito)
#
# Uso (dalla cartella dello stack, via cron, vedi in fondo):
#   BACKUP_PASSPHRASE_FILE=/root/.platinatore-backup-pass ./backup.sh
set -euo pipefail
cd "$(dirname "$0")"

BACKUP_DIR="${BACKUP_DIR:-/var/backups/platinatore-cms}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"        # copie locali: il disco e' di 40 GB
OFFSITE_RETENTION_DAYS="${OFFSITE_RETENTION_DAYS:-90}"
PASS_FILE="${BACKUP_PASSPHRASE_FILE:?Imposta BACKUP_PASSPHRASE_FILE (file con la passphrase, chmod 600)}"

[ -f "$PASS_FILE" ] || { echo "ERRORE: passphrase '$PASS_FILE' non trovata" >&2; exit 1; }
[ -f .env ]         || { echo "ERRORE: .env non trovato" >&2; exit 1; }
DB_ROOT_PASSWORD=$(grep -E '^DB_ROOT_PASSWORD=' .env | cut -d= -f2-)
STORAGE_BOX=$(grep -E '^STORAGE_BOX=' .env | cut -d= -f2- || true)

STAMP=$(date +%F-%H%M%S)
DEST="$BACKUP_DIR/$STAMP"
mkdir -p "$DEST"
chmod 700 "$BACKUP_DIR"
enc() { gpg --batch --yes --symmetric --cipher-algo AES256 --passphrase-file "$PASS_FILE" -o "$1"; }

echo "[backup] $STAMP inizio"

# 1. database
docker compose exec -T db mariadb-dump -u root -p"$DB_ROOT_PASSWORD" \
  --all-databases --single-transaction --quick --routines --events \
  | gzip | enc "$DEST/db.sql.gz.gpg"
echo "[backup] db ok ($(du -h "$DEST/db.sql.gz.gpg" | cut -f1))"

# 2. wp-content senza uploads e senza cache
docker compose exec -T wp tar -czf - \
  --exclude=./uploads --exclude=./cache --exclude=./upgrade \
  -C /var/www/html/wp-content . | enc "$DEST/wp-content.tar.gz.gpg"
echo "[backup] wp-content ok ($(du -h "$DEST/wp-content.tar.gz.gpg" | cut -f1))"

# 3. segreti dello stack
enc "$DEST/env.gpg" < .env
( cd "$DEST" && sha256sum ./*.gpg > SHA256SUMS )

# rotazione locale
find "$BACKUP_DIR" -mindepth 1 -maxdepth 1 -type d -mtime +"$RETENTION_DAYS" -exec rm -rf {} +

if [ -z "$STORAGE_BOX" ]; then
  echo "[backup] ATTENZIONE: STORAGE_BOX vuota, backup SOLO locale" >&2
  exit 0
fi

# 4. copia off-site. La cartella base del sotto-account e' gia' /ilplatinatore/.
#    NIENTE --delete: una cartella locale svuotata per errore cancellerebbe anche le copie fuori.
rsync -a -e 'ssh -p 23' "$DEST" "$STORAGE_BOX:archivi/" 2>/dev/null \
  || { ssh -p 23 "$STORAGE_BOX" mkdir archivi; rsync -a -e 'ssh -p 23' "$DEST" "$STORAGE_BOX:archivi/"; }
echo "[backup] archivi copiati su $STORAGE_BOX:archivi/$STAMP"

# immagini: si copiano solo le nuove o cambiate. Il volume e' montato da docker: si legge dal
# percorso del volume sull'host.
UPLOADS=$(docker volume inspect -f '{{ .Mountpoint }}' "$(basename "$PWD")_wp-data")/wp-content/uploads
rsync -a -e 'ssh -p 23' "$UPLOADS/" "$STORAGE_BOX:uploads/"
echo "[backup] immagini sincronizzate su $STORAGE_BOX:uploads/"

# potatura off-site: la shell della Storage Box non ha `find`, quindi si decide da qui leggendo
# la data dal nome della cartella
LIMITE=$(date -d "-${OFFSITE_RETENTION_DAYS} days" +%Y-%m-%d)
for vecchia in $(ssh -p 23 "$STORAGE_BOX" "ls archivi" 2>/dev/null | tr -d '\r'); do
  case "$vecchia" in
    [0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]-*)
      if [ "${vecchia%-*}" \< "$LIMITE" ]; then
        ssh -p 23 "$STORAGE_BOX" "rm -rf archivi/$vecchia" && echo "[backup] potata archivi/$vecchia"
      fi ;;
  esac
done

# segnale di vita per l'allarme «uomo morto» (healthchecks.io): se non arriva, scatta l'allarme
HC=$(grep -E '^HEALTHCHECK_URL=' .env | cut -d= -f2- || true)
[ -n "$HC" ] && curl -fsS -m 10 --retry 3 "$HC" >/dev/null || true

echo "[backup] $STAMP completato"

# --- Cron (crontab -e, come root) ---------------------------------------------------------
#   20 3 * * *  cd /opt/platinatore-cms && BACKUP_PASSPHRASE_FILE=/root/.platinatore-backup-pass ./backup.sh >> /var/log/platinatore-backup.log 2>&1
#   0 4 * * 1   cd /opt/platinatore-cms && BACKUP_PASSPHRASE_FILE=/root/.platinatore-backup-pass ./restore-test.sh >> /var/log/platinatore-restore-test.log 2>&1
