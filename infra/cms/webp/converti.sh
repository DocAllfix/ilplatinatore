#!/bin/sh
# Versione WebP di ogni JPG e PNG caricato, accanto all'originale: foto.jpg -> foto.jpg.webp
# (lo stesso schema delle 433 gia' arrivate da Aruba). Il Worker delle immagini (infra/cloudflare/)
# la da' ai browser che leggono il WebP allo STESSO indirizzo dell'originale: per Google e per i
# link non cambia niente. Gli originali non si toccano mai.
#
# Gira dal cron del server ogni 10 minuti (un solo giro alla volta, con flock): converte solo cio'
# che manca o che e' piu' vecchio dell'originale. Qualita' 80, metadati di colore conservati.
# Uso: docker run --rm -v platinatore-cms_wp-data:/w -v /opt/platinatore-cms/webp/converti.sh:/c.sh:ro platinatore-webp sh /c.sh

U=/w/wp-content/uploads
LISTA=/tmp/da-convertire
find "$U" -type f \( -iname '*.jpg' -o -iname '*.jpeg' -o -iname '*.png' \) | while IFS= read -r f; do
  if [ ! -e "$f.webp" ] || [ "$f" -nt "$f.webp" ]; then printf '%s\n' "$f"; fi
done > "$LISTA"
n=$(wc -l < "$LISTA")
[ "$n" -eq 0 ] && exit 0
echo "$(date '+%F %T') da convertire: $n"
# due alla volta: il server resta libero per chi scrive
tr '\n' '\0' < "$LISTA" | xargs -0 -n 1 -P 2 sh -c '
  f="$1"; t="$f.webp.tmp"
  if cwebp -quiet -q 80 -m 4 -metadata icc "$f" -o "$t" 2>/dev/null; then
    chown 33:33 "$t" && mv "$t" "$f.webp"
  else
    rm -f "$t"; echo "non convertita: $f"
  fi' _
echo "$(date '+%F %T') fatto: $(find "$U" -type f -name '*.webp' | wc -l) file webp in tutto"
