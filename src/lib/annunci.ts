// Pubblicita' di HB Agency. Riconfigurazione del 29/10/2026 (specifiche del proprietario): 7 formati attivi,
// spazi nel testo scelti per lunghezza dell'articolo, formati fissi decisi in un solo punto
// (src/components/pubblicita-script.tsx). Stessi identificativi e stesso markup di HB.
// Spenti: In Image 304795, Mobile Leaderboard 304970, Billboard 304969, 304961 (nessuno spazio in pagina:
// HB chiede ancora offerte per loro finche' non li toglie dalla sua configurazione).
// Funzioni pure.

export type Annuncio = { id: string; nome: string };

/** Nel testo, al massimo uno ciascuno, nell'ordine di lettura. */
export const INTERSCROLLER: Annuncio = { id: "304968", nome: "Interscroller" };
/** Oggi HB lo rende flottante in basso a destra appena carica (tipo 28): il posto nel testo vale quando sara' in linea. */
export const OUTSTREAM: Annuncio = { id: "345270", nome: "Video Outstream" };
export const IN_PAGE: Annuncio = { id: "304796", nome: "In Page" };
export const NEL_TESTO: Annuncio[] = [INTERSCROLLER, OUTSTREAM, IN_PAGE];

/** Formati fissi: li crea solo il regista nel layout, una volta per pagina. */
export const FLOOR_AD: Annuncio = { id: "304792", nome: "Floor Ad" };
export const MAGIC_LEFT: Annuncio = { id: "304793", nome: "Magic Left 300x600" };
export const INTERSTITIAL: Annuncio = { id: "304794", nome: "Interstitial" };
export const HEADER_BANNER: Annuncio = { id: "304962", nome: "Header Banner" };

/**
 * Formati che HB oggi configura SOLO da telefono (letto nel loro script il 29/10/2026): da computer non
 * vengono mai chiesti. Si accendono qui quando HB li avra' abilitati anche da computer.
 */
export const MAGIC_DA_COMPUTER = false;
export const HEADER_DA_COMPUTER = false;

/**
 * Magic Left da telefono al posto del Floor, nella posizione e misura che decide HB (riquadro fisso 300x320 a
 * sinistra, 38% dello schermo, sopra la colonna): scelta del proprietario del 29/10/2026, da rivalutare dopo una
 * settimana. Con false torna il Floor.
 */
export const MAGIC_DA_TELEFONO = true;

/** Capping dell'interstitial, in minuti: quello nativo di HB (cookie capping_hba_<spazio>). */
export const CAPPING_INTERSTITIAL_MINUTI = 30;

export const SEGNAPOSTO_ANNUNCIO = (id: string) => `<!--annuncio:${id}-->`;

// Le regole di posizione (specifiche, sezioni 4, 5, 7 e 9). Le distanze in parole stanno per i px delle
// specifiche (700-900 px fra Interscroller e Outstream): tarate col banco scripts/qa/annunci.py.
const PAROLE_SOSTANZIALE = 15; // sotto, e' un paragrafo «di poche parole»: non conta
const PAROLE_PRIMA_INTERSCROLLER = 120; // mai a ridosso di titolo, sommario e prima immagine
const PAROLE_DOPO_MINIMO = 80; // dopo un annuncio deve restare testo da leggere
export const PAROLE_FRA_ANNUNCI = 250;

/** Dove cercare il posto (paragrafi sostanziali, contati da 1): prima quelli preferiti, poi i successivi fino a `fino`. */
const FINESTRE = {
  interscroller: { da: 3, a: 4, fino: 6 },
  outstream: { media: { da: 7, a: 9, fino: 11 }, lunga: { da: 8, a: 9, fino: 11 } },
  inPage: { da: 14, a: 16, fino: 18 },
};

export type Classe = "breve" | "media" | "lunga";
export type Paragrafo = { fine: number; parole: number; parolePrima: number };
export type Posto = Annuncio & { paragrafo: number; at: number };

const CONTENITORI = new Set(["table", "ul", "ol", "dl", "blockquote", "figure", "details", "div", "section", "aside", "pre", "iframe", "form"]);
const parole = (html: string) => html.replace(/<[^>]+>/g, " ").replace(/&[a-z#0-9]+;/gi, " ").split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length;

/**
 * I paragrafi sostanziali: `<p>` di primo livello (mai dentro tabelle, elenchi, citazioni, figure o blocchi
 * annidati), con almeno 15 parole, e non fatti solo di un link o pulsante.
 */
export function paragrafiSostanziali(html: string): Paragrafo[] {
  const out: Paragrafo[] = [];
  let profondita = 0;
  let inizio = -1;
  for (const m of html.matchAll(/<(\/?)([a-z][a-z0-9]*)\b[^>]*>/gi)) {
    const chiude = m[1] === "/";
    const tag = m[2].toLowerCase();
    if (CONTENITORI.has(tag)) {
      profondita = Math.max(0, profondita + (chiude ? -1 : 1));
      continue;
    }
    if (tag !== "p" || profondita > 0) continue;
    if (!chiude) inizio = m.index!;
    else if (inizio >= 0) {
      const fine = m.index! + m[0].length;
      const pezzo = html.slice(inizio, fine);
      const n = parole(pezzo);
      const senzaLink = parole(pezzo.replace(/<a\b[\s\S]*?<\/a>/gi, " "));
      if (n >= PAROLE_SOSTANZIALE && senzaLink >= 3) out.push({ fine, parole: n, parolePrima: parole(html.slice(0, fine)) });
      inizio = -1;
    }
  }
  return out;
}

export function classeArticolo(sostanziali: number, paroleTotali: number): Classe {
  if (sostanziali >= 14 || paroleTotali >= 1600) return "lunga";
  if (sostanziali < 7 && paroleTotali < 700) return "breve";
  return "media";
}

/**
 * Dove vanno Interscroller, Outstream e In Page in questo corpo (HTML con i segnaposto di checklist,
 * correlati e verdetto gia' messi). Ognuno al massimo una volta; se mancano le condizioni di spazio, salta.
 */
export function pianoNelTesto(html: string): { classe: Classe; posti: Posto[] } {
  const p = paragrafiSostanziali(html);
  const totale = parole(html);
  const classe = classeArticolo(p.length, totale);
  // un posto valido lascia testo dopo di se' e non e' attaccato a un'altra scheda (correlato, checklist, verdetto)
  const valido = (i: number) => totale - p[i].parolePrima >= PAROLE_DOPO_MINIMO && !/^\s*(<!--|$)/.test(html.slice(p[i].fine));
  const cerca = (f: { da: number; a: number; fino: number }, ok: (i: number) => boolean) => {
    for (let i = f.da - 1; i < Math.min(p.length, f.fino); i++) if (valido(i) && ok(i)) return i;
    return -1;
  };
  const posti: Posto[] = [];
  const metti = (a: Annuncio, i: number) => posti.push({ ...a, paragrafo: i + 1, at: p[i].fine });

  const is = cerca(FINESTRE.interscroller, (i) => p[i].parolePrima >= PAROLE_PRIMA_INTERSCROLLER);
  if (is < 0) return { classe, posti };
  metti(INTERSCROLLER, is);
  if (classe === "breve") return { classe, posti }; // meno di 7 paragrafi: nessun blocco dopo l'Interscroller

  const lontano = (da: number) => (i: number) => p[i].parolePrima - p[da].parolePrima >= PAROLE_FRA_ANNUNCI;
  const os = cerca(FINESTRE.outstream[classe], lontano(is));
  if (os < 0) return { classe, posti };
  metti(OUTSTREAM, os);

  if (classe !== "lunga") return { classe, posti };
  const ip = cerca(FINESTRE.inPage, lontano(os));
  if (ip >= 0) metti(IN_PAGE, ip);
  return { classe, posti };
}

/** Mette i segnaposto degli annunci nel corpo, secondo `pianoNelTesto`. */
export function inserisciAnnunci(html: string): string {
  let out = html;
  for (const x of [...pianoNelTesto(html).posti].sort((a, b) => b.at - a.at)) {
    out = out.slice(0, x.at) + SEGNAPOSTO_ANNUNCIO(x.id) + out.slice(x.at);
  }
  return out;
}

export type TipoPagina = "articolo" | "archivio";

/**
 * Dove c'e' pubblicita': negli articoli e, coi soli formati fissi, in home e archivi (specifiche, sezione 9).
 * Mai in sfida, ricerca e pagine statiche.
 */
export function tipoPagina(percorso: string): TipoPagina | null {
  if (/^\/\d{4}\/\d{2}\/\d{2}\/[^/]+\/?$/.test(percorso)) return "articolo";
  if (/^\/(page\/\d+\/?)?$/.test(percorso)) return "archivio";
  if (/^\/(category|tag|author)\/[^/]+\/(page\/\d+\/?)?$/.test(percorso)) return "archivio";
  if (/^\/\d{4}\/(\d{2}\/(\d{2}\/)?)?(page\/\d+\/?)?$/.test(percorso)) return "archivio";
  return null;
}

/**
 * I formati fissi della pagina: un solo sticky alla volta (Floor oppure Magic Left), mai insieme.
 * - telefono: Magic Left (MAGIC_DA_TELEFONO, altrimenti Floor) e Interstitial;
 * - computer: Magic Left se HB l'ha abilitato e il margine lo contiene (schermo da 1500 px: colonna di
 *   768 px e riquadro di 300; sotto, il modello di HB lo nasconde), altrimenti Floor. L'Interstitial HB lo
 *   configura solo da telefono.
 * L'Interstitial c'e' solo se la scelta nel banner del consenso e' GIA' salvata quando la pagina si apre
 * (`consenso`): sulla pagina del banner un offerente risponde anche senza consenso e HB lo apriva sotto il
 * banner (7 volte su 8, 29/10/2026), consumando il capping. HB non usa uno spazio creato dopo il suo avvio,
 * quindi non si puo' aspettare la scelta sulla stessa pagina. Manca anche col capping di HB attivo (il suo
 * cookie).
 */
export function formatiFissi(o: { computer: boolean; margineMagic: boolean; consenso: boolean; capping: boolean }): Annuncio[] {
  if (o.computer) return [MAGIC_DA_COMPUTER && o.margineMagic ? MAGIC_LEFT : FLOOR_AD];
  const sticky = MAGIC_DA_TELEFONO ? MAGIC_LEFT : FLOOR_AD;
  return o.consenso && !o.capping ? [sticky, INTERSTITIAL] : [sticky];
}

/** Gli indirizzi su cui la pubblicita' e GA4 si accendono: solo il dominio vero, mai l'anteprima. */
export const DOMINI_VERI = ["www.ilplatinatore.it", "ilplatinatore.it"];
export const SCRIPT_HB = "https://d3u598arehftfk.cloudfront.net/prebid_hb_9582_38206.js";
export const GA4 = "GT-NS4PBCN4";
