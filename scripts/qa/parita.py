"""Parita' fra il sito di oggi (Aruba) e il sito nuovo, su TUTTI gli indirizzi (Fase 6, punto 2).

Solo letture, su entrambi i lati. Per ogni indirizzo confronta:
  stato HTTP e destinazione dei rimandi; titolo; descrizione; robots (sul sito nuovo quello che dira'
  dopo il passaggio, meta platinatore-robots-dopo); canonical; og:title, og:description, og:url,
  og:type, og:image; date di pubblicazione e modifica; tipi degli schemi JSON-LD; testo principale
  (quota dei paragrafi dell'articolo di oggi che si ritrovano nella pagina nuova).
Per le sitemap: lo stesso elenco di indirizzi con le stesse date.

Indirizzi: l'inventario della Fase 0, piu' quelli delle sitemap di oggi (articoli nuovi), piu' i
casi speciali (archivi per data, link brevi, ricerca, feed, file).

Le differenze VOLUTE si dichiarano in VOLUTE, con la ragione. Tutto il resto e' un problema.

Uso:
  python -I scripts/qa/parita.py https://ilplatinatore.vercel.app
  python -I scripts/qa/parita.py https://ilplatinatore.vercel.app --solo 200    (i primi 200, per prova)
Esce con 1 se c'e' anche una sola differenza non dichiarata. Rapporto in scripts/qa/out/parita.json.
"""

import csv
import html
import json
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

RADICE = Path(__file__).resolve().parents[2]
OUT = RADICE / "scripts" / "qa" / "out"
VIVO = "https://www.ilplatinatore.it"
UA = "Mozilla/5.0 (platinatore-parita)"

# differenze volute: campo -> ragione (vale per tutti gli indirizzi)
# Differenze VOLUTE, decise con l'utente: (regola sull'indirizzo e sulla pagina nuova, campi, ragione).
# Una differenza non coperta da una regola e' un problema.
def _hub(url, hn):
    return "/tag/" in url and '"VideoGame"' in hn


def _tag(url, hn):
    return "/tag/" in url


def _sempre(url, hn):
    return True


def _noindex(url, hn):
    return "?s=" in url or re.search(r"\.it/\d{4}/(\d{1,2}/)?(\d{1,2}/)?(page/\d+/)?$", url) is not None


VOLUTE = [
    (_sempre, {"stato:308"},
     "308 al posto di 301, stessa destinazione: per Google sono equivalenti (entrambi permanenti)"),
    (lambda u, h: u.endswith("/embed/") or u.endswith("/comments/feed/"), {"stato", "rimando"},
     "Fase 1: /embed/ rimanda all'articolo e /comments/feed/ al feed (il sito non ha commenti)"),
    (_noindex, {"schema", "og:title", "og:type", "og:url", "og:description"},
     "ricerca e archivi per data: pagine noindex, schema e metadati social non riprodotti"),
    (lambda u, h: u.endswith("/author-sitemap.xml") or u.endswith("/sitemap_index.xml"), {"sitemap:lastmod:autore"},
     "lastmod dell'autore: Yoast usa la data del profilo, che la REST non espone"),
    (lambda u, h: '"@type":"Review"' in h, {"schema"},
     "recensioni: dati strutturati Review col voto in piu' (novita' del 20/10/2026, oggi su Aruba non ci sono)"),
    (lambda u, h: u.endswith("/privacy-policy/"), {"og:description"},
     "privacy: Yoast accorcia il riassunto solo nella pagina, la REST lo da' intero"),
    (_hub, {"titolo", "og:title", "descrizione", "og:description", "schema"},
     "hub del gioco (piano 04, Fase 0 punto 5): titolo e descrizione nuovi, schema con il gioco e l'elenco delle guide"),
    (_tag, {"descrizione", "og:description"},
     "pagine dei tag (piano 07): descrizione per Google generata dalla scheda del gioco, oggi assente"),
]


class SenzaRimandi(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, *a, **k):
        return None


APRI = urllib.request.build_opener(SenzaRimandi)


def scarica(url, tentativi=3):
    for n in range(tentativi):
        try:
            with APRI.open(urllib.request.Request(url, headers={"User-Agent": UA}), timeout=60) as r:
                return r.status, r.headers.get("Location"), r.read().decode("utf-8", "replace")
        except urllib.error.HTTPError as e:
            if e.code in (301, 302, 307, 308, 404, 410, 403, 400):
                corpo = e.read().decode("utf-8", "replace") if e.code >= 400 else ""
                return e.code, e.headers.get("Location"), corpo
            if n == tentativi - 1:
                return e.code, None, ""
        except Exception:
            if n == tentativi - 1:
                return 0, None, ""
        time.sleep(3 * (n + 1))


def meta(h, chiave, attr="property"):
    for m in re.finditer(r"<meta\s[^>]*>", h, re.I):
        t = m.group(0)
        if re.search(rf"""{attr}\s*=\s*["']{re.escape(chiave)}["']""", t, re.I):
            c = re.search(r"""content\s*=\s*(["'])(.*?)\1""", t, re.I | re.S)
            return html.unescape(c.group(2)).strip() if c else ""
    return None


def link(h, rel):
    for m in re.finditer(r"<link\s[^>]*>", h, re.I):
        t = m.group(0)
        if re.search(rf"""rel\s*=\s*["']{rel}["']""", t, re.I):
            c = re.search(r"""href\s*=\s*(["'])(.*?)\1""", t, re.I)
            return html.unescape(c.group(2)) if c else ""
    return None


def tipi_schema(h):
    tipi = []
    for blocco in re.findall(r"""<script[^>]*application/ld\+json[^>]*>(.*?)</script>""", h, re.S | re.I):
        try:
            d = json.loads(blocco)
        except ValueError:
            tipi.append("JSON-ROTTO")
            continue
        for n in (d.get("@graph") if isinstance(d, dict) and "@graph" in d else d if isinstance(d, list) else [d]):
            t = n.get("@type") if isinstance(n, dict) else None
            tipi += t if isinstance(t, list) else [t] if t else []
    return sorted(tipi)


def testo(s):
    s = re.sub(r"<(script|style)[\s\S]*?</\1>", " ", s, flags=re.I)
    s = html.unescape(re.sub(r"<[^>]+>", " ", s))
    return re.sub(r"\s+", " ", s.replace("’", "'").replace(" ", " ")).strip().lower()


def paragrafi(h):
    return [t for t in (testo(p) for p in re.findall(r"<(?:p|li|h2|h3|td)[^>]*>([\s\S]*?)</(?:p|li|h2|h3|td)>", h, re.I)) if len(t) >= 40]


def corpo_vivo(h):
    """Il corpo dell'articolo nel tema di oggi: dal riquadro dell'articolo ai correlati.

    Senza la tabella riassuntiva del Platino e il suo titolo: sul sito nuovo diventano la scheda in
    testa (piano 01), con i valori riformattati («6,5/10», ore sole e spiegazioni nella nota).
    """
    i = h.find('class="bs-blog-post single')
    j = h.find("bs-related-post-info", i if i >= 0 else 0)
    corpo = h[i:j] if i >= 0 and j > i else ""
    def via(m):
        prima = re.search(r"<t[hd][^>]*>([\s\S]*?)</t[hd]>", m.group(0))
        return "" if prima and re.match(r"\s*(informazion|requisit)", testo(prima.group(1))) else m.group(0)
    corpo = re.sub(r"(?:<h[23][^>]*>(?:(?!</h[23]>)[\s\S])*</h[23]>\s*)?(?:<figure[^>]*>\s*)?<table[\s\S]*?</table>", via, corpo)
    return corpo


def campi(h, nuovo):
    titolo = re.search(r"<title[^>]*>([\s\S]*?)</title>", h, re.I)
    robots = meta(h, "platinatore-robots-dopo", "name") if nuovo else meta(h, "robots", "name")
    if nuovo and robots is None:
        robots = meta(h, "robots", "name")
    return {
        "titolo": html.unescape(titolo.group(1)).strip() if titolo else None,
        "descrizione": meta(h, "description", "name"),
        "robots": (robots or "").replace(" ", ""),
        "canonical": link(h, "canonical"),
        "og:title": meta(h, "og:title"),
        "og:description": meta(h, "og:description"),
        "og:url": meta(h, "og:url"),
        "og:type": meta(h, "og:type"),
        "og:image": meta(h, "og:image"),
        "article:published_time": meta(h, "article:published_time"),
        "article:modified_time": meta(h, "article:modified_time"),
        "schema": tipi_schema(h),
    }


def indirizzi():
    tutti = {}
    with open(RADICE / "docs" / "analisi" / "inventario-url.csv", encoding="utf-8") as f:
        for r in csv.DictReader(f):
            tutti[r["url"]] = r["tipo"]
    # le sitemap di oggi: gli articoli pubblicati dopo l'inventario
    _, _, indice = scarica(f"{VIVO}/sitemap_index.xml")
    for sm in re.findall(r"<loc>([^<]+)</loc>", indice):
        _, _, corpo = scarica(html.unescape(sm))
        for u in re.findall(r"<loc>([^<]+)</loc>", corpo):
            u = html.unescape(u)
            if "/wp-content/" not in u:
                tutti.setdefault(u, "articolo" if re.search(r"/\d{4}/\d{2}/\d{2}/", u) else "dalla-sitemap")
    for p, tipo in [
        ("/2026/", "archivio-data"), ("/2026/10/", "archivio-data"), ("/2026/10/15/", "archivio-data"),
        ("/2026/10/page/2/", "archivio-data"), ("/2026/13/", "archivio-data"), ("/2024/", "archivio-data"),
        ("/?s=valor+mortis", "ricerca"), ("/?p=6116", "shortlink"), ("/llms.txt", "file"),
        ("/valor-mortis-collezionabili-capitolo-3/", "slug-senza-data"), ("/page/1/", "home-paginazione"),
        ("/category/guide", "senza-barra"), ("/pagina-che-non-esiste-davvero/", "404"),
        ("/2026/10/15/valor-mortis-collezionabili-capitolo-3/embed/", "embed"),
    ]:
        tutti.setdefault(VIVO + p, tipo)
    return tutti


def confronta(url, tipo, nuovo_base):
    esito = _confronta(url, tipo, nuovo_base)
    esito["volute"] = {}
    for regola, campi_voluti, ragione in VOLUTE:
        if regola(url, esito.get("_hn", "")):
            for k in list(esito["diff"]):
                if k in campi_voluti:
                    esito["volute"][k] = ragione
                    del esito["diff"][k]
    esito.pop("_hn", None)
    return esito


def _confronta(url, tipo, nuovo_base):
    percorso = url[len(VIVO):] or "/"
    sv, lv, hv = scarica(url)
    sn, ln, hn = scarica(nuovo_base + percorso)
    norm = lambda s: s.replace(nuovo_base, VIVO) if isinstance(s, str) else s
    diff = {}
    if {sv, sn} == {301, 308}:
        diff["stato:308"] = (sv, sn)
    elif sv != sn:
        diff["stato"] = (sv, sn)
    if sv in (301, 302, 307, 308) or sn in (301, 302, 307, 308):
        dv = (lv or "").replace(VIVO, "")
        dn = norm(ln or "").replace(VIVO, "")
        if dv != dn:
            diff["rimando"] = (lv, ln)
    elif sv == 200 and sn == 200:
        if percorso.endswith(".xml"):
            locv = re.findall(r"<loc>([^<]+)</loc>\s*(?:<lastmod>([^<]+)</lastmod>)?", hv)
            locn = re.findall(r"<loc>([^<]+)</loc>\s*(?:<lastmod>([^<]+)</lastmod>)?", norm(hn))
            if sorted(l for l, _ in locv) != sorted(l for l, _ in locn):
                diff["sitemap:indirizzi"] = (len(locv), len(locn), sorted(set(l for l, _ in locv) ^ set(l for l, _ in locn))[:5])
            dv, dn = dict(locv), dict(locn)
            date = [l for l in dv if l in dn and dv[l] != dn[l]]
            autore = [l for l in date if "/author" in l]
            date = [l for l in date if l not in autore]
            if autore:
                diff["sitemap:lastmod:autore"] = [(l, dv[l], dn[l]) for l in autore]
            if date:
                diff["sitemap:lastmod"] = (len(date), [(l, dv[l], dn[l]) for l in date[:3]])
        elif "<html" in hv.lower():
            cv, cn = campi(hv, False), campi(norm(hn), True)
            # «Δ» e «%CE%94» sono lo stesso indirizzo
            for c in (cv, cn):
                if c.get("og:image"):
                    c["og:image"] = urllib.parse.unquote(c["og:image"])
            for k in cv:
                if cv[k] != cn[k]:
                    diff[k] = (cv[k], cn[k])
            if tipo == "articolo":
                pv = paragrafi(corpo_vivo(hv))
                tn = testo(hn)
                if pv:
                    trovati = sum(1 for p in pv if p in tn)
                    if trovati / len(pv) < 0.95:
                        diff["testo"] = (f"{trovati}/{len(pv)} paragrafi ritrovati", [p[:90] for p in pv if p not in tn][:2])
    return {"url": url, "tipo": tipo, "diff": diff, "_hn": hn}


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        return 2
    nuovo = sys.argv[1].rstrip("/")
    solo = int(sys.argv[sys.argv.index("--solo") + 1]) if "--solo" in sys.argv else None
    OUT.mkdir(parents=True, exist_ok=True)
    tutti = indirizzi()
    voci = sorted(tutti.items())[:solo] if solo else sorted(tutti.items())
    print(f"Sito di oggi: {VIVO}\nSito nuovo:   {nuovo}\nIndirizzi:    {len(voci)}\n")
    # il sito su Aruba e' un hosting condiviso: poche richieste alla volta
    with ThreadPoolExecutor(4) as ex:
        esiti = list(ex.map(lambda v: confronta(v[0], v[1], nuovo), voci))
    volute = {}
    for e in esiti:
        for k, ragione in e["volute"].items():
            volute.setdefault(ragione, set()).add(e["url"])
    if volute:
        print("Differenze volute (dichiarate, non contano):")
        for ragione, urls in volute.items():
            print(f"  {len(urls):5} indirizzi: {ragione}")
        print()
    problemi = [e for e in esiti if e["diff"]]
    per_campo = {}
    for e in problemi:
        for k in e["diff"]:
            per_campo.setdefault(k, []).append(e["url"])
    print("Differenze per campo:")
    for k, urls in sorted(per_campo.items(), key=lambda x: -len(x[1])):
        print(f"  {k:28} {len(urls):5}   es. {urls[0]}")
        print(f"  {'':28}         {json.dumps(next(e for e in problemi if e['url'] == urls[0])['diff'][k], ensure_ascii=False)[:300]}")
    (OUT / "parita.json").write_text(json.dumps({"vivo": VIVO, "nuovo": nuovo, "indirizzi": len(voci), "problemi": problemi},
                                                ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"\n{len(problemi)} indirizzi con differenze su {len(voci)}. Rapporto: {OUT / 'parita.json'}")
    return 1 if problemi else 0


if __name__ == "__main__":
    sys.exit(main())
