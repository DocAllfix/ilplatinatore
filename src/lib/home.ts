// Home a sezioni (piano 06, modello games.gg chiesto dal proprietario): ogni sezione si riempie da
// sola con news e guide, dall'ultima modificata. Funzioni pure.

import { normale } from "./sfida";

type ConData = { id: number; titolo: string; modificato?: string; data: string };

/** I tag piu' presenti negli articoli recenti, fra quelli che sono giochi. */
export function giochiDelMomento(tagPerArticolo: number[][], giochi: ReadonlySet<number>, quanti: number): number[] {
  const conta = new Map<number, number>();
  for (const tags of tagPerArticolo) for (const t of new Set(tags)) if (giochi.has(t)) conta.set(t, (conta.get(t) ?? 0) + 1);
  return [...conta.entries()]
    .sort((a, b) => b[1] - a[1] || a[0] - b[0])
    .slice(0, quanti)
    .map(([t]) => t);
}

/** Le parole della regola «titolo», separate da virgola. */
export const paroleDa = (parametro: string) =>
  parametro
    .split(",")
    .map((x) => normale(x))
    .filter(Boolean);

/** L'articolo ha nel titolo una delle parole (parola intera, senza badare ad accenti e maiuscole)? */
export function titoloContiene(titolo: string, parole: string[]): boolean {
  const t = ` ${normale(titolo)} `;
  return parole.some((p) => t.includes(` ${p} `));
}

/** Piu' liste in una: senza doppioni, dall'ultima modifica. */
export function perModifica<T extends ConData>(liste: T[][], quanti: number): T[] {
  const visti = new Map<number, T>();
  for (const l of liste) for (const a of l) if (!visti.has(a.id)) visti.set(a.id, a);
  return [...visti.values()].sort((a, b) => (b.modificato ?? b.data).localeCompare(a.modificato ?? a.data)).slice(0, quanti);
}

/**
 * Niente doppioni fra le file: un articolo gia' mostrato in una sezione piu' in alto si toglie da
 * quelle sotto, finche' la sezione resta con almeno `minimo` schede (altrimenti si lascia com'e').
 */
export function senzaRipetizioni<T extends { id: number }>(sezioni: T[][], minimo: number): T[][] {
  const visti = new Set<number>();
  return sezioni.map((voci) => {
    const nuove = voci.filter((a) => !visti.has(a.id));
    const scelte = nuove.length >= minimo ? nuove : voci;
    scelte.forEach((a) => visti.add(a.id));
    return scelte;
  });
}
