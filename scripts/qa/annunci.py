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
  python -I scripts/qa/annunci.py --capping [--scadenza] [--locale 3443]   interstitial: consenso, prima visita,
      pagina dopo, ricarica, nuova scheda, ritorno; con --scadenza anche la visita dopo i 30 minuti veri
  python -I scripts/qa/annunci.py --magic-telefono           prova del Magic Left da telefono (solo misura)
Risultati in scripts/qa/out/annunci/ (JSON e schermate).
"""
import argparse
import json
import os
import sys
import time

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
  // aste vere per unita': richieste ai singoli offerenti, risposte, vinte, aperte (eventi di Prebid)
  try {
    const conta = {};
    const piu = (code, k) => { const c = corto(code); conta[c] ??= { offerenti: 0, risposte: 0, vinte: 0, aperte: 0 }; conta[c][k]++; };
    for (const e of window.pbjs_hbagencyicd.getEvents()) {
      if (e.eventType === 'bidRequested') for (const b of e.args.bids || []) piu(b.adUnitCode, 'offerenti');
      if (e.eventType === 'bidResponse') piu(e.args.adUnitCode, 'risposte');
      if (e.eventType === 'bidWon') piu(e.args.adUnitCode, 'vinte');
      if (e.eventType === 'adRenderSucceeded') piu(e.args.bid?.adUnitCode || '', 'aperte');
    }
    r.aste = conta;
  } catch (e) { r.aste = {}; }
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
  const fissiAnnunci = r.fissiHB.filter(a => !/304794/.test(a.id));
  for (const a of fissiAnnunci) for (const b of r.fissiNostri) if (tocca(a, b)) r.sovrapposizioni.push(a.id + ' su ' + b.nome);
  // fra annunci: un solo sticky alla volta, e il video flottante non deve finire sul Floor o sul Magic
  r.sovrapposizioniHB = [];
  fissiAnnunci.forEach((a, i) => fissiAnnunci.slice(i + 1).forEach(b => { if (tocca(a, b)) r.sovrapposizioniHB.push(a.id + ' su ' + b.id); }));
  // quota dello schermo coperta dai riquadri fissi di HB (interstitial escluso): area e altezza
  const dentro = (a) => ({ w: Math.max(0, Math.min(a.x + a.w, innerWidth) - Math.max(a.x, 0)), h: Math.max(0, Math.min(a.y + a.h, innerHeight) - Math.max(a.y, 0)) });
  r.quotaFissi = { area: Math.round(100 * fissiAnnunci.reduce((t, a) => t + dentro(a).w * dentro(a).h, 0) / (innerWidth * innerHeight)),
                   altezza: Math.round(100 * fissiAnnunci.reduce((t, a) => t + dentro(a).h, 0) / innerHeight) };
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
    # il lettore che ha gia' scelto nel banner (l'interstitial esiste solo allora): scelta, poi la pagina di nuovo
    pg.goto(SITO + percorso, wait_until="domcontentloaded", timeout=180_000)
    if accetta_consenso(pg):
        pg.wait_for_timeout(2000)
        pg.reload(wait_until="domcontentloaded", timeout=180_000)
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
    r["sovrapposizioniHB_meta"], r["quotaFissi_meta"] = r_meta["sovrapposizioniHB"], r_meta["quotaFissi"]
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
    r["avvisi"] = []
    if r["doppi"]:
        prob.append(f"id doppi {r['doppi']}")
    spenti = sorted({s["id"] for s in r["spazi"]} & SPENTI)
    if spenti:
        prob.append(f"spazi spenti in pagina {spenti}")
    if r["sovrapposizioni"] or r["sovrapposizioni_meta"]:
        prob.append(f"sovrapposizioni {sorted(set(r['sovrapposizioni'] + r['sovrapposizioni_meta']))}")
    if r["sovrapposizioniHB"] or r["sovrapposizioniHB_meta"]:
        prob.append(f"annunci uno sull'altro {sorted(set(r['sovrapposizioniHB'] + r['sovrapposizioniHB_meta']))}")
    # il Magic da telefono sta dove lo mette HB (scelta del proprietario del 29/10/2026): avviso, non problema
    magic = any("304793" in f["id"] for f in r["fissiHB"] + r["fissiHB_meta"])
    quota = max(r["quotaFissi"]["area"], r["quotaFissi_meta"]["area"])
    if quota > 30:
        (r["avvisi"] if magic else prob).append(f"riquadri fissi al {quota}% dello schermo")
    if r["suColonna"]:
        r["avvisi"].append(f"Magic sulla colonna {r['suColonna']}")
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
    ap.add_argument("--ritorno", type=float, default=5, help="minuti senza schede prima del ritorno (capping)")
    ap.add_argument("--scadenza", action="store_true", help="aspetta la scadenza vera del cookie (~30 minuti)")
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
                return prova_capping(p, browser, a.locale, pref, a.ritorno, a.scadenza)
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
                    print(f"   quota fissi (area/altezza %) {r['quotaFissi']} meta' {r['quotaFissi_meta']} | aste spente {({k: v for k, v in r['aste'].items() if k in SPENTI})}")
                    print(f"   capping {r['cookieCapping']} cba {r['cba']} | errori {r['errori']} | avvisi {r['avvisi']} | PROBLEMI {r['problemi'] or 'nessuno'}")
                    ctx.close()
        finally:
            browser.close()
    with open(os.path.join(OUT, f"{pref}risultati.json"), "w", encoding="utf-8") as f:
        json.dump(risultati, f, ensure_ascii=False, indent=1)
    print(f"\nproblemi: {problemi_tot}")
    return 1 if problemi_tot else 0


# Solo nel browser di prova: la prima funzione nella coda di Prebid, quindi eseguita PRIMA di quella di HB che
# prepara l'asta (e toglie le unita' col cookie del capping). Annota che cosa HB trova in hbagency_cba in
# quell'istante. Non cambia niente: HB e Prebid usano la coda gia' esistente.
OSSERVA_ASTA = """window.pbjs_hbagencyicd = window.pbjs_hbagencyicd || {};
window.pbjs_hbagencyicd.que = window.pbjs_hbagencyicd.que || [];
window.pbjs_hbagencyicd.que.push(function () { var c = window.hbagency_cba;
  window.__cbaAllAsta = c ? (c['hbagency_space_304794'] === undefined ? 'chiave assente' : c['hbagency_space_304794']) : 'lista assente'; });"""

STATO_INTERSTITIAL = """() => {
  const o = document.getElementById('HB_Footer_Close_hbagency_space_304794');
  const aperto = !!o && getComputedStyle(o).position === 'fixed' && o.getBoundingClientRect().height > 200;
  const x = document.querySelector('#HB_CLOSE_hbagency_space_304794 img');
  const bx = x && x.getBoundingClientRect();
  return { aperto, xVisibile: !!bx && bx.width > 0 && bx.height > 0 && bx.top >= 0 && bx.bottom <= innerHeight,
           cbaAllAsta: window.__cbaAllAsta ?? 'asta non ancora partita',
           tcf: window.__statoTcf || null };
}"""


def minuti_capping(ctx):
    for c in ctx.cookies(SITO):
        if c["name"] == "capping_hba_hbagency_space_304794":
            return round((c["expires"] - time.time()) / 60, 1) if c.get("expires", -1) > 0 else "di sessione"
    return None


def passo_capping(ctx, pg, nome, percorso, attesa=14_000, consenso=False):
    """Una pagina (percorso None = ricarica quella aperta): aspetta l'asta, poi dice se l'interstitial e' stato
    chiesto, dato a Google, aperto, con la X."""
    if percorso is None:
        pg.reload(wait_until="domcontentloaded", timeout=180_000)
    else:
        pg.goto(SITO + percorso, wait_until="domcontentloaded", timeout=180_000)
    if consenso:
        accetta_consenso(pg)
    pg.wait_for_timeout(attesa)
    r = pg.evaluate(RACCOLTA)
    s = pg.evaluate(STATO_INTERSTITIAL)
    asta = r["aste"].get("304794", {})
    e = {"passo": nome, "ora": time.strftime("%H:%M:%S"), "spazio": any(x["id"] == "304794" for x in r["spazi"]),
         "chiesto": "304794" in r["adUnits"] or asta.get("offerenti", 0) > 0, "offerenti": asta.get("offerenti", 0),
         "google": "304794" in r["slotGoogle"], **s, "minutiCapping": minuti_capping(ctx)}
    print(f"{e['ora']} {nome}: chiesto {e['chiesto']} ({e['offerenti']} offerenti) | google {e['google']} | aperto {e['aperto']}"
          f" | X {e['xVisibile']} | chiave all'asta {e['cbaAllAsta']} | capping fra {e['minutiCapping']} min")
    return e


def prova_capping(p, browser, porta, pref, ritorno_min, scadenza):
    """Interstitial e capping nativo di HB (30 minuti): consenso, prima visita, pagina dopo, ricarica, nuova scheda,
    ritorno prima della scadenza e (con --scadenza) nuova visita dopo la scadenza VERA del cookie."""
    problemi = []
    ctx = apri_contesto(p, browser, "telefono", porta)
    ctx.add_init_script(OSSERVA_ASTA)
    pg = ctx.new_page()
    # 0. pagina del banner del consenso, senza scelta per 25 s: niente spazio, niente apertura, capping intatto.
    # Poi la scelta (accetto), come farebbe il lettore.
    s0 = passo_capping(ctx, pg, "banner del consenso, 25 s senza scelta", SCENARI["medio"], attesa=25_000)
    if s0["aperto"] or s0["spazio"] or s0["minutiCapping"] is not None:
        problemi.append("interstitial (o il suo capping) prima della scelta nel banner del consenso")
    if not accetta_consenso(pg):
        problemi.append("banner del consenso non trovato")
    pg.wait_for_timeout(3000)
    # 1. prima pagina con la scelta salvata (lettore che torna, o pagina dopo il clic): eleggibile.
    # L'erogazione dipende dalle offerte, quindi fino a tre pagine diverse.
    primo = None
    for nome in ("lungo", "breve", "news-breve"):
        primo = passo_capping(ctx, pg, f"prima pagina con la scelta salvata ({nome})", SCENARI[nome])
        if primo["cbaAllAsta"] != 30:
            problemi.append(f"all'asta HB non trova il capping a 30: {primo['cbaAllAsta']}")
        if not primo["chiesto"] or not primo["spazio"]:
            problemi.append("con la scelta salvata e senza capping l'interstitial non e' chiesto")
        if primo["aperto"]:
            break
    schermata(pg, os.path.join(OUT, f"{pref}capping-prima.png"))
    if not primo["aperto"]:
        print("interstitial mai erogato in tre pagine: il capping non parte (nessuna offerta), prova da ripetere")
        ctx.close()
        return 2
    if not primo["xVisibile"]:
        problemi.append("X dell'interstitial non visibile all'apertura")
    if not isinstance(primo["minutiCapping"], float) or not 29 <= primo["minutiCapping"] <= 30.5:
        problemi.append(f"cookie del capping non a 30 minuti: {primo['minutiCapping']}")
    pg.evaluate("hbManager.closeHBInterstitial('hbagency_space_304794'); hbManager.closeHB('HB_Footer_Close_hbagency_space_304794')")

    # Durante il capping lo spazio non c'e' e la chiave nemmeno (HB la riscriverebbe a ogni Magic aperto): HB
    # puo' ancora mandare l'unita' all'asta, ma non ha dove aprirla. Il cookie non deve allungarsi.
    ultimo = [primo["minutiCapping"]]

    def bloccato(e):
        if e["aperto"] or e["spazio"]:
            problemi.append(f"{e['passo']}: interstitial ancora presente durante il capping")
        m = e["minutiCapping"]
        if not isinstance(m, float) or m > ultimo[0] + 0.2:
            problemi.append(f"{e['passo']}: cookie del capping sparito o allungato ({ultimo[0]} -> {m})")
        ultimo[0] = m if isinstance(m, float) else ultimo[0]

    # 2. nella stessa sessione: pagina dopo, ricarica, nuova scheda
    bloccato(passo_capping(ctx, pg, "pagina dopo", SCENARI["home"]))
    bloccato(passo_capping(ctx, pg, "ricarica", None))
    scheda = ctx.new_page()
    bloccato(passo_capping(ctx, scheda, "nuova scheda", SCENARI["archivio"]))
    # 3. ritorno prima della scadenza: tutte le schede chiuse, poi una visita nuova
    pg.close()
    scheda.close()
    print(f"attesa di {ritorno_min} minuti senza schede aperte...")
    time.sleep(ritorno_min * 60)
    pg = ctx.new_page()
    bloccato(passo_capping(ctx, pg, f"ritorno dopo {ritorno_min} min", SCENARI["news-breve"]))
    # 4. nuova visita dopo la scadenza vera del cookie (nessuna modifica a mano)
    if scadenza:
        resto = minuti_capping(ctx)
        if isinstance(resto, float):
            pg.close()
            print(f"attesa della scadenza del cookie: {resto} minuti piu' 30 secondi...")
            time.sleep(max(0, resto * 60) + 30)
        pg = ctx.new_page()
        dopo = passo_capping(ctx, pg, "visita dopo la scadenza", SCENARI["medio"])
        if not dopo["chiesto"] or not dopo["spazio"]:
            problemi.append("dopo la scadenza l'interstitial non e' di nuovo chiesto")
        if dopo["cbaAllAsta"] != 30:
            problemi.append(f"dopo la scadenza HB non trova il capping a 30: {dopo['cbaAllAsta']}")
    ctx.close()
    print("PROBLEMI:", problemi or "nessuno")
    return 1 if problemi else 0


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
