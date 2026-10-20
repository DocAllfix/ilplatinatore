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

/** Una riga di oggetto, come arriva dal campo pl_collezionabili o da una tabella del testo. */
export type RigaOggetto = { area: string; oggetto: string; tipo: string; prerequisito: string; sezione: string; spoiler: string };

/** I titoli h2/h3 del corpo, con l'ancora: per collegare ogni oggetto alla sua spiegazione. */
export type Titolo = { id: string; testo: string };

const normaleNome = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

/**
 * Dove si spiega l'oggetto: la sezione indicata (titolo copiato uguale), altrimenti il primo titolo
 * che contiene il nome dell'oggetto («TR51 Para: fucile d'assalto del Battle Pass» per «TR51 Para»).
 */
export function ancoraPer(oggetto: string, sezione: string, titoli: readonly Titolo[]): string | null {
  const indicata = slug(sezione);
  if (indicata) return titoli.some((t) => t.id === indicata) ? indicata : null;
  const nome = ` ${normaleNome(oggetto)} `;
  if (nome.trim().length < 3) return null;
  return titoli.find((t) => ` ${normaleNome(t.testo)} `.includes(nome))?.id ?? null;
}

/** Gli oggetti nell'ordine della redazione, con id unici e l'ancora della spiegazione. */
export function collezionabiliDaRighe(righe: readonly RigaOggetto[], titoli: readonly Titolo[]): Collezionabile[] {
  const ids = new Set<string>();
  const out: Collezionabile[] = [];
  for (const r of righe) {
    const oggetto = str(r.oggetto);
    if (!oggetto) continue;
    const area = str(r.area) || "Altro";
    // stesso archivio delle spunte dei trofei: il prefisso evita che un oggetto e un trofeo omonimi si confondano
    const base = `c-${slug(`${area} ${oggetto}`) || "oggetto"}`;
    let id = base;
    for (let n = 2; ids.has(id); n++) id = `${base}-${n}`;
    ids.add(id);
    out.push({
      id,
      area,
      oggetto,
      tipo: str(r.tipo) || "Oggetto",
      prerequisito: str(r.prerequisito),
      ancora: ancoraPer(oggetto, str(r.sezione), titoli),
      spoiler: /^(si|sì|s|1|true|yes)$/i.test(str(r.spoiler)),
    });
  }
  return out;
}

/** Le righe del campo pl_collezionabili (scritto dalla redazione o da wpvibe). */
export function righeDaCampi(meta: Meta): RigaOggetto[] {
  return righe(meta?.pl_collezionabili).map((r) => ({
    area: str(r?.area),
    oggetto: str(r?.oggetto),
    tipo: str(r?.tipo),
    prerequisito: str(r?.prerequisito),
    sezione: str(r?.sezione),
    spoiler: str(r?.spoiler),
  }));
}

export function collezionabiliDaCampi(meta: Meta, titoli: readonly Titolo[]): Collezionabile[] {
  return collezionabiliDaRighe(righeDaCampi(meta), titoli);
}

const testoCella = (s: string) =>
  s
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#8217;|&rsquo;/g, "’")
    .replace(/\s*[–—]\s*/g, "-")
    .replace(/\s+/g, " ")
    .trim();

const PRIMA_COLONNA = /^(oggett|arm[ai]|element|collezionabil|da trovare|da sbloccare|ricompens)/i;

/**
 * Ripiego per gli articoli-elenco (piano 07): le tabelle del testo la cui prima colonna e' «Oggetto»
 * (o Arma, Elemento, Collezionabile...) diventano la tabella dei mancanti in testa all'articolo, come
 * gia' le tabelle «Trofeo» diventano la checklist. Colonne riconosciute: Tipo, Area/Zona/Dove,
 * Prerequisito/Requisito/Sblocco, Sezione. Le tabelle si tolgono dal corpo, per non mostrarle due volte.
 * Una tabella con anche UNA colonna non riconosciuta resta nel testo com'e': trasformarla perderebbe
 * quella colonna (parita' del 20/10/2026: «Elemento di gioco / Cosa succede dopo...» di Crimson Desert
 * perdeva la spiegazione).
 */
export function estraiTabelleOggetti(html: string): { righe: RigaOggetto[]; corpo: string } {
  const out: RigaOggetto[] = [];
  const rx = /(?:<figure[^>]*>\s*)?<table[\s\S]*?<\/table>(?:\s*(?:<figcaption[\s\S]*?<\/figcaption>\s*)?<\/figure>)?/gi;
  const corpo = html.replace(rx, (blocco: string) => {
    const righeHtml = blocco.match(/<tr[\s\S]*?<\/tr>/gi) ?? [];
    if (righeHtml.length < 2) return blocco;
    const celle = (r: string) => (r.match(/<t[hd][^>]*>[\s\S]*?<\/t[hd]>/gi) ?? []).map(testoCella);
    const intest = celle(righeHtml[0] ?? "").map((x) => x.toLowerCase());
    if (!PRIMA_COLONNA.test(intest[0] ?? "")) return blocco;
    const col = (rx2: RegExp) => intest.findIndex((h, i) => i > 0 && rx2.test(h));
    const cTipo = col(/^(tipo|categori|classe)/);
    const cArea = col(/^(area|zona|dove|luogo|mappa|capitolo|livello)/);
    const cPre = col(/^(prerequisit|requisit|sblocco|come si sblocca|condizion)/);
    const cSez = col(/^(sezione|soluzione|guida)/);
    const note = new Set([cTipo, cArea, cPre, cSez].filter((i) => i > 0));
    if (intest.slice(1).some((_, i) => !note.has(i + 1))) return blocco;
    const prima = out.length;
    for (const r of righeHtml.slice(1)) {
      const c = celle(r);
      if (!c[0]) continue;
      out.push({
        oggetto: c[0],
        tipo: cTipo > 0 ? (c[cTipo] ?? "") : "",
        area: cArea > 0 ? (c[cArea] ?? "") : "",
        prerequisito: cPre > 0 ? (c[cPre] ?? "") : "",
        sezione: cSez > 0 ? (c[cSez] ?? "") : "",
        spoiler: "",
      });
    }
    return out.length > prima ? "" : blocco;
  });
  return { righe: out, corpo };
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
