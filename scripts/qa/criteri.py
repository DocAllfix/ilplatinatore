"""Fase 3: i criteri del PDF (sezione 10), provati in un browser vero, da telefono.

Ogni criterio gira DUE volte:
  - normale: deve essere verde;
  - con il suo guasto messo apposta (--rompi): deve diventare rosso. Un controllo che non sa
    diventare rosso non e' un controllo (regola del metodo, 02-piano-e-metodo.md).

Criteri:
  1  spunte: il contatore si aggiorna (trofei e collezionabili)
  2  spunte: restano dopo il ricaricamento
  3  hub: «Riprendi da dove eri» compare dopo una spunta
  4  ancore e barre non coprono i titoli («Come prenderlo» e Indice della pillola)
  5  tastiera: spunta con lo spazio, pillola con Invio, fuoco visibile
  6  non solo colore: «Completato» scritto, tentativi della sfida con etichette
  7  azzeramento: niente senza conferma, tutto dopo la conferma
  8  dati mancanti: articolo senza campi e tag che non e' un gioco, senza errori
  9  differenze fra versioni: le condizioni delle stime scritte nella scheda
  10 titoli lunghissimi (break-ui): niente scorrimento laterale a 360 px
  11 misure d'uso: gli eventi partono (spunta, riprendi, sfida, correlato, lettura)
  12 spoiler: nome nascosto, «Mostra spoiler» lo rivela (solo se un oggetto e' segnato spoiler)
  13 testata da tastiera: menu e ricerca si aprono con Invio, Esc li chiude (piano 07)
  14 tema chiaro/scuro: la scelta resta dopo il ricaricamento ed e' applicata prima del disegno (piano 07)

Uso:
  python -I scripts/qa/criteri.py https://ilplatinatore.vercel.app          (devono essere tutti verdi)
  python -I scripts/qa/criteri.py https://ilplatinatore.vercel.app --rompi  (devono essere tutti rossi)
Esce con 1 se l'esito non e' quello atteso. Rapporto in scripts/qa/out/criteri-<modo>.json.
"""
import json
import os
import sys

from playwright.sync_api import sync_playwright

QUI = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(QUI, "out")

GUIDA = "/2026/10/13/valor-mortis-guida-platino-tutti-trofei/"
CAPITOLO = "/2026/10/15/valor-mortis-collezionabili-capitolo-2/"
CAPITOLO_1 = "/2026/10/14/valor-mortis-collezionabili-capitolo-1/"
HUB = "/tag/valor-mortis/"
NON_GIOCO = "/tag/novita/"

# i guasti, uno per criterio: CSS o script iniettati prima che la pagina parta
CSS = lambda regole: f"document.addEventListener('DOMContentLoaded',()=>{{const s=document.createElement('style');s.textContent={json.dumps(regole)};document.head.appendChild(s)}});"  # noqa: E731
GUASTI = {
    1: CSS("[data-trofeo] input{pointer-events:none!important}"),
    2: "Storage.prototype.setItem=function(){};",
    3: "Storage.prototype.setItem=function(){};",
    4: "document.addEventListener('DOMContentLoaded',()=>{const d=document.createElement('div');d.style.cssText='position:fixed;top:0;left:0;right:0;height:140px;background:#000;z-index:9999';document.body.appendChild(d)});",
    5: CSS("*,*::before,*::after{outline:none!important;box-shadow:none!important}"),
    6: CSS(".bg-azione,[aria-label=giusto],[aria-label=sbagliato]{display:none!important}"),
    7: CSS("details>p button{display:none!important}"),
    8: "window.addEventListener('load',()=>{setTimeout(()=>{throw new Error('guasto messo apposta')},0)});",
    9: CSS("section[aria-label='Il platino in breve'] p.text-xs{display:none!important}"),
    # dopo il caricamento: un elemento aggiunto prima che React prenda la pagina viene tolto da React
    10: "window.addEventListener('load',()=>setTimeout(()=>{const d=document.createElement('div');d.style.cssText='width:640px;height:4px';document.querySelector('main').appendChild(d)},200));",
    11: "const _d=EventTarget.prototype.dispatchEvent;EventTarget.prototype.dispatchEvent=function(e){if(e&&e.type==='platinatore:misura')return true;return _d.call(this,e)};",
    12: CSS("[aria-pressed]{display:none!important} button:has(svg)+*{}"),
    13: "window.addEventListener('keydown',e=>{if(e.key==='Escape')e.stopImmediatePropagation()},true);",
    14: "Storage.prototype.setItem=function(){};",
}


def nuovo(b, guasto=None, larghezza=390):
    ctx = b.new_context(viewport={"width": larghezza, "height": 844}, is_mobile=True, has_touch=True, color_scheme="dark")
    if guasto:
        ctx.add_init_script(guasto)
    ctx.add_init_script("window.__misure=[];window.addEventListener('platinatore:misura',e=>window.__misure.push(e.detail.nome));")
    pg = ctx.new_page()
    pg.__errori = []
    pg.on("pageerror", lambda e: pg.__errori.append(str(e)))
    return ctx, pg


def vai(pg, base, percorso):
    pg.goto(base + percorso, wait_until="load", timeout=90_000)
    pg.wait_for_timeout(900)


def clic(loc, t=4000):
    try:
        loc.click(timeout=t)
        return True
    except Exception:
        return False


# --- i criteri -----------------------------------------------------------------------------------

def c1(b, base, g):
    ctx, pg = nuovo(b, g)
    vai(pg, base, GUIDA)
    gruppo = pg.locator('section[aria-label^="Trofei"]').first
    prima = gruppo.locator("p[aria-live]").first.inner_text()
    clic(gruppo.locator("[data-trofeo] input").first)
    pg.wait_for_timeout(300)
    dopo = gruppo.locator("p[aria-live]").first.inner_text()
    vai(pg, base, CAPITOLO)
    tab = pg.locator("#collezionabili")
    p2 = tab.locator("p[aria-live]").first.inner_text()
    clic(tab.locator("[data-trofeo] input").first)
    pg.wait_for_timeout(300)
    d2 = tab.locator("p[aria-live]").first.inner_text()
    ctx.close()
    return prima != dopo and p2 != d2, f"trofei {prima!r}->{dopo!r}; oggetti {p2!r}->{d2!r}"


def c2(b, base, g):
    ctx, pg = nuovo(b, g)
    vai(pg, base, CAPITOLO)
    riga = pg.locator("#collezionabili [data-trofeo]").first
    nome = riga.get_attribute("data-trofeo")
    clic(riga.locator("input"))
    pg.wait_for_timeout(300)
    pg.reload(wait_until="load")
    pg.wait_for_timeout(900)
    fatto = pg.locator(f'#collezionabili [data-trofeo="{nome}"]').get_attribute("data-fatto")
    ctx.close()
    return fatto == "true", f"{nome} dopo il ricaricamento: fatto={fatto}"


def c3(b, base, g):
    ctx, pg = nuovo(b, g)
    vai(pg, base, CAPITOLO)
    clic(pg.locator("#collezionabili [data-trofeo] input").first)
    pg.wait_for_timeout(300)
    vai(pg, base, HUB)
    r = pg.locator('section[aria-label="Riprendi da dove eri"]')
    n = r.count()
    testo = r.first.inner_text().replace("\n", " | ")[:120] if n else ""
    ctx.close()
    return n > 0, testo or "nessun «Riprendi»"


def titolo_libero(pg, sel):
    """Il titolo e' in vista e nessun elemento fisso gli sta sopra (prova su 5 punti della prima riga)."""
    return pg.evaluate(
        """(sel) => {
      const h = document.querySelector(sel); if (!h) return 'titolo non trovato';
      const r = h.getBoundingClientRect();
      if (r.top < 0 || r.top > innerHeight - 20) return 'fuori vista: top=' + Math.round(r.top);
      const y = r.top + Math.min(12, r.height / 2);
      for (const f of [0.02, 0.25, 0.5, 0.75, 0.98]) {
        const x = r.left + r.width * f;
        const e = document.elementFromPoint(x, y);
        // il selettore delle varianti esiste solo sull'anteprima: non conta
        if (e && e.closest('[data-lab]')) continue;
        if (e && !h.contains(e) && e !== h) return 'coperto da ' + e.tagName.toLowerCase() + '.' + String(e.className).slice(0, 40);
      }
      return 'ok';
    }""",
        sel,
    )


def c4(b, base, g):
    ctx, pg = nuovo(b, g)
    esiti = []
    vai(pg, base, CAPITOLO)
    for i in range(3):
        link = pg.locator('#collezionabili a[href^="#"]').nth(i)
        dest = link.get_attribute("href")
        clic(link)
        pg.wait_for_timeout(900)
        esiti.append(f"{dest}: {titolo_libero(pg, dest)}")
    vai(pg, base, GUIDA)
    pg.evaluate("window.scrollTo(0, document.body.scrollHeight / 2)")
    pg.wait_for_timeout(700)
    clic(pg.get_by_role("button", name="Apri i comandi"))
    clic(pg.get_by_role("button", name="Indice"))
    voce = pg.locator('nav[aria-label="Indice della guida"] a').nth(3)
    dest = voce.get_attribute("href") if voce.count() else None
    if dest:
        clic(voce)
        pg.wait_for_timeout(900)
        esiti.append(f"indice {dest}: {titolo_libero(pg, dest)}")
    else:
        esiti.append("indice non raggiungibile")
    ctx.close()
    return all(e.endswith(": ok") for e in esiti), "; ".join(esiti)


def c5(b, base, g):
    ctx, pg = nuovo(b, g)
    vai(pg, base, GUIDA)
    esiti = []
    # 5a: con Tab si arriva a una casella, lo spazio la spunta, il fuoco si vede
    trovata = False
    for _ in range(120):
        pg.keyboard.press("Tab")
        if pg.evaluate("document.activeElement && document.activeElement.type === 'checkbox'"):
            trovata = True
            break
    if trovata:
        pg.keyboard.press("Space")
        pg.wait_for_timeout(200)
        spuntata = pg.evaluate("document.activeElement.checked")
        visibile = pg.evaluate(
            "(() => { const s = document.activeElement.nextElementSibling; const c = getComputedStyle(s); return c.outlineStyle !== 'none' && parseFloat(c.outlineWidth) > 0 })()"
        )
        esiti.append(f"casella: spuntata={spuntata}, fuoco visibile={visibile}")
        ok_a = spuntata and visibile
    else:
        esiti.append("nessuna casella raggiungibile con Tab")
        ok_a = False
    # 5b: la pillola si apre con Invio
    pg.evaluate("window.scrollTo(0, document.body.scrollHeight / 2)")
    pg.wait_for_timeout(700)
    btn = pg.get_by_role("button", name="Apri i comandi")
    btn.focus()
    pg.keyboard.press("Enter")
    pg.wait_for_timeout(300)
    aperta = pg.get_by_role("button", name="Chiudi i comandi").count() > 0
    fuoco = pg.evaluate("(() => { const c = getComputedStyle(document.activeElement); return c.outlineStyle !== 'none' && parseFloat(c.outlineWidth) > 0 })()")
    esiti.append(f"pillola: aperta con Invio={aperta}, fuoco visibile={fuoco}")
    ctx.close()
    return ok_a and aperta and fuoco, "; ".join(esiti)


def c6(b, base, g):
    ctx, pg = nuovo(b, g)
    vai(pg, base, CAPITOLO)
    # un'area intera spuntata: il riepilogo deve dirlo a parole
    for inp in pg.locator("#collezionabili [data-trofeo] input").all():
        clic(inp)
    pg.wait_for_timeout(400)
    testo = pg.locator("#collezionabili").inner_text()
    capitolo = "Capitolo completato" in testo
    vai(pg, base, "/sfida/?f=classico")
    inp = pg.locator("input[type=text]").first
    inp.fill("me")
    pg.wait_for_timeout(200)
    clic(pg.locator('ul[aria-label="Suggerimenti"] button').first)
    pg.wait_for_timeout(300)
    caselle = pg.locator('ol[aria-label^="Tentativi"] [aria-label="giusto"], ol[aria-label^="Tentativi"] [aria-label="sbagliato"]')
    etichette = [x for x in caselle.all() if x.is_visible()]
    parole = pg.locator('ol[aria-label="I tuoi tentativi"]').inner_text().lower()
    indizi_scritti = all(w in parole for w in ("anno", "console", "studio", "genere", "serie")) and any(w in parole for w in ("giusto", "vicino", "no"))
    ctx.close()
    return capitolo and len(etichette) > 0 and indizi_scritti, f"«Capitolo completato» scritto={capitolo}; caselle con etichetta={len(etichette)}; indizi a parole={indizi_scritti}"


def c7(b, base, g):
    ctx, pg = nuovo(b, g)
    vai(pg, base, CAPITOLO)
    clic(pg.locator("#collezionabili [data-trofeo] input").first)
    pg.wait_for_timeout(300)
    conta = lambda: pg.locator('#collezionabili [data-fatto="true"]').count()  # noqa: E731
    prima = conta()
    clic(pg.get_by_text("Azzera le spunte di questa guida"))
    pg.wait_for_timeout(200)
    senza_conferma = conta()
    confermato = clic(pg.get_by_role("button", name="Azzera", exact=True), 3000)
    pg.wait_for_timeout(300)
    dopo = conta()
    ctx.close()
    ok = prima > 0 and senza_conferma == prima and confermato and dopo == 0
    return ok, f"spuntati {prima}; aprendo Azzera senza confermare {senza_conferma}; dopo la conferma {dopo}"


def c8(b, base, g):
    ctx, pg = nuovo(b, g)
    esiti = []
    # un articolo qualsiasi senza campi della guida: niente scheda, niente checklist, nessun errore
    pg.goto(base + "/category/news/", wait_until="load")
    art = pg.locator('main a[href^="/20"]').first.get_attribute("href")
    vai(pg, base, art)
    esiti.append(f"articolo news: scheda={pg.locator('section[aria-label=\"Il platino in breve\"]').count()}, checklist={pg.locator('section[aria-label^=\"Trofei\"]').count()}")
    vai(pg, base, NON_GIOCO)
    hub = pg.locator('section[aria-label="Il percorso consigliato"]').count()
    h1 = pg.locator("h1").count()
    esiti.append(f"tag non gioco: hub={hub}, h1={h1}")
    errori = list(pg.__errori)
    ctx.close()
    ok = hub == 0 and h1 == 1 and not errori and "scheda=0, checklist=0" in esiti[0]
    return ok, "; ".join(esiti) + (f"; errori: {errori[:2]}" if errori else "")


def c9(b, base, g):
    ctx, pg = nuovo(b, g)
    vai(pg, base, GUIDA)
    s = pg.locator('section[aria-label="Il platino in breve"]')
    testo = s.inner_text() if s.count() else ""
    ok = any(w in testo.lower() for w in ("stim", "dipend", "version"))
    ctx.close()
    nota = [r for r in testo.split("\n") if "stim" in r.lower() or "dipend" in r.lower()]
    return ok, (nota[0][:110] if nota else "nessuna nota sulle stime")


def c10(b, base, g):
    ctx, pg = nuovo(b, g, larghezza=360)
    lungo = "Supercalifragilistichespiralidosissimamente " * 2 + "Unduecentoventicinquecaratterisenzaspaziopersentire"
    esiti = []
    for percorso in ("/", HUB, GUIDA, CAPITOLO, "/sfida/?f=trofeo"):
        vai(pg, base, percorso)
        pg.evaluate(
            "(t) => document.querySelectorAll('h1,h2,h3,main a span,main a,p.font-semibold').forEach(e => { if (e.children.length === 0) e.textContent = t })",
            lungo,
        )
        pg.wait_for_timeout(200)
        extra = pg.evaluate("document.documentElement.scrollWidth - document.documentElement.clientWidth")
        esiti.append(f"{percorso} {extra}px")
    ctx.close()
    return all(e.endswith(" 0px") for e in esiti), "; ".join(esiti)


def c11(b, base, g):
    ctx, pg = nuovo(b, g)
    vai(pg, base, CAPITOLO)
    clic(pg.locator("#collezionabili [data-trofeo] input").first)
    clic(pg.locator('#collezionabili a[href^="#"]').first)
    pg.evaluate("window.scrollTo(0, document.body.scrollHeight / 2)")
    pg.wait_for_timeout(600)
    clic(pg.get_by_role("button", name="Apri i comandi"))
    clic(pg.get_by_role("button", name="Riprendi"))
    pg.evaluate("window.scrollTo(0, document.body.scrollHeight)")
    pg.wait_for_timeout(900)
    m = pg.evaluate("window.__misure")
    vai(pg, base, "/sfida/?f=gioco")
    for _ in range(6):
        if not clic(pg.locator("main ul button:not([disabled])").first, 2000):
            break
        pg.wait_for_timeout(150)
    m += pg.evaluate("window.__misure")
    vai(pg, base, GUIDA)
    pg.evaluate("document.querySelector('[data-misura=correlato]')?.addEventListener('click', e => e.preventDefault())")
    clic(pg.locator("[data-misura=correlato]").first)
    m += pg.evaluate("window.__misure")
    ctx.close()
    attese = {"spunta", "come_prenderlo", "riprendi", "lettura_completa", "sfida_inizio", "sfida_fine", "correlato"}
    mancano = sorted(attese - set(m))
    return not mancano, f"arrivate: {sorted(set(m))}" + (f"; mancano: {mancano}" if mancano else "")


def c12(b, base, g):
    ctx, pg = nuovo(b, g)
    vai(pg, base, CAPITOLO_1)
    velo = pg.get_by_text("Spoiler, tocca per vedere")
    n = velo.count()
    if not n:
        ctx.close()
        return None, "nessun oggetto segnato spoiler: criterio provato a parte (vedi rapporto della Fase 3)"
    rivela = [x for x in pg.get_by_role("button", name="Mostra spoiler").all() if x.is_visible()]
    ok = bool(rivela) and clic(rivela[0])
    pg.wait_for_timeout(300)
    rimasti = pg.get_by_text("Spoiler, tocca per vedere").count()
    ctx.close()
    return ok and rimasti == 0, f"veli {n}; «Mostra spoiler» presente={bool(rivela)}; veli dopo={rimasti}"


def c13(b, base, g):
    ctx, pg = nuovo(b, g)
    vai(pg, base, "/")
    esiti = []
    for nome, aperto in (("Apri il menu", lambda: pg.locator('nav[aria-label="Sezioni"] a', has_text="Guide").is_visible()),
                         ("Cerca nel sito", lambda: pg.evaluate("document.activeElement && document.activeElement.name === 's'"))):
        trovato = False
        for _ in range(15):
            pg.keyboard.press("Tab")
            if pg.evaluate("document.activeElement && document.activeElement.getAttribute('aria-label')") == nome:
                trovato = True
                break
        if not trovato:
            esiti.append(f"{nome}: non raggiungibile con Tab")
            continue
        pg.keyboard.press("Enter")
        pg.wait_for_timeout(400)
        a = bool(aperto())
        pg.keyboard.press("Escape")
        pg.wait_for_timeout(400)
        chiuso = pg.locator('[aria-expanded="true"]').count() == 0
        esiti.append(f"{nome}: aperto con Invio={a}, chiuso con Esc={chiuso}")
        pg.evaluate("document.activeElement && document.activeElement.blur()")
    ctx.close()
    return all("=True" in e and "False" not in e for e in esiti), "; ".join(esiti)


def c14(b, base, g):
    ctx, pg = nuovo(b, g)
    # il tema com'e' al momento in cui il documento e' pronto, prima di React: se c'e', niente lampo
    ctx.add_init_script("document.addEventListener('DOMContentLoaded',()=>{window.__temaSubito=document.documentElement.dataset.theme||''})")
    vai(pg, base, "/")
    prima = pg.evaluate("document.documentElement.dataset.theme || ''")
    clic(pg.locator('button[aria-label^="Passa al tema"]').first)
    scelto = pg.evaluate("document.documentElement.dataset.theme || ''")
    pg.reload(wait_until="load")
    pg.wait_for_timeout(500)
    dopo = pg.evaluate("document.documentElement.dataset.theme || ''")
    subito = pg.evaluate("window.__temaSubito")
    ctx.close()
    ok = scelto in ("light", "dark") and scelto != prima and dopo == scelto and subito == scelto
    return ok, f"prima={prima or 'sistema'}, scelto={scelto}, dopo il ricaricamento={dopo or 'sistema'}, gia' prima del disegno={subito or 'no'}"


CRITERI = [c1, c2, c3, c4, c5, c6, c7, c8, c9, c10, c11, c12, c13, c14]


def main() -> int:
    sys.stdout.reconfigure(encoding="utf-8")
    if len(sys.argv) < 2:
        print(__doc__)
        return 2
    base = sys.argv[1].rstrip("/")
    rompi = "--rompi" in sys.argv
    solo = [int(x) for x in sys.argv[2:] if x.isdigit()]
    os.makedirs(OUT, exist_ok=True)
    print(f"Criteri del PDF contro {base} ({'CON i guasti: attesi tutti rossi' if rompi else 'normale: attesi tutti verdi'})")
    rapporto, sbagliati = {}, 0
    with sync_playwright() as p:
        b = p.chromium.launch(channel=os.environ.get("QA_CHANNEL", "chrome"))
        try:
            for i, f in enumerate(CRITERI, 1):
                if solo and i not in solo:
                    continue
                try:
                    ok, dett = f(b, base, GUASTI[i] if rompi else None)
                except Exception as e:  # un criterio che si pianta e' rosso
                    ok, dett = False, f"errore: {str(e).splitlines()[0][:160]}"
                if ok is None:
                    stato = "saltato"
                else:
                    stato = "verde" if ok else "rosso"
                    if ok == rompi:
                        sbagliati += 1
                atteso = "rosso" if rompi else "verde"
                segno = "  " if stato in (atteso, "saltato") else "!!"
                print(f"{segno} {i:>2} {f.__doc__ or ''}{stato:<7} {dett}")
                rapporto[i] = {"stato": stato, "dettaglio": dett}
        finally:
            b.close()
    with open(os.path.join(OUT, f"criteri-{'rompi' if rompi else 'normale'}.json"), "w", encoding="utf-8") as fh:
        json.dump(rapporto, fh, ensure_ascii=False, indent=1)
    print(f"\n{sbagliati} esiti diversi da quello atteso.")
    return 1 if sbagliati else 0


if __name__ == "__main__":
    sys.exit(main())
