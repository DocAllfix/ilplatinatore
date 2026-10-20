// Hub del gioco (PDF 04, piano 04): dati facoltativi del gioco dai campi del tag (mu-plugin, sezione 6).
// Le sezioni dell'hub e quali tag sono hub li decide il registro (src/lib/registro-hub.ts). Funzioni pure.

import { descrizioneDaSezioni } from "./registro-hub";

type Meta = Record<string, unknown> | undefined;

/** Il nome di una sezione dell'hub: le sezioni stanno nel registro del CMS (src/lib/registro-hub.ts). */
export type Aiuto = string;

export type Gioco = {
  presentazione: string;
  piattaforme: string[];
  /** AAAA-MM-GG */
  uscita?: string;
  sviluppatore?: string;
  editore?: string;
  guidaPlatino?: string;
  iniziaQui: string[];
};

const str = (v: unknown) => (typeof v === "string" ? v.replace(/\s*[–—]\s*/g, "-").trim() : "");

/**
 * I dati facoltativi del gioco dai campi del tag. Non decidono piu' se il tag e' un hub: lo e' ogni
 * tag non escluso dal registro (scelta del proprietario, 20/10/2026).
 */
export function giocoDaMeta(meta: Meta): Gioco {
  meta ??= {};
  const uscita = str(meta.pl_uscita);
  const slug = (s: string) => s.replace(/\/+$/, "").split("/").pop()!.toLowerCase();
  return {
    presentazione: str(meta.pl_presentazione),
    piattaforme: str(meta.pl_piattaforme)
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean),
    uscita: /^\d{4}-\d{2}-\d{2}$/.test(uscita) ? uscita : undefined,
    sviluppatore: str(meta.pl_sviluppatore) || undefined,
    editore: str(meta.pl_editore) || undefined,
    guidaPlatino: str(meta.pl_guida_platino) ? slug(str(meta.pl_guida_platino)) : undefined,
    iniziaQui: str(meta.pl_inizia_qui)
      .split("\n")
      .map((x) => x.trim())
      .filter(Boolean)
      .map(slug),
  };
}

/** Descrizione per i motori: la presentazione tagliata su una parola, o quella fatta dalle sezioni presenti. */
export function descrizioneHub(g: Gioco, nome: string, argomenti: string[]): string {
  if (!g.presentazione) return descrizioneDaSezioni(nome, argomenti);
  const base = g.presentazione;
  if (base.length <= 158) return base;
  return `${base.slice(0, 155).replace(/\s+\S*$/, "")}…`;
}

/** Il nome del gioco davanti ai due punti si ripete in ogni titolo: nell'hub si toglie. */
export function senzaGioco(t: string): string {
  const resto = t.replace(/^[^:]{2,40}:\s*/, "");
  return resto.charAt(0).toLocaleUpperCase("it-IT") + resto.slice(1);
}

/**
 * L'immagine della testata: quella della guida al Platino; se manca, quella della guida piu' recente
 * del gioco che ne ha una (scelta dell'utente, 17/10/2026). Nessuna immagine: undefined.
 */
export function copertinaHub<I, A extends { immagine?: I; data: string }>(platino: A | null, guide: A[]): I | undefined {
  if (platino?.immagine) return platino.immagine;
  return [...guide].filter((g) => g.immagine).sort((x, y) => y.data.localeCompare(x.data))[0]?.immagine;
}

/**
 * La guida al Platino riconosciuta dal titolo («guida al platino», «tutti i trofei», «lista dei
 * trofei»); prima quelle che si dicono «guida al platino», poi la piu' recente; null se non c'e'.
 * Vale solo quando il campo del tag e' vuoto.
 */
export function guidaPlatinoDalTitolo<A extends { titolo: string; data: string }>(articoli: A[]): A | null {
  const rx = /guida al platino|\bplatino\b.*\btrofei\b|\btrofei\b.*\bplatino\b|tutti i (?:\d+ )?trofei|lista (?:di tutti |dei |completa dei )?trofei/i;
  const punti = (a: A) => (/guida al platino/i.test(a.titolo) ? 1 : 0);
  const trovate = articoli.filter((a) => rx.test(a.titolo)).sort((x, y) => punti(y) - punti(x) || y.data.localeCompare(x.data));
  return trovate[0] ?? null;
}
