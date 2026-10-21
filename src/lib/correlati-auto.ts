// Correlati automatici in tutti gli articoli (richiesta del proprietario, 21/10/2026): presi dallo
// stesso gioco, con le etichette di sempre, nell'ordine approvato. Valgono solo se la redazione (o
// wpvibe) non li ha scelti a mano nel campo pl_correlati. Funzioni pure.

import type { Correlato } from "./guida/collezionabili";
import { guidaPlatinoDalTitolo } from "./hub";
import { eRecensione } from "./recensione";
import { sezioneDi, type Registro } from "./registro-hub";

export type ArticoloLeggero = { slug: string; titolo: string; data: string; modificato?: string; categorie: Array<{ slug: string }> };
export type Scelta = { slug: string; tipo: string };

const QUANTI = 3;
const notizia = (a: ArticoloLeggero) => a.categorie.some((c) => /^news$|notizi/i.test(c.slug));
const piuRecenti = <A extends ArticoloLeggero>(l: A[]) => [...l].sort((x, y) => (y.modificato ?? y.data).localeCompare(x.modificato ?? x.data));

/**
 * Quali articoli e con quale etichetta, i primi tre disponibili in quest'ordine: Guida al Platino,
 * La nostra recensione, Trofeo mancabile, Boss complicato, L'ultima news, poi Leggi anche (la guida
 * aggiornata piu' di recente). `altri` sono gli articoli dello stesso tag SENZA quello che si legge.
 * Senza un gioco (un tag come «PlayStation 5») solo «Leggi anche».
 */
export function sceltaCorrelati(altri: ArticoloLeggero[], opts: { gioco: string | null; registro: Registro }): Scelta[] {
  const guide = altri.filter((a) => !notizia(a) && !eRecensione(a));
  const out: Scelta[] = [];
  const usati = new Set<string>();
  const metti = (a: ArticoloLeggero | null | undefined, tipo: string) => {
    if (a && !usati.has(a.slug) && out.length < QUANTI) {
      usati.add(a.slug);
      out.push({ slug: a.slug, tipo });
    }
  };
  if (opts.gioco) {
    const gioco = opts.gioco;
    metti(guidaPlatinoDalTitolo(guide), "Guida al Platino");
    metti(piuRecenti(altri.filter((a) => eRecensione(a)))[0], "La nostra recensione");
    metti(piuRecenti(guide.filter((a) => /mancabil/i.test(a.titolo)))[0], "Trofeo mancabile");
    metti(piuRecenti(guide.filter((a) => sezioneDi(a.titolo, gioco, opts.registro) === "Boss"))[0], "Boss complicato");
    metti([...altri.filter(notizia)].sort((x, y) => y.data.localeCompare(x.data))[0], "L’ultima news");
  }
  for (const a of piuRecenti(guide.length ? guide : altri)) metti(a, "Leggi anche");
  return out;
}

/**
 * Dove vanno: uno ogni due sezioni (dopo la 2a, la 4a, la 6a), mai nell'ultima, che chiude
 * l'articolo (in una recensione, col verdetto): quel posto passa alla sezione prima.
 */
export function correlatiAutomatici(idSezioni: string[], scelte: Scelta[]): Correlato[] {
  const ultima = idSezioni.length - 1;
  const indici = new Set<number>();
  for (let i = 1; i < idSezioni.length && indici.size < QUANTI; i += 2) {
    const j = i === ultima ? i - 1 : i;
    if (j > 0 && !indici.has(j)) indici.add(j);
  }
  const posti = [...indici].sort((x, y) => x - y).map((i) => idSezioni[i]);
  return posti.slice(0, scelte.length).map((dopo, i) => ({ id: `automatico-${i + 1}`, tipo: scelte[i].tipo, articolo: scelte[i].slug, perche: "", dopo }));
}
