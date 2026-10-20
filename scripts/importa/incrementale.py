"""Importazione incrementale da Aruba al CMS su Hetzner (Fase 6, e di nuovo al passaggio).

Aruba si LEGGE soltanto (REST con la password applicativa di sola lettura, `.env.segreti`).
Si scrive solo sul CMS di Hetzner, con wp-cli (`infra/cms/importa-incrementale.php`).

Non si fida delle date di modifica: confronta campo per campo ogni articolo e ogni pagina dei due
lati (titolo, testo, riassunto, slug, stato, date, autore, categorie, tag, immagine in evidenza,
in evidenza, formato, campi di Yoast). Crea cio' che manca, aggiorna cio' che e' diverso, conserva
gli ID di Aruba e i campi del prototipo (pl_*) del CMS di lavoro. Le immagini mancanti sul disco del
CMS (file originale e misure) si scaricano da Aruba e si copiano senza sovrascrivere nulla.

Uso:
  python -I scripts/importa/incrementale.py                 prova: dice che cosa cambierebbe
  python -I scripts/importa/incrementale.py --applica       scrive sul CMS di Hetzner
  python -I scripts/importa/incrementale.py --applica --cestina
                                                            in piu' cestina sul CMS gli articoli che su
                                                            Aruba non esistono piu' (al passaggio)
Rapporto in scripts/importa/out/. Esce con 1 se qualcosa non torna.
"""

import base64
import json
import os
import re
import subprocess
import sys
import tarfile
import time
import urllib.error
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

RADICE = Path(__file__).resolve().parents[2]
OUT = RADICE / "scripts" / "importa" / "out"
CMS = "https://cms.ilplatinatore.it"
SERVER = "platinatore-cms"
CARTELLA_SERVER = "/opt/platinatore-cms"
STATI = "publish,future,draft,pending,private"
DOMINI_VECCHI = ("https://www.ilplatinatore.it", "https://ilplatinatore.it")
RX_UPLOAD = re.compile(r"https://cms\.ilplatinatore\.it/wp-content/uploads/([^\"'\s)<>?#]+)")


def segreti():
    d = {}
    for riga in (RADICE / ".env.segreti").read_text(encoding="utf-8").splitlines():
        if "=" in riga and not riga.startswith("#"):
            k, v = riga.split("=", 1)
            d[k.strip()] = v.strip().strip('"')
    return d


S = segreti()
ARUBA = S["WP_PROD_URL"].rstrip("/")
AUTH_ARUBA = "Basic " + base64.b64encode(f"{S['WP_PROD_USER']}:{S['WP_PROD_APP_PASSWORD']}".encode()).decode()
AUTH_CMS = "Basic " + base64.b64encode(f"{S['CMS_USER']}:{S['CMS_APP_PASSWORD']}".encode()).decode()


def richiesta(url, auth=None, metodo="GET", tentativi=3):
    intest = {"User-Agent": "Mozilla/5.0 (platinatore-importazione)"}
    if auth:
        intest["Authorization"] = auth
    for n in range(tentativi):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=intest, method=metodo), timeout=90) as r:
                return r.status, dict(r.headers), r.read()
        except urllib.error.HTTPError as e:
            if e.code in (404, 400, 401, 403):
                return e.code, dict(e.headers), b""
            if n == tentativi - 1:
                raise
        except (urllib.error.URLError, TimeoutError):
            if n == tentativi - 1:
                raise
        time.sleep(2 * (n + 1))


def tutte(base, percorso, auth):
    """Tutte le pagine di una lista REST."""
    out, pagina = [], 1
    while True:
        sep = "&" if "?" in percorso else "?"
        stato, intest, corpo = richiesta(f"{base}/wp-json/wp/v2/{percorso}{sep}per_page=100&page={pagina}", auth)
        if stato != 200:
            raise SystemExit(f"{base} {percorso}: risposta {stato}")
        out += json.loads(corpo)
        if pagina >= int(intest.get("X-WP-TotalPages") or intest.get("X-Wp-Totalpages") or 1):
            return out
        pagina += 1


def a_cms(testo):
    for d in DOMINI_VECCHI:
        testo = (testo or "").replace(d, CMS)
    return testo


def minuti_lettura(y):
    v = ((y or {}).get("twitter_misc") or {}).get("Tempo di lettura stimato", "")
    m = re.match(r"(\d+)", v)
    return m.group(1) if m else None


def forma(p, tipo, cat, tag, da_aruba):
    """Un articolo o una pagina nella forma confrontabile (e applicabile)."""
    meta = {k: v for k, v in (p.get("meta") or {}).items() if k.startswith("_yoast_wpseo_") or k == "footnotes"}
    return {
        "id": p["id"],
        "tipo": tipo,
        "titolo": p["title"]["raw"],
        "contenuto": a_cms(p["content"]["raw"]) if da_aruba else p["content"]["raw"],
        "riassunto": p.get("excerpt", {}).get("raw", ""),
        "slug": p["slug"],
        "stato": p["status"],
        "autore": p["author"],
        "data": p["date"],
        "data_gmt": p.get("date_gmt"),
        "commenti": p.get("comment_status", "closed"),
        "ping": p.get("ping_status", "closed"),
        "password": p.get("password", ""),
        "categorie": sorted(cat[c] for c in p.get("categories", []) if c in cat),
        "tag": sorted(tag[t] for t in p.get("tags", []) if t in tag),
        "immagine": p.get("featured_media", 0),
        "in_evidenza": bool(p.get("sticky", False)),
        "formato": p.get("format", "standard"),
        "meta": meta,
        "modifica": p["modified"],
        "modifica_gmt": p["modified_gmt"],
    }


CONFRONTATI = ["titolo", "contenuto", "riassunto", "slug", "stato", "autore", "data", "data_gmt", "commenti", "ping",
               "password", "categorie", "tag", "immagine", "in_evidenza", "formato"]


def differenze(a, h):
    campi = [c for c in CONFRONTATI if a[c] != h[c]]
    # le bozze mai pubblicate non hanno data GMT su uno dei due lati: non e' una differenza
    if "data_gmt" in campi and a["stato"] in ("draft", "pending") and not (a["data_gmt"] and h["data_gmt"]):
        campi.remove("data_gmt")
    campi += [f"meta:{k}" for k, v in a["meta"].items() if (h["meta"].get(k) or "") != (v or "")]
    return campi


def metadati_media(m):
    md = dict(m.get("media_details") or {})
    taglie = {}
    for nome, t in (md.pop("sizes", None) or {}).items():
        if nome == "full":
            continue
        taglie[nome] = {"file": t["file"], "width": t["width"], "height": t["height"],
                        "mime-type": t.get("mime_type", m.get("mime_type")), "filesize": t.get("filesize")}
    if taglie or "width" in md:
        md["sizes"] = taglie
    return md


def file_media(m):
    """Tutti i file di un allegato, come percorsi relativi a uploads/."""
    md = m.get("media_details") or {}
    principale = md.get("file") or urllib.parse.urlparse(m["source_url"]).path.split("/wp-content/uploads/", 1)[-1]
    cartella = principale.rsplit("/", 1)[0] + "/" if "/" in principale else ""
    files = {principale}
    for nome, t in (md.get("sizes") or {}).items():
        if nome != "full" and t.get("file"):
            files.add(cartella + t["file"])
    if md.get("original_image"):
        files.add(cartella + md["original_image"])
    return principale, files


def esiste_sul_cms(rel):
    stato, _, _ = richiesta(f"{CMS}/wp-content/uploads/{urllib.parse.quote(urllib.parse.unquote(rel))}", metodo="HEAD")
    return stato == 200


def ssh(comando):
    r = subprocess.run(["ssh", SERVER, comando], capture_output=True, text=True, encoding="utf-8")
    if r.returncode != 0:
        raise SystemExit(f"[server] errore:\n{r.stdout}\n{r.stderr}")
    return r.stdout


def main():
    applica = "--applica" in sys.argv
    cestina = "--cestina" in sys.argv
    OUT.mkdir(parents=True, exist_ok=True)
    print(f"Aruba (sola lettura): {ARUBA}\nCMS (scrittura {'SI' if applica else 'no, prova'}): {CMS}\n")

    print("[1] termini")
    termini = {}
    for tax, risorsa in (("category", "categories"), ("post_tag", "tags")):
        a = tutte(ARUBA, f"{risorsa}?context=view&hide_empty=false&_fields=id,name,slug,description,parent", AUTH_ARUBA)
        h = tutte(CMS, f"{risorsa}?context=view&hide_empty=false&_fields=id,slug", AUTH_CMS)
        termini[tax] = {"a": {t["id"]: t for t in a}, "h_slug": {t["slug"] for t in h}, "h": {t["id"]: t["slug"] for t in h}}
        print(f"    {tax}: Aruba {len(a)}, CMS {len(h)}")
    cat_a = {i: t["slug"] for i, t in termini["category"]["a"].items()}
    tag_a = {i: t["slug"] for i, t in termini["post_tag"]["a"].items()}
    termini_nuovi = []
    for tax in ("category", "post_tag"):
        ta = termini[tax]["a"]
        for t in ta.values():
            if t["slug"] not in termini[tax]["h_slug"]:
                genitore = ta.get(t.get("parent") or 0, {}).get("slug", "")
                termini_nuovi.append({"tassonomia": tax, "nome": t["name"], "slug": t["slug"],
                                      "descrizione": a_cms(t.get("description", "")), "genitore": genitore})
    solo_cms_termini = [f"{tax}:{s}" for tax in termini for s in termini[tax]["h_slug"]
                        if s not in {t["slug"] for t in termini[tax]["a"].values()}]
    print(f"    da creare: {len(termini_nuovi)} | solo sul CMS: {len(solo_cms_termini)}")

    print("[2] articoli e pagine (testo completo dei due lati)")
    piano, solo_cms = [], []
    cat_h = termini["category"]["h"]
    tag_h = termini["post_tag"]["h"]
    for tipo, risorsa in (("post", "posts"), ("page", "pages")):
        lato_a = {p["id"]: forma(p, tipo, cat_a, tag_a, True)
                  for p in tutte(ARUBA, f"{risorsa}?context=edit&status={STATI}", AUTH_ARUBA)}
        grezzi_a = {p["id"]: p for p in tutte(ARUBA, f"{risorsa}?context=view&status=publish&_fields=id,yoast_head_json", AUTH_ARUBA)}
        lato_h = {p["id"]: forma(p, tipo, cat_h, tag_h, False)
                  for p in tutte(CMS, f"{risorsa}?context=edit&status={STATI}", AUTH_CMS)}
        for i, a in lato_a.items():
            minuti = minuti_lettura((grezzi_a.get(i) or {}).get("yoast_head_json"))
            if minuti and tipo == "post":
                a["meta"]["_yoast_wpseo_estimated-reading-time-minutes"] = minuti
            a["categoria_principale"] = a["categorie"][0] if len(a["categorie"]) == 1 else ""
            if i not in lato_h:
                piano.append(("crea", a, []))
            else:
                diff = [d for d in differenze(a, lato_h[i]) if d != "meta:_yoast_wpseo_estimated-reading-time-minutes"]
                if diff:
                    piano.append(("aggiorna", a, diff))
        solo_cms += [(tipo, i, h["slug"], h["stato"]) for i, h in lato_h.items() if i not in lato_a]
        print(f"    {risorsa}: Aruba {len(lato_a)}, CMS {len(lato_h)}")
    crea = [a for azione, a, _ in piano if azione == "crea"]
    aggiorna = [(a, d) for azione, a, d in piano if azione == "aggiorna"]
    print(f"    da creare: {len(crea)} ({', '.join(f'{s}: {sum(1 for a in crea if a['stato'] == s)}' for s in sorted({a['stato'] for a in crea}))})")
    print(f"    da aggiornare: {len(aggiorna)}")
    for a, d in aggiorna:
        print(f"      {a['id']} {a['slug'][:55]}: {', '.join(d)}")
    print(f"    sul CMS ma non su Aruba: {len(solo_cms)} {solo_cms[:10]}")

    print("[3] immagini")
    media_a = {m["id"] for m in tutte(ARUBA, "media?context=view&_fields=id", AUTH_ARUBA)}
    media_h = {m["id"] for m in tutte(CMS, "media?context=view&_fields=id", AUTH_CMS)}
    nuovi_id = sorted(media_a - media_h)
    media_nuovi, file_da_avere = [], set()
    for k in range(0, len(nuovi_id), 100):
        blocco = ",".join(map(str, nuovi_id[k:k + 100]))
        for m in tutte(ARUBA, f"media?context=edit&include={blocco}", AUTH_ARUBA):
            principale, files = file_media(m)
            file_da_avere |= files
            media_nuovi.append({
                "id": m["id"], "titolo": m["title"]["raw"], "didascalia": a_cms(m.get("caption", {}).get("raw", "")),
                "descrizione": a_cms(m.get("description", {}).get("raw", "")), "alt": m.get("alt_text", ""),
                "mime": m["mime_type"], "autore": m["author"], "genitore": m.get("post") or 0,
                "data": m["date"], "data_gmt": m["date_gmt"], "modifica": m["modified"], "modifica_gmt": m["modified_gmt"],
                "slug": m["slug"], "file": principale, "metadati": metadati_media(m),
            })
    # i file citati nel testo degli articoli da creare o aggiornare
    for a in crea + [a for a, _ in aggiorna]:
        file_da_avere |= set(RX_UPLOAD.findall(a["contenuto"]))
    with ThreadPoolExecutor(8) as ex:
        presenti = dict(zip(sorted(file_da_avere), ex.map(esiste_sul_cms, sorted(file_da_avere))))
    mancanti = [f for f, ok in presenti.items() if not ok]
    immagini_evidenza = {a["immagine"] for a in crea + [a for a, _ in aggiorna] if a["immagine"]}
    evidenza_assenti = sorted(immagini_evidenza - media_h - set(nuovi_id))
    print(f"    allegati nuovi: {len(media_nuovi)} | file controllati: {len(file_da_avere)}, mancanti sul disco del CMS: {len(mancanti)}")
    if evidenza_assenti:
        print(f"    ATTENZIONE immagini in evidenza che non esistono da nessuna parte: {evidenza_assenti}")

    pacchetto = {
        "termini_nuovi": termini_nuovi,
        "media_nuovi": media_nuovi,
        "articoli": crea + [a for a, _ in aggiorna],
    }
    ora = time.strftime("%Y%m%d-%H%M%S")
    rapporto = {
        "quando": ora, "applicato": applica, "termini_nuovi": [f"{t['tassonomia']}:{t['slug']}" for t in termini_nuovi],
        "termini_solo_cms": solo_cms_termini, "creati": [(a["id"], a["tipo"], a["stato"], a["slug"]) for a in crea],
        "aggiornati": [(a["id"], a["slug"], d) for a, d in aggiorna], "solo_cms": solo_cms,
        "media_nuovi": [m["id"] for m in media_nuovi], "file_mancanti": mancanti, "evidenza_assenti": evidenza_assenti,
    }
    (OUT / f"rapporto-{ora}.json").write_text(json.dumps(rapporto, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"\nRapporto: {OUT / f'rapporto-{ora}.json'}")

    if not applica:
        print("Prova: nulla e' stato scritto. Per applicare: --applica")
        return 0
    if evidenza_assenti:
        print("Fermo: prima va capito perche' mancano immagini in evidenza.")
        return 1

    print("\n[4] file mancanti: da Aruba al disco del CMS (senza sovrascrivere)")
    locale = OUT / f"uploads-{ora}"
    for rel in mancanti:
        stato, _, corpo = richiesta(f"{ARUBA}/wp-content/uploads/{urllib.parse.quote(urllib.parse.unquote(rel))}")
        if stato != 200:
            print(f"    non scaricato da Aruba ({stato}): {rel}")
            continue
        dest = locale / rel
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_bytes(corpo)
    pacchetto_file = OUT / f"pacchetto-{ora}.json"
    pacchetto_file.write_text(json.dumps(pacchetto, ensure_ascii=False), encoding="utf-8")
    archivio = OUT / f"uploads-{ora}.tar.gz"
    with tarfile.open(archivio, "w:gz") as tar:
        if locale.exists():
            tar.add(locale, arcname="uploads")
    dir_server = f"{CARTELLA_SERVER}/import/incrementale"
    ssh(f"rm -rf {dir_server} && mkdir -p {dir_server}")
    for sorgente, nome in ((archivio, "uploads.tar.gz"), (pacchetto_file, "pacchetto.json"),
                           (RADICE / "infra" / "cms" / "importa-incrementale.php", "importa-incrementale.php")):
        subprocess.run(["scp", "-q", str(sorgente), f"{SERVER}:{dir_server}/{nome}"], check=True)
    print(ssh(
        f"cd {CARTELLA_SERVER} && tar -xzf import/incrementale/uploads.tar.gz -C import/incrementale && "
        f"if [ -d import/incrementale/uploads ]; then docker run --rm -v \"$(basename $PWD)_wp-data\":/w "
        f"-v \"$PWD/import/incrementale/uploads\":/u:ro alpine sh -c 'cp -an /u/. /w/wp-content/uploads/ && "
        f"chown -R 33:33 /w/wp-content/uploads' && echo '    file copiati'; fi"
    ))

    print("[5] scrittura sul CMS")
    print(ssh(
        f"cd {CARTELLA_SERVER} && docker compose --profile strumenti run --rm -T cli "
        f"wp eval-file /import/incrementale/importa-incrementale.php /import/incrementale/pacchetto.json 2>&1"
    ))
    if cestina and solo_cms:
        ids = " ".join(str(i) for t, i, _, _ in solo_cms)
        print(ssh(f"cd {CARTELLA_SERVER} && docker compose --profile strumenti run --rm -T cli wp post delete {ids} 2>&1"))
    # il pacchetto contiene anche le bozze: non resta sul server
    ssh(f"rm -rf {dir_server}")
    print("Fatto. Rilancia senza --applica: deve dire 0 da creare e 0 da aggiornare.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
