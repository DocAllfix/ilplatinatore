// Pubblicita' di HB Agency (Fase 5): gli stessi 9 posizionamenti del sito di oggi (fase0-analisi,
// sezione 5.8), con gli stessi identificativi e lo stesso markup, cosi' lo script di HB li trova come
// adesso. Scelte dell'utente (18/10/2026): tutti e 9 i formati, caricamento completo delle pagine.
// Funzioni pure.

export type Annuncio = { id: string; nome: string };

/** Negli articoli, dentro il testo: dopo il paragrafo N (come Advanced Ads oggi). */
export const NEL_TESTO: Array<Annuncio & { dopo: number }> = [
  { id: "304795", nome: "In Image", dopo: 1 },
  { id: "304796", nome: "Billboard 970x250", dopo: 3 },
  { id: "304968", nome: "Interscroller", dopo: 4 },
  { id: "345270", nome: "Video Outstream", dopo: 5 },
  { id: "304970", nome: "Mobile Leaderboard 320x100", dopo: 7 },
];
/**
 * In Image: lo script di HB mette l'annuncio SOPRA un'immagine, la piu' grande fra le prime 60 della
 * pagina, e la sposta dentro un suo riquadro. Un'immagine con id `hb-inimage-fix` diventa l'unico
 * bersaglio (letto dallo script il 23/10/2026). Scelta del proprietario: mai sulla testata col titolo.
 */
export const IN_IMAGE = "304795";
export const BERSAGLIO_IN_IMAGE = "hb-inimage-fix";
export const HEADER_BANNER: Annuncio = { id: "304962", nome: "Header Banner" };
export const FLOOR_AD: Annuncio = { id: "304792", nome: "Floor Ad" };
/** Su tutte le pagine */
export const MAGIC_LEFT: Annuncio = { id: "304793", nome: "Magic Left 300x600" };
export const INTERSTITIAL: Annuncio = { id: "304794", nome: "Interstitial" };

export const SEGNAPOSTO_ANNUNCIO = (id: string) => `<!--annuncio:${id}-->`;

/**
 * Mette i segnaposto degli annunci dopo il paragrafo N del corpo (contando i `</p>` del primo
 * livello, come fa WordPress con i blocchi). Se l'articolo ha meno paragrafi, quegli annunci saltano.
 */
export function inserisciAnnunci(html: string, posti: ReadonlyArray<{ id: string; dopo: number }> = NEL_TESTO): string {
  const fine = [...html.matchAll(/<\/p>/gi)].map((m) => m.index! + m[0].length);
  const inserti = posti
    .filter((p) => p.dopo >= 1 && p.dopo <= fine.length)
    .map((p) => ({ at: fine[p.dopo - 1], testo: SEGNAPOSTO_ANNUNCIO(p.id) }))
    .sort((a, b) => b.at - a.at);
  let out = html;
  for (const x of inserti) out = out.slice(0, x.at) + x.testo + out.slice(x.at);
  return out;
}

/** Gli indirizzi su cui la pubblicita' e GA4 si accendono: solo il dominio vero, mai l'anteprima. */
export const DOMINI_VERI = ["www.ilplatinatore.it", "ilplatinatore.it"];
export const SCRIPT_HB = "https://d3u598arehftfk.cloudfront.net/prebid_hb_9582_38206.js";
export const GA4 = "GT-NS4PBCN4";
