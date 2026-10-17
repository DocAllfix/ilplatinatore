// La sfida del giorno (PDF 08, piano 05). Funzioni pure: che giorno e', quale formato, quale gioco,
// come si confronta un tentativo. Una sfida al giorno uguale per tutti, cambia a mezzanotte (Roma).

export const FORMATI = ["gioco", "trofeo", "classico"] as const;
export type Formato = (typeof FORMATI)[number];
export const NOMI_FORMATO: Record<Formato, string> = {
  gioco: "Riconosci il gioco",
  trofeo: "Indovina il trofeo",
  classico: "Riconosci il classico",
};
export const TENTATIVI = 5;

/**
 * Come si gioca ogni formato (scelte dell'utente, 17/10/2026, piano 05 chiuso):
 * - gioco: risposta a scelta, aspetto «Scheda», 5 tentativi;
 * - trofeo: risposta a scelta, aspetto «Rivelazione», 5 tentativi;
 * - classico: risposta scritta, aspetto «Rivelazione», 10 tentativi e un aiuto dopo il quinto errore
 *   (iniziale, genere e studio).
 */
export const REGOLE: Record<Formato, { risposta: "scelta" | "ricerca"; stile: "scheda" | "rivelazione"; tentativi: number; aiutoDopo?: number }> = {
  gioco: { risposta: "scelta", stile: "scheda", tentativi: 5 },
  trofeo: { risposta: "scelta", stile: "rivelazione", tentativi: 5 },
  classico: { risposta: "ricerca", stile: "rivelazione", tentativi: 10, aiutoDopo: 5 },
};

/** Giorno di partenza della sfida: il numero 1. */
const PRIMO_GIORNO = Date.UTC(2026, 9, 17) / 86_400_000;

/** Il giorno di calendario a Roma, come numero di giorni dal 1970. */
export function giornoRoma(adesso: Date): number {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Rome", year: "numeric", month: "2-digit", day: "2-digit" })
      .formatToParts(adesso)
      .map((x) => [x.type, x.value]),
  );
  return Date.UTC(Number(p.year), Number(p.month) - 1, Number(p.day)) / 86_400_000;
}

/** Il numero della sfida (1 il primo giorno). */
export const numeroSfida = (giorno: number) => Math.max(1, giorno - PRIMO_GIORNO + 1);

/** I formati ruotano un giorno ciascuno; quelli senza dati si saltano. */
export function formatoDelGiorno(giorno: number, disponibili: readonly Formato[]): Formato | null {
  const validi = FORMATI.filter((f) => disponibili.includes(f));
  if (!validi.length) return null;
  return validi[(((giorno - PRIMO_GIORNO) % validi.length) + validi.length) % validi.length];
}

/** Generatore pseudo-casuale con seme (mulberry32): stesso seme, stessa sequenza, per tutti. */
function casuale(seme: number) {
  let a = seme >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Quale elemento esce l'uscita numero `k` su `n` disponibili: si passa per tutti prima di ripeterne
 * uno (una permutazione diversa a ogni giro). `sale` separa i formati.
 */
export function elementoDelTurno(k: number, n: number, sale: number): number {
  if (n <= 0) return -1;
  const giro = Math.floor(k / n);
  const r = casuale(giro * 7919 + sale);
  const ordine = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [ordine[i], ordine[j]] = [ordine[j], ordine[i]];
  }
  return ordine[k % n];
}

/** Quante volte e' gia' uscito il formato di oggi: un giro di rotazione = una uscita per formato. */
export function uscitaDelFormato(giorno: number, disponibili: readonly Formato[]): number {
  const n = FORMATI.filter((f) => disponibili.includes(f)).length || 1;
  return Math.max(0, Math.floor((giorno - PRIMO_GIORNO) / n));
}

/** Per confrontare risposte scritte a mano: niente maiuscole, accenti, punteggiatura. */
export function normale(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** I suggerimenti mentre si scrive: prima chi comincia cosi', poi chi lo contiene. */
export function suggerimenti(testo: string, elenco: readonly string[], quanti = 6): string[] {
  const t = normale(testo);
  if (!t) return [];
  const inizio = elenco.filter((x) => normale(x).startsWith(t));
  const dentro = elenco.filter((x) => !inizio.includes(x) && normale(x).includes(t));
  return [...inizio, ...dentro].slice(0, quanti);
}

// --- Riconosci il classico: confronto a indizi (come Gamedle Guess) ---------------------------

export type Classico = { nome: string; anno: number; piattaforme: string[]; sviluppatore: string; genere: string; serie: string };
export type Esito = "giusto" | "vicino" | "sbagliato";
export type Confronto = {
  anno: { esito: Esito; verso?: "prima" | "dopo" };
  piattaforme: Esito;
  sviluppatore: Esito;
  genere: Esito;
  serie: Esito;
};

const parole = (s: string) => new Set(normale(s).split(" ").filter((x) => x.length > 2));

/** Come si avvicina il tentativo al classico segreto. `verso`: il segreto e' uscito prima o dopo. */
export function confrontaClassico(segreto: Classico, prova: Classico): Confronto {
  const diff = segreto.anno - prova.anno;
  const pS = new Set(segreto.piattaforme.map(normale));
  const pP = prova.piattaforme.map(normale);
  const comuni = pP.filter((p) => pS.has(p)).length;
  const gS = parole(segreto.genere);
  return {
    anno: { esito: diff === 0 ? "giusto" : Math.abs(diff) <= 3 ? "vicino" : "sbagliato", ...(diff ? { verso: diff < 0 ? "prima" : "dopo" } : {}) },
    piattaforme: comuni === pS.size && comuni === pP.length ? "giusto" : comuni ? "vicino" : "sbagliato",
    sviluppatore: normale(segreto.sviluppatore) === normale(prova.sviluppatore) ? "giusto" : "sbagliato",
    genere:
      normale(segreto.genere) === normale(prova.genere)
        ? "giusto"
        : [...parole(prova.genere)].some((w) => gS.has(w))
          ? "vicino"
          : "sbagliato",
    serie: !segreto.serie && !prova.serie ? "giusto" : normale(segreto.serie) === normale(prova.serie) ? "giusto" : "sbagliato",
  };
}

// --- Riconosci il gioco: quanto e' sgranata l'immagine ---------------------------------------

/** Lato dei quadretti, in pixel su 480 di larghezza, dopo `errori` tentativi sbagliati. 0 = nitida. */
export function quadretti(errori: number, finita: boolean): number {
  if (finita) return 0;
  return [40, 24, 14, 8, 5][Math.min(errori, TENTATIVI - 1)];
}

/** La riga da condividere, senza spoiler: un quadratino per tentativo. */
export function rigaDaCondividere(numero: number, formato: Formato, esiti: boolean[], vinta: boolean): string {
  const quadri = esiti.map((ok) => (ok ? "🟩" : "🟥")).join("");
  const max = REGOLE[formato].tentativi;
  return `Il Platinatore, sfida n. ${numero} (${NOMI_FORMATO[formato]}): ${quadri} ${vinta ? `${esiti.length}/${max}` : `X/${max}`}`;
}

/** Le opzioni a scelta: la soluzione e altre `quante - 1` prese a caso (con seme), in ordine misto. */
export function opzioniDelGiorno(soluzione: string, elenco: readonly string[], quante: number, seme: number): string[] {
  const altri = [...new Set(elenco)].filter((x) => normale(x) !== normale(soluzione));
  const r = casuale(seme);
  for (let i = altri.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [altri[i], altri[j]] = [altri[j], altri[i]];
  }
  const scelte = [...altri.slice(0, quante - 1), soluzione];
  for (let i = scelte.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [scelte[i], scelte[j]] = [scelte[j], scelte[i]];
  }
  return scelte;
}

/** Il nome del trofeo con le lettere nascoste a meta': «T_r_ B_n_e_». Spazi e segni restano. */
export function nomeNascosto(nome: string): string {
  let n = 0;
  return [...nome].map((c) => (/[\p{L}\p{N}]/u.test(c) ? (n++ % 2 === 0 ? c : "_") : c)).join("");
}
