"""Banco di prova della pubblicita' di HB Agency con annunci VERI (riconfigurazione del 29/10/2026).

Apre le pagine sul dominio vero (www.ilplatinatore.it): lo script di HB parte solo li'. Con --locale PORTA
il Chrome di prova (e solo lui, regola di risoluzione) manda www al server di sviluppo locale in HTTPS:
HB vede il dominio vero e gira sul codice nuovo, il sito vero non cambia. Senza --locale misura il sito
pubblicato. Il server locale (certificato usa e getta, accettato solo da questo browser):
  CMS_URL=https://cms.ilplatinatore.it SITO_PUBBLICO=https://www.ilplatinatore.it SITO_NOINDEX=0 \
  npx next dev -p 3443 --experimental-https --experimental-https-key KEY --experimental-https-cert CERT
(Un ponte con page.route non basta: il server di sviluppo non avvia React senza il suo canale websocket.)

Per ogni scenario (telefono e computer, articoli di lunghezze diverse, home, archivio) raccoglie: unita'
chieste a Prebid, spazi di Google, offerte vinte, spazi in pagina (id doppi, id spenti), posizione e
paragrafo degli spazi nel testo e distanze fra loro, riquadri fissi di HB e loro intersezioni con i nostri
pulsanti fissi e con la colonna, scorrimento orizzontale, cookie del capping, errori. Una schermata.

Lo script di HB esclude i browser «headless» per nome: si usa l'identificativo di un Chrome normale.

Uso:
  python -I scripts/qa/annunci.py [--locale 3443] [--solo telefono|computer] [--scenari breve,lungo]
  python -I scripts/qa/annunci.py --capping [--locale 3443]   interstitial: prima pagina, pagina dopo, ricarica
  python -I scripts/qa/annunci.py --magic-telefono           prova del Magic Left da telefono (solo misura)
Risultati in scripts/qa/out/annunci/ (JSON e schermate).
"""
import argparse
import json
import os
import sys

from playwright.sync_api import sync_playwright

SITO = "https://www.ilplatinatore.it"
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "out", "annunci")

SCENARI = {
    "news-breve": "/2026/03/18/citadelum-disponibile-playstation-5-xbox-nuovo-titolo-fantasy/",
    "breve": "/2026/05/03/crimson-desert-dove-trovare-mangiatoia-uccelli-come-usarla/",
    "medio": "/2026/10/26/dota-2-aumentare-fps-ridurre-lag/",
    "lungo": "/2026/10/13/valor-mortis-tutte-missioni-secondarie-dove-trovarle/",
    "home": "/",
    "archivio": "/category/guide/",
}
DISPOSITIVI = {
    "telefono": None,  # Pixel 7
    "computer": {"width": 1440, "height": 900},
    "computer-1280": {"width": 1280, "height": 800},
}
UA_PC = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36"
ATTIVI = {"304793", "304794", "304968", "345270", "304792", "304796", "304962"}
SPENTI = {"304795", "304970", "304969", "304961"}

RACCOLTA = r"""() => {
  const corto = (s) => String(s).replace(/.*hbagency_space_/, '');
  const r = { url: location.pathname, mobileHB: window.hbagency_ismobile };
  try { r.adUnits = (window.pbjs_hbagencyicd?.adUnits || []).map(u => corto(u.code)); } catch (e) { r.adUnits = 'err'; }
  try { r.slotGoogle = googletag.pubads().getSlots().map(s => corto(s.getSlotElementId())); } catch (e) { r.slotGoogle = []; }
  try { r.vinte = window.pbjs_hbagencyicd.getAllWinningBids().map(b => corto(b.adUnitCode) + ':' + b.width + 'x' + b.height); } catch (e) { r.vinte = []; }
  try { r.cba = Object.keys(window.hbagency_cba || {}).map(corto); } catch (e) { r.cba = []; }
  // gli spazi: id e classi hbagency_space_*
  const spazi = [...document.querySelectorAll('[id^="hbagency_space_"],[class*="hbagency_space_"]')];
  const ids = spazi.map(e => corto(e.id || [...e.classList].find(c => c.startsWith('hbagency_space_'))));
  r.doppi = ids.filter((x, i) => ids.indexOf(x) !== i);
  // paragrafi del testo nell'ordine del documento, per sapere dopo quale paragrafo sta ogni spazio
  const paragrafi = [...document.querySelectorAll('article .contenuto > p')];
  r.spazi = spazi.map((e, i) => {
    const b = e.getBoundingClientRect();
    const fr = e.querySelector('iframe, video');
    let fisso = null;
    for (let x = e; x; x = x.parentElement) { const p = getComputedStyle(x).position; if (p === 'fixed' || p === 'sticky') { fisso = p; break; } }
    const dopo = paragrafi.filter(p => p.compareDocumentPosition(e) & Node.DOCUMENT_POSITION_FOLLOWING).length;
    // la posizione nel testo e' quella del contenitore: uno spazio nascosto da HB (display:none) non ne ha
    const cont = fisso ? e : (e.closest('.annuncio') || e);
    return { id: ids[i], y: Math.round(cont.getBoundingClientRect().top + scrollY), w: Math.round(b.width), h: Math.round(b.height),
             pieno: !!fr, creativo: fr ? Math.round(fr.getBoundingClientRect().width) + 'x' + Math.round(fr.getBoundingClientRect().height) : '',
             fisso, display: getComputedStyle(e).display, dopoParagrafo: fisso ? null : dopo };
  });
  // riquadri fissi visibili: quelli di HB e i nostri (pulsanti in basso, pillola)
  const visibile = (e) => { const s = getComputedStyle(e); const b = e.getBoundingClientRect();
    return s.display !== 'none' && s.visibility !== 'hidden' && b.width > 4 && b.height > 4 && b.bottom > 0 && b.top < innerHeight; };
  const rett = (e) => { const b = e.getBoundingClientRect(); return { x: Math.round(b.left), y: Math.round(b.top), w: Math.round(b.width), h: Math.round(b.height) }; };
  const fissi = [...document.querySelectorAll('body *')].filter(e => getComputedStyle(e).position === 'fixed' && visibile(e));
  const diHB = (e) => /hbagency|HB_|hb_sticky|framehb/i.test(e.id + ' ' + e.className) || e.closest('[id*="hbagency"],[id^="HB_"]');
  r.fissiHB = fissi.filter(e => diHB(e) && !fissi.some(p => p !== e && p.contains(e) && diHB(p))).map(e => ({ id: e.id || e.className.slice(0, 40), ...rett(e) }));
  r.fissiNostri = fissi.filter(e => !diHB(e) && e.getBoundingClientRect().height > 8 && !e.closest('[id*="qc-cmp"],[class*="qc-cmp"]'))
    .map(e => ({ nome: e.getAttribute('aria-label') || e.id || e.className.slice(0, 40), ...rett(e) }));
  // distanze verticali fra gli spazi nel testo, nell'ordine (specifiche: 700-900 px fra Interscroller e Outstream)
  const nelTesto = [...document.querySelectorAll('article .annuncio[data-annuncio]')].map(e => ({ nome: e.dataset.annuncio, y: Math.round(e.getBoundingClientRect().top + scrollY), fine: Math.round(e.getBoundingClientRect().bottom + scrollY) }));
  r.distanze = nelTesto.slice(1).map((x, i) => `${nelTesto[i].nome} -> ${x.nome}: ${x.y - nelTesto[i].fine} px`);
  // l'interstitial copre tutto lo schermo per natura (si chiude con la X): non conta come sovrapposizione
  r.interstitialAperto = r.fissiHB.some(a => /304794/.test(a.id) && a.h > 200);
  const tocca = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
  r.sovrapposizioni = [];
  for (const a of r.fissiHB.filter(a => !/304794/.test(a.id))) for (const b of r.fissiNostri) if (tocca(a, b)) r.sovrapposizioni.push(a.id + ' su ' + b.nome);
  const main = document.querySelector('main'); const col = main ? rett(main.firstElementChild || main) : null;
  r.colonna = col;
  r.suColonna = r.fissiHB.filter(a => col && /304793/.test(a.id) && tocca(a, { ...col, y: 0, h: innerHeight })).map(a => a.id);
  r.scorrimentoOrizzontale = document.documentElement.scrollWidth > innerWidth + 1;
  r.cookieCapping = document.cookie.split('; ').filter(c => c.startsWith('capping_hba')).map(c => corto(c.split('=')[0]));
  r.altezzaSchermo = innerHeight;
  return r;
}"""


def apri_contesto(p, browser, disp, porta):
    if DISPOSITIVI[disp] is None:
        opz = dict(p.devices["Pixel 7"])
        opz["user_agent"] = opz["user_agent"].replace("HeadlessChrome", "Chrome")
    else:
        opz = {"viewport": DISPOSITIVI[disp], "user_agent": UA_PC}
    # col server locale il certificato e' quello usa e getta: lo accetta solo questo browser di prova
    return browser.new_context(**opz, locale="it-IT", ignore_https_errors=bool(porta))


def apri_browser(p, porta):
    args = [f"--host-resolver-rules=MAP www.ilplatinatore.it:443 127.0.0.1:{porta}"] if porta else []
    return p.chromium.launch(channel="chrome", headless=True, args=args)


def accetta_consenso(pg):
    for t in ("ACCETTO", "Accetto", "Accetta", "ACCETTA", "Accetta tutto"):
        try:
            pg.get_by_role("button", name=t, exact=True).click(timeout=5000)
            return True
        except Exception:
            pass
    return False


def schermata(pg, file):
    """Una schermata non deve fermare la misura (a volte i caratteri degli annunci non finiscono di caricare)."""
    try:
        pg.screenshot(path=file, timeout=10_000)
    except Exception as e:
        print(f"   (schermata saltata: {str(e)[:60]})")


def misura(pg, percorso, file_schermata, errori):
    pg.goto(SITO + percorso, wait_until="domcontentloaded", timeout=180_000)
    accetta_consenso(pg)
    pg.wait_for_timeout(12_000)
    # scorre tutta la pagina come un lettore, poi torna su
    altezza = pg.evaluate("document.documentElement.scrollHeight")
    for y in range(0, altezza, 900):
        pg.evaluate(f"scrollTo(0,{y})")
        pg.wait_for_timeout(350)
    pg.wait_for_timeout(4000)
    r = pg.evaluate(RACCOLTA)
    # l'interstitial si chiude come farebbe il lettore, poi si guardano i fissi a meta' pagina (Floor, video)
    pg.evaluate("try { hbManager.closeHBInterstitial('hbagency_space_304794'); hbManager.closeHB('HB_Footer_Close_hbagency_space_304794') } catch (e) {}")
    pg.evaluate("scrollTo(0, Math.round(document.documentElement.scrollHeight/2))")
    pg.wait_for_timeout(1500)
    r_meta = pg.evaluate(RACCOLTA)
    r["fissiHB_meta"], r["fissiNostri_meta"], r["sovrapposizioni_meta"] = r_meta["fissiHB"], r_meta["fissiNostri"], r_meta["sovrapposizioni"]
    schermata(pg, file_schermata)
    # chiusura del Floor con la sua X: sparisce e i nostri pulsanti tornano giu' (variabile a 0)
    r["chiusuraFloor"] = pg.evaluate("""async () => {
      const o = document.getElementById('HB_Footer_Close_hbagency_space_304792');
      if (!o || getComputedStyle(o).position !== 'fixed' || o.getBoundingClientRect().height < 10) return 'Floor non aperto';
      try { hbManager.closeHB('HB_Footer_Close_hbagency_space_304792'); } catch (e) { return 'chiusura non disponibile'; }
      await new Promise(r => setTimeout(r, 1200));
      const chiuso = getComputedStyle(o).display === 'none' || o.getBoundingClientRect().height < 10;
      return (chiuso ? 'chiuso' : 'NON chiuso') + ', --annunci-destra=' + document.documentElement.style.getPropertyValue('--annunci-destra');
    }""")
    r["errori"] = errori[:]
    return r


def giudica(r, disp, nome):
    """I problemi oggettivi: id doppi, id spenti in pagina, sovrapposizioni, scorrimento orizzontale."""
    prob = []
    if r["doppi"]:
        prob.append(f"id doppi {r['doppi']}")
    spenti = sorted({s["id"] for s in r["spazi"]} & SPENTI)
    if spenti:
        prob.append(f"spazi spenti in pagina {spenti}")
    if r["sovrapposizioni"] or r["sovrapposizioni_meta"]:
        prob.append(f"sovrapposizioni {sorted(set(r['sovrapposizioni'] + r['sovrapposizioni_meta']))}")
    if r["suColonna"]:
        prob.append(f"Magic sulla colonna {r['suColonna']}")
    if r["scorrimentoOrizzontale"]:
        prob.append("scorrimento orizzontale")
    return prob


def main() -> int:
    sys.stdout.reconfigure(encoding="utf-8")
    ap = argparse.ArgumentParser()
    ap.add_argument("--locale", type=int, default=0, help="porta del server di sviluppo locale")
    ap.add_argument("--solo", choices=list(DISPOSITIVI), action="append")
    ap.add_argument("--scenari", default="")
    ap.add_argument("--capping", action="store_true")
    ap.add_argument("--magic-telefono", action="store_true")
    ap.add_argument("--etichetta", default="")
    a = ap.parse_args()
    os.makedirs(OUT, exist_ok=True)
    pref = (a.etichetta or ("locale" if a.locale else "vivo")) + "-"
    risultati = {}
    problemi_tot = 0
    with sync_playwright() as p:
        browser = apri_browser(p, a.locale)
        try:
            if a.capping:
                return prova_capping(p, browser, a.locale, pref)
            if a.magic_telefono:
                return prova_magic_telefono(p, browser, a.locale, pref)
            scelti = [s for s in a.scenari.split(",") if s] or list(SCENARI)
            for disp in a.solo or ["telefono", "computer", "computer-1280"]:
                for nome in scelti:
                    if disp == "computer-1280" and nome not in ("lungo", "home"):
                        continue
                    ctx = apri_contesto(p, browser, disp, a.locale)
                    pg = ctx.new_page()
                    errori: list[str] = []
                    pg.on("pageerror", lambda e, errori=errori: errori.append(str(e)[:200]))
                    r = misura(pg, SCENARI[nome], os.path.join(OUT, f"{pref}{disp}-{nome}.png"), errori)
                    r["problemi"] = giudica(r, disp, nome)
                    problemi_tot += len(r["problemi"])
                    risultati[f"{disp}/{nome}"] = r
                    nel_testo = [(s["id"], s["dopoParagrafo"], s["y"], s["h"], s["creativo"]) for s in r["spazi"] if s["dopoParagrafo"] is not None and s["dopoParagrafo"] > 0]
                    print(f"== {disp}/{nome}: chieste {r['adUnits']} | google {r['slotGoogle']} | vinte {r['vinte']}")
                    print(f"   spazi {[s['id'] + ('*' if s['pieno'] else '') for s in r['spazi']]} | nel testo (id, dopo §, y, h, creativo) {nel_testo}")
                    print(f"   fissi HB {[(f['id'], f['y'], f['h']) for f in r['fissiHB_meta']]} | nostri {[(f['nome'], f['y']) for f in r['fissiNostri_meta']]}")
                    print(f"   distanze {r['distanze']} | interstitial aperto {r['interstitialAperto']} | Floor: {r['chiusuraFloor']}")
                    print(f"   capping {r['cookieCapping']} cba {r['cba']} | errori {r['errori']} | PROBLEMI {r['problemi'] or 'nessuno'}")
                    ctx.close()
        finally:
            browser.close()
    with open(os.path.join(OUT, f"{pref}risultati.json"), "w", encoding="utf-8") as f:
        json.dump(risultati, f, ensure_ascii=False, indent=1)
    print(f"\nproblemi: {problemi_tot}")
    return 1 if problemi_tot else 0


def prova_capping(p, browser, porta, pref):
    """Interstitial: eleggibile alla prima pagina; dopo che si e' aperto, assente alla pagina dopo e ricaricando."""
    ctx = apri_contesto(p, browser, "telefono", porta)
    pg = ctx.new_page()
    passi = [("prima pagina", SCENARI["medio"]), ("pagina dopo", SCENARI["lungo"]), ("ricarica", SCENARI["lungo"])]
    esito = 0
    for i, (nome, percorso) in enumerate(passi):
        pg.goto(SITO + percorso, wait_until="domcontentloaded", timeout=180_000)
        if i == 0:
            accetta_consenso(pg)
        pg.wait_for_timeout(14_000)
        r = pg.evaluate(RACCOLTA)
        aperto = pg.evaluate("""() => { const o = document.getElementById('HB_Footer_Close_hbagency_space_304794');
            return !!o && getComputedStyle(o).position === 'fixed' && o.getBoundingClientRect().height > 200; }""")
        spazio = any(s["id"] == "304794" for s in r["spazi"])
        scade = pg.evaluate("""() => { const c = document.cookie.split('; ').find(x => x.startsWith('capping_hba_hbagency_space_304794='));
            if (!c) return null; try { return Math.round((JSON.parse(decodeURIComponent(c.split('=')[1])).scadenza - Date.now()) / 60000); } catch (e) { return 'illeggibile'; } }""")
        print(f"{nome}: scade fra {scade} min | spazio {spazio} | chiesto {'304794' in r['adUnits']} | google {'304794' in r['slotGoogle']} | aperto {aperto} | cookie {r['cookieCapping']} | cba {r['cba']}")
        schermata(pg, os.path.join(OUT, f"{pref}capping-{i}.png"))
        if i == 0 and aperto:
            pg.evaluate("hbManager.closeHBInterstitial('hbagency_space_304794'); hbManager.closeHB('HB_Footer_Close_hbagency_space_304794')")
        if i > 0 and "304794" in r["cookieCapping"] and ("304794" in r["slotGoogle"] or aperto):
            esito = 1
            print("   PROBLEMA: capping attivo ma l'interstitial e' ancora chiesto a Google o aperto")
    ctx.close()
    return esito


def prova_magic_telefono(p, browser, porta, pref):
    """Misura reale del Magic Left da telefono: lo spazio si aggiunge solo in questo browser, prima dello script."""
    ctx = apri_contesto(p, browser, "telefono", porta)
    ctx.add_init_script("""document.addEventListener('DOMContentLoaded', () => {
      if (document.getElementById('hbagency_space_304793')) return;
      const d = document.createElement('div'); d.id = 'HB_Footer_Close_hbagency_space_304793';
      d.innerHTML = '<div id="HB_CLOSE_hbagency_space_304793"></div><div id="HB_OUTER_hbagency_space_304793"><div id="hbagency_space_304793"></div></div>';
      document.body.appendChild(d); });""")
    pg = ctx.new_page()
    misure = []
    for nome in ("medio", "lungo", "breve"):
        pg.goto(SITO + SCENARI[nome], wait_until="domcontentloaded", timeout=180_000)
        accetta_consenso(pg)
        pg.wait_for_timeout(15_000)
        pg.evaluate("scrollTo(0, 1200)")
        pg.wait_for_timeout(1500)
        m = pg.evaluate("""() => { const o = document.getElementById('HB_Footer_Close_hbagency_space_304793');
          const f = document.querySelector('#hbagency_space_304793 iframe');
          if (!o || !f) return null; const b = o.getBoundingClientRect(); const fb = f.getBoundingClientRect();
          const col = document.querySelector('main').getBoundingClientRect();
          return { riquadro: [Math.round(b.left), Math.round(b.top), Math.round(b.width), Math.round(b.height)],
                   creativo: [Math.round(fb.left), Math.round(fb.top), Math.round(fb.width), Math.round(fb.height)],
                   quotaSchermo: Math.round(100 * Math.max(b.height, fb.height) / innerHeight),
                   copreColonna: fb.right > col.left && fb.left < col.right,
                   scorrimento: document.documentElement.scrollWidth > innerWidth + 1, schermo: [innerWidth, innerHeight] }; }""")
        schermata(pg, os.path.join(OUT, f"{pref}magic-telefono-{nome}.png"))
        print(f"{nome}: {m or 'Magic non erogato in questo caricamento'}")
        misure.append(m)
    ctx.close()
    return 0


if __name__ == "__main__":
    sys.exit(main())
