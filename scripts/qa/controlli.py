"""Controlli automatici del sito, a ogni passaggio. Adattato da audit.py e reorg.py della landing
di Axialoop (sessione axialoop-claude, 16/10/2026).

Per ogni pagina e per tre larghezze (390, 1024, 1440 px):
  - accessibilita' con axe-core (WCAG 2.0/2.1/2.2 A e AA + best practice);
  - scorrimento orizzontale (deve essere 0);
  - un solo h1;
  - bersagli toccabili sotto i 44 px (solo da telefono);
  - noindex presente finche' il sito e' di prova;
  - schermata della pagina.

Uso:
  python -I scripts/qa/controlli.py https://ilplatinatore.vercel.app [--indicizzabile]
  python -I scripts/qa/controlli.py http://localhost:3123

Esce con 1 se c'e' anche un solo problema: un controllo che non puo' diventare rosso non e' un
controllo. Dichiara sempre contro quale indirizzo sta parlando.
"""
import json
import os
import sys

from playwright.sync_api import sync_playwright

QUI = os.path.dirname(os.path.abspath(__file__))
RADICE = os.path.dirname(os.path.dirname(QUI))
AXE = os.path.join(RADICE, "node_modules", "axe-core", "axe.min.js")
OUT = os.path.join(QUI, "out")

PAGINE = [
    "/",
    "/2026/10/13/valor-mortis-guida-platino-tutti-trofei/",
    "/2026/10/15/valor-mortis-collezionabili-capitolo-2/",
    "/tag/valor-mortis/",
    # la sfida: i tre formati (?f= li mostra tutti, oggi esce uno solo)
    "/sfida/?f=gioco",
    "/sfida/?f=trofeo",
    "/sfida/?f=classico",
    "/tag/crimson-desert/page/2/",
    "/category/guide/",
    "/privacy-policy/",
    "/pagina-che-non-esiste/",
]
LARGHEZZE = (("m", {"width": 390, "height": 844}), ("t", {"width": 1024, "height": 800}), ("d", {"width": 1440, "height": 900}))

PICCOLI = """() => [...document.querySelectorAll('a,button,input,select,[role=button],[role=checkbox]')].filter(e => {
  const r = e.getBoundingClientRect(); const s = getComputedStyle(e);
  if (!r.width || s.visibility === 'hidden' || e.closest('[inert],[aria-hidden=true]')) return false;
  if (e.closest('p,li,td,figcaption,h1,h2,h3,h4,h5,h6') && s.display === 'inline') return false;  // link dentro il testo
  return r.height < 44 || r.width < 24;
}).map(e => (e.innerText || e.getAttribute('aria-label') || e.tagName).trim().slice(0, 40) + ' ' +
  Math.round(e.getBoundingClientRect().width) + 'x' + Math.round(e.getBoundingClientRect().height))"""

AXE_RUN = """async () => (await axe.run(document, {runOnly: ['wcag2a','wcag2aa','wcag21aa','wcag22aa','best-practice']}))
  .violations.map(v => ({id: v.id, impact: v.impact, n: v.nodes.length,
    ex: v.nodes.slice(0, 2).map(n => n.target.join(' '))}))"""


def main() -> int:
    sys.stdout.reconfigure(encoding="utf-8")
    if len(sys.argv) < 2:
        print(__doc__)
        return 2
    base = sys.argv[1].rstrip("/")
    atteso_noindex = "--indicizzabile" not in sys.argv
    if not os.path.exists(AXE):
        print(f"manca {AXE}: npm install")
        return 2
    os.makedirs(OUT, exist_ok=True)
    print(f"Controlli contro {base} (noindex atteso: {'si' if atteso_noindex else 'no'})")

    rapporto, problemi = {}, 0
    with sync_playwright() as p:
        # Chrome installato: i browser di Playwright su questa macchina possono mancare
        browser = p.chromium.launch(channel=os.environ.get("QA_CHANNEL", "chrome"))
        try:
            for nome, vista in LARGHEZZE:
                ctx = browser.new_context(viewport=vista, has_touch=nome == "m", is_mobile=nome == "m", locale="it-IT")
                pagina = ctx.new_page()
                for percorso in PAGINE:
                    r = pagina.goto(base + percorso, wait_until="load", timeout=90_000)
                    pagina.add_script_tag(path=AXE)
                    axe = pagina.evaluate(AXE_RUN)
                    oltre = pagina.evaluate("document.documentElement.scrollWidth - document.documentElement.clientWidth")
                    # solo gli h1 visibili: le varianti nascoste dell'anteprima non esistono per lo screen reader
                    h1 = pagina.evaluate("[...document.querySelectorAll('h1')].filter(e => e.checkVisibility()).length")
                    piccoli = pagina.evaluate(PICCOLI) if nome == "m" else []
                    robots_meta = pagina.evaluate("document.querySelector('meta[name=robots]')?.content || ''")
                    robots_header = (r.headers.get("x-robots-tag", "") if r else "")
                    noindex = "noindex" in robots_meta or "noindex" in robots_header

                    voce = {"stato": r.status if r else None, "scorrimento": oltre, "h1": h1, "axe": axe,
                            "piccoli": piccoli[:8], "noindex": noindex}
                    rapporto[f"{nome} {percorso}"] = voce
                    errori = []
                    if oltre > 0:
                        errori.append(f"scorrimento orizzontale {oltre}px")
                    if h1 != 1:
                        errori.append(f"{h1} h1")
                    if axe:
                        errori.append("axe: " + ", ".join(f"{a['id']}({a['impact']},{a['n']})" for a in axe))
                    if piccoli:
                        errori.append(f"bersagli piccoli: {piccoli[:3]}")
                    if atteso_noindex and not noindex:
                        errori.append("NOINDEX MANCANTE")
                    problemi += len(errori)
                    print(f"{nome} {percorso:52} {voce['stato']} | " + ("ok" if not errori else " ; ".join(errori)))
                    file = (percorso.strip("/").replace("/", "_").replace("?", "_").replace("=", "") or "home") + f"-{nome}.png"
                    pagina.screenshot(path=os.path.join(OUT, file), full_page=False)
                ctx.close()
        finally:
            browser.close()  # uno script che apre un browser lo chiude, altrimenti si appende

    json.dump(rapporto, open(os.path.join(OUT, "rapporto.json"), "w", encoding="utf-8"), indent=1, ensure_ascii=False)
    print(f"\n{problemi} problemi. Rapporto e schermate in {OUT}")
    return 1 if problemi else 0


if __name__ == "__main__":
    sys.exit(main())
