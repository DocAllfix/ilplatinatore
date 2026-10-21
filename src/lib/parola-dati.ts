// Le parole di oggi del gioco «La parola» (gioco 4): una per livello. Solo lato server.
// Facile: i giochi degli hub (ogni tag con articoli, tranne gli esclusi del registro); medio e
// difficile: l'elenco del CMS (Strumenti > Parole della sfida).

import { paroleSfida, registroHub, tuttiITermini } from "./cms/wp";
import { LIVELLI, leggiParole, parolaDelGiorno, type Livello, type Parola } from "./parola";
import { eHub } from "./registro-hub";
import { numeroSfida } from "./sfida";

export type DatiParola = { giorno: number; numero: number; parole: Partial<Record<Livello, Parola>> };

export async function datiParola(giorno: number): Promise<DatiParola> {
  const [tag, registro, testo] = await Promise.all([tuttiITermini("tags"), registroHub(), paroleSfida()]);
  const giochi = new Map(tag.filter((t) => t.count > 0 && eHub(t.slug, registro)).map((t) => [t.slug, t.name]));
  const elenco = leggiParole(testo, giochi);
  const parole: DatiParola["parole"] = {};
  for (const l of LIVELLI) {
    const p = parolaDelGiorno(giorno, l, elenco);
    if (p) parole[l] = p;
  }
  return { giorno, numero: numeroSfida(giorno), parole };
}
