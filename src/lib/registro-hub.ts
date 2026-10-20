// Il registro degli hub (approvato dal proprietario il 20/10/2026): ogni tag e' l'hub del suo gioco,
// tranne gli esclusi; le sezioni nascono dai titoli degli articoli. Il testo sta nel CMS (Strumenti >
// Registro degli hub, mu-plugin sezione 10) e si legge qui. Funzioni pure.
//
// Formato, una riga per sezione, nell'ordine in cui si provano (vince la prima che combacia):
//   Collezionabili: collezionabil*, posizion*, dove trovar*
//   Generico: Come fare e consigli
//   Esclusi: novita, playstation-5
// Una parola che finisce con * vale con qualunque finale. Le righe che iniziano con # sono note.

export type Registro = { sezioni: Array<{ nome: string; parole: string[] }>; generico: string; esclusi: string[] };

const VUOTO: Registro = { sezioni: [], generico: "Come fare e consigli", esclusi: [] };

/** Minuscole, senza accenti, apostrofo dritto: «Abilità» e «abilita» sono la stessa parola. */
export function normale(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[’‘]/g, "'");
}

export function leggiRegistro(testo: string | undefined): Registro {
  const r: Registro = { sezioni: [], generico: VUOTO.generico, esclusi: [] };
  for (const riga of (testo ?? "").split(/\r?\n/)) {
    const t = riga.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf(":");
    if (i < 1) continue;
    const nome = t.slice(0, i).trim();
    const valori = t
      .slice(i + 1)
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);
    if (/^generico$/i.test(nome)) r.generico = valori.join(", ") || r.generico;
    else if (/^esclusi$/i.test(nome)) r.esclusi = valori.map((x) => x.toLowerCase());
    else if (valori.length) r.sezioni.push({ nome, parole: valori });
  }
  return r;
}

const ESC = /[.*+?^${}()|[\]\\]/g;
function regola(parola: string): RegExp {
  const aperta = parola.endsWith("*");
  const base = normale(aperta ? parola.slice(0, -1) : parola).replace(ESC, "\\$&");
  return new RegExp(`(?<![\\p{L}\\p{N}_])${base}${aperta ? "[\\p{L}\\p{N}_]*" : "(?![\\p{L}\\p{N}_])"}`, "u");
}

const compilati = new WeakMap<Registro, Array<[string, RegExp[]]>>();
function regole(r: Registro): Array<[string, RegExp[]]> {
  let c = compilati.get(r);
  if (!c) {
    c = r.sezioni.map((s) => [s.nome, s.parole.map(regola)]);
    compilati.set(r, c);
  }
  return c;
}

/** La sezione di un titolo: la prima che combacia; il nome del gioco nel titolo non conta. */
export function sezioneDi(titolo: string, gioco: string, r: Registro): string {
  let t = normale(titolo);
  if (gioco) t = t.split(normale(gioco)).join(" ");
  return regole(r).find(([, rx]) => rx.some((x) => x.test(t)))?.[0] ?? r.generico;
}

/**
 * Le guide divise per sezione, dalla sezione con piu' articoli (le «occorrenze» del proprietario);
 * a parita' vale l'ordine del registro; il generico sempre per ultimo. Le sezioni vuote non ci sono.
 */
export function perSezione<T extends { titolo: string }>(guide: T[], gioco: string, r: Registro): Array<{ aiuto: string; guide: T[] }> {
  const gruppi = new Map<string, T[]>();
  for (const g of guide) {
    const s = sezioneDi(g.titolo, gioco, r);
    gruppi.set(s, [...(gruppi.get(s) ?? []), g]);
  }
  const posto = (s: string) => (s === r.generico ? Infinity : r.sezioni.findIndex((x) => x.nome === s));
  return [...gruppi.entries()]
    .sort(([a, ga], [b, gb]) => (a === r.generico ? 1 : b === r.generico ? -1 : gb.length - ga.length || posto(a) - posto(b)))
    .map(([aiuto, guide]) => ({ aiuto, guide }));
}

/** Un tag e' un hub se non e' fra gli esclusi (e ha articoli: lo controlla chi chiama). */
export function eHub(slug: string, r: Registro): boolean {
  return !r.esclusi.includes(slug.toLowerCase());
}

/** La parola breve di una sezione per titolo e descrizione: «Sfide ed eventi» → «sfide». */
const breve = (s: string) => s.split(/[\s,]+/)[0].toLowerCase();

/**
 * Titolo dell'hub per Google, dalle sezioni che ci sono davvero (niente «trofei e Platino» per un gioco
 * che non li ha): «Valor Mortis: guide, Platino e collezionabili», «EA Sports FC 27: guide, sfide e build».
 */
export function argomentiHub(sezioni: string[], platino: boolean, r: Registro): string[] {
  const nomi = sezioni.filter((s) => s !== r.generico).map(breve);
  return [...(platino ? ["Platino"] : []), ...nomi.filter((n) => !(platino && n === "trofei"))];
}

export function titoloHub(nome: string, argomenti: string[]): string {
  const due = argomenti.slice(0, 2);
  return due.length ? `${nome}: guide, ${due.join(" e ")}` : `${nome}: guide e consigli`;
}

/** Descrizione per i motori: tutte le sezioni presenti, sotto i 160 caratteri. */
export function descrizioneDaSezioni(nome: string, argomenti: string[]): string {
  const elenco = argomenti.length > 1 ? `${argomenti.slice(0, -1).join(", ")} e ${argomenti.at(-1)}` : argomenti[0];
  const d = elenco ? `Tutte le guide di ${nome} sul Platinatore: ${elenco}, con i consigli per giocare.` : `Tutte le guide e i consigli di ${nome} sul Platinatore.`;
  return d.length <= 158 ? d : `${d.slice(0, 155).replace(/\s+\S*$/, "")}…`;
}
