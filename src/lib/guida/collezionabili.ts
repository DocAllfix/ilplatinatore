// Collezionabili da spuntare (PDF 06) e correlati contestuali (PDF 07), dai campi pl_collezionabili e
// pl_correlati (mu-plugin, sezione 5). Li scrive la redazione o wpvibe; senza campi non compare nulla.
// Funzioni pure.

import { slug } from "./checklist";

type Meta = Record<string, unknown> | undefined;

export type Collezionabile = {
  id: string;
  area: string;
  oggetto: string;
  tipo: string;
  prerequisito: string;
  /** ancora della sezione che spiega come prenderlo, solo se esiste davvero nel testo */
  ancora: string | null;
  spoiler: boolean;
};

export type Correlato = { id: string; tipo: string; articolo: string; perche: string; dopo: string };

const str = (v: unknown) => (typeof v === "string" ? v.replace(/\s*[–—]\s*/g, "-").trim() : "");
const righe = (v: unknown) => (Array.isArray(v) ? (v as Array<Record<string, unknown>>) : []);

/** Gli oggetti nell'ordine della redazione. `ancore`: gli id dei titoli presenti nel corpo. */
export function collezionabiliDaCampi(meta: Meta, ancore: ReadonlySet<string>): Collezionabile[] {
  const ids = new Set<string>();
  const out: Collezionabile[] = [];
  for (const r of righe(meta?.pl_collezionabili)) {
    const oggetto = str(r?.oggetto);
    if (!oggetto) continue;
    const area = str(r?.area) || "Altro";
    // stesso archivio delle spunte dei trofei: il prefisso evita che un oggetto e un trofeo omonimi si confondano
    const base = `c-${slug(`${area} ${oggetto}`) || "oggetto"}`;
    let id = base;
    for (let n = 2; ids.has(id); n++) id = `${base}-${n}`;
    ids.add(id);
    const sezione = slug(str(r?.sezione));
    out.push({
      id,
      area,
      oggetto,
      tipo: str(r?.tipo) || "Oggetto",
      prerequisito: str(r?.prerequisito),
      ancora: sezione && ancore.has(sezione) ? sezione : null,
      spoiler: /^(si|sì|s|1|true|yes)$/i.test(str(r?.spoiler)),
    });
  }
  return out;
}

const PLURALI: Record<string, string> = {
  ambra: "Ambre",
  arma: "Armi",
  trasmutazione: "Trasmutazioni",
  potenziamento: "Potenziamenti",
  fiaschetta: "Fiaschette",
  indizio: "Indizi",
  oggetto: "Oggetti",
};
export const plurale = (tipo: string) => PLURALI[tipo.toLowerCase()] ?? tipo;

/** Valori distinti nell'ordine in cui compaiono (aree, tipi). */
export function distinti<T>(voci: T[], chiave: (v: T) => string): string[] {
  return [...new Set(voci.map(chiave))];
}

/** I correlati validi; `dopo` e' l'ancora della sezione alla cui fine vanno. */
export function correlatiDaCampi(meta: Meta): Correlato[] {
  return righe(meta?.pl_correlati)
    .map((r, i) => ({
      id: `correlato-${i + 1}`,
      tipo: str(r?.tipo) || "Leggi anche",
      // lo slug, anche se la redazione incolla l'indirizzo intero
      articolo: str(r?.articolo).replace(/\/+$/, "").split("/").pop()!.toLowerCase(),
      perche: str(r?.perche),
      dopo: slug(str(r?.dopo_sezione)),
    }))
    .filter((c) => c.articolo && c.dopo);
}

export const SEGNAPOSTO_CORRELATO = (id: string) => `<!--correlato:${id}-->`;

/**
 * Mette il segnaposto di ogni correlato alla fine della sezione indicata: subito prima dell'h2
 * successivo, o in fondo al corpo. HTML con le ancore gia' assegnate. Quelli senza sezione si scartano.
 */
export function collocaCorrelati(html: string, correlati: Correlato[]): { html: string; collocati: Correlato[] } {
  const titoli = [...html.matchAll(/<h2[^>]*\sid="([^"]+)"[^>]*>/gi)].map((m) => ({ id: m[1], at: m.index! }));
  const inserti: Array<{ at: number; testo: string }> = [];
  const collocati: Correlato[] = [];
  for (const c of correlati) {
    const i = titoli.findIndex((t) => t.id === c.dopo);
    if (i < 0) continue;
    inserti.push({ at: titoli[i + 1]?.at ?? html.length, testo: SEGNAPOSTO_CORRELATO(c.id) });
    collocati.push(c);
  }
  // dal fondo, cosi' le posizioni non si spostano; a parita' di posto resta l'ordine della redazione
  let out = html;
  for (const x of inserti.map((x, n) => ({ ...x, n })).sort((p, q) => q.at - p.at || q.n - p.n)) {
    out = out.slice(0, x.at) + x.testo + out.slice(x.at);
  }
  return { html: out, collocati };
}
