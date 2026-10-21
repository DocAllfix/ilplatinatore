// «La parola» (gioco 4, richiesta del proprietario, 21/10/2026): Wordle sui videogiochi. Tre livelli
// di difficolta' (scelta dell'utente), ognuno con la sua parola del giorno uguale per tutti:
// facile il nome del gioco, medio la software house, difficile il boss. 6 tentativi; una prova vale
// se ha il numero giusto di lettere (nomi propri: niente dizionario). Funzioni pure.

import { elementoDelTurno } from "./sfida";

export const LIVELLI = ["facile", "medio", "difficile"] as const;
export type Livello = (typeof LIVELLI)[number];
export const NOMI_LIVELLO: Record<Livello, { nome: string; cosa: string }> = {
  facile: { nome: "Facile", cosa: "il videogioco" },
  medio: { nome: "Medio", cosa: "la software house" },
  difficile: { nome: "Difficile", cosa: "il boss" },
};
export const TENTATIVI_PAROLA = 6;
export const MASSIMO_LETTERE = 14;

/** Una parola del gioco: il nome com'e' scritto e il gioco del cui hub si parla alla fine. */
export type Parola = { livello: Livello; nome: string; gioco: { nome: string; slug: string } };

/** Lettere A-Z senza accenti; spazi, trattini e apostrofi sono separatori fissi (gia' segnati). */
export function lettere(nome: string): string {
  return nome
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toUpperCase()
    .replace(/[^A-Z]/g, "");
}

/**
 * Lo schema della griglia: le lunghezze dei pezzi del nome («Lord Saito» → [4, 5]). Null se il nome
 * non si puo' giocare (cifre, lettere fuori dall'alfabeto, troppo corto o troppo lungo).
 */
export function schema(nome: string): number[] | null {
  const pulito = nome.normalize("NFD").replace(/\p{M}/gu, "");
  if (/[^A-Za-z\s'’\-]/.test(pulito)) return null;
  const pezzi = pulito.split(/[\s'’\-]+/).filter(Boolean).map((p) => p.length);
  const totale = pezzi.reduce((a, b) => a + b, 0);
  return totale >= 4 && totale <= MASSIMO_LETTERE ? pezzi : null;
}

export type Stato = "giusta" | "presente" | "assente";

/** Il confronto di Wordle, con le lettere doppie come nell'originale (prima le giuste, poi le presenti). */
export function confronta(segreto: string, prova: string): Stato[] {
  const s = lettere(segreto);
  const p = lettere(prova);
  const esito: Stato[] = Array.from({ length: p.length }, () => "assente");
  const restanti = new Map<string, number>();
  for (let i = 0; i < s.length; i++) {
    if (p[i] === s[i]) esito[i] = "giusta";
    else restanti.set(s[i], (restanti.get(s[i]) ?? 0) + 1);
  }
  for (let i = 0; i < p.length; i++) {
    if (esito[i] === "giusta") continue;
    const n = restanti.get(p[i]) ?? 0;
    if (n > 0) {
      esito[i] = "presente";
      restanti.set(p[i], n - 1);
    }
  }
  return esito;
}

const PESO: Record<Stato, number> = { assente: 0, presente: 1, giusta: 2 };

/** Il colore di ogni tasto: il migliore che la lettera ha avuto nei tentativi. */
export function tastiera(segreto: string, tentativi: string[]): Record<string, Stato> {
  const out: Record<string, Stato> = {};
  for (const t of tentativi) {
    const esiti = confronta(segreto, t);
    [...lettere(t)].forEach((c, i) => {
      if (!out[c] || PESO[esiti[i]] > PESO[out[c]]) out[c] = esiti[i];
    });
  }
  return out;
}

/** La parola di oggi per un livello: si passa per tutte prima di ripeterne una. */
export function parolaDelGiorno(giorno: number, livello: Livello, elenco: Parola[]): Parola | null {
  const validi = elenco.filter((p) => p.livello === livello && schema(p.nome));
  if (!validi.length) return null;
  const sale = { facile: 101, medio: 202, difficile: 303 }[livello];
  return validi[elementoDelTurno(giorno, validi.length, sale)];
}

const QUADRETTO: Record<Stato, string> = { giusta: "🟩", presente: "🟦", assente: "🟪" };

/** Il risultato da condividere, senza spoiler: Acido, Ciano e Viola diventano verde, blu e viola. */
export function condivisione(numero: number, livello: Livello, segreto: string, tentativi: string[], vinta: boolean): string {
  const righe = tentativi.map((t) => confronta(segreto, t).map((e) => QUADRETTO[e]).join(""));
  return [`Il Platinatore · La parola #${numero} · ${NOMI_LIVELLO[livello].nome} ${vinta ? tentativi.length : "X"}/${TENTATIVI_PAROLA}`, ...righe].join("\n");
}

/**
 * L'elenco del CMS («livello | parola | slug del gioco») piu' i giochi degli hub per il facile.
 * Una parola il cui gioco non e' un hub (o non c'e') non entra: il rimando finale non saprebbe dove andare.
 */
export function leggiParole(testo: string, giochi: Map<string, string>): Parola[] {
  const out: Parola[] = [...giochi].map(([slug, nome]) => ({ livello: "facile" as const, nome, gioco: { nome, slug } }));
  for (const riga of testo.split(/\r?\n/)) {
    if (!riga.trim() || riga.trim().startsWith("#")) continue;
    const [livello, nome, slug] = riga.split("|").map((x) => x.trim());
    if ((livello !== "medio" && livello !== "difficile") || !nome || !slug || !giochi.has(slug)) continue;
    out.push({ livello, nome, gioco: { nome: giochi.get(slug)!, slug } });
  }
  return out;
}
