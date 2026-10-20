// Recensioni (richiesta del proprietario, 20/10/2026): il voto dello shortcode [platinatore_voto]
// (che il CMS rende come sul sito di oggi, mu-plugin sezione 11), la scheda del verdetto e i
// correlati automatici. Funzioni pure.

import type { Correlato } from "./guida/collezionabili";

export type Voto = { valore: number; scala: number };
export type Fascia = "alta" | "media" | "bassa";

/** Tre fasce come su IGN, sul voto riportato a 10: dall'8 in su, dal 6, sotto il 6. */
export function fascia(v: Voto): Fascia {
  const su10 = (v.valore / v.scala) * 10;
  return su10 >= 8 ? "alta" : su10 >= 6 ? "media" : "bassa";
}

/** «7,5»: virgola italiana, niente zeri inutili. */
export const votoTesto = (n: number) => String(Math.round(n * 10) / 10).replace(".", ",");

const numero = (v: unknown) => {
  // un campo vuoto non e' uno zero
  const n = typeof v === "string" && v.trim() ? Number(v.replace(",", ".")) : typeof v === "number" ? v : NaN;
  return Number.isFinite(n) ? n : null;
};

/** Il voto dai campi pl_voto e pl_voto_scala, che il CMS copia dallo shortcode. */
export function votoDaMeta(meta: Record<string, unknown> | undefined): Voto | null {
  const valore = numero(meta?.pl_voto);
  const scala = numero(meta?.pl_voto_scala) ?? 10;
  return valore !== null && scala > 0 ? { valore, scala } : null;
}

export const eRecensione = (a: { categorie: Array<{ slug: string }> }) => a.categorie.some((c) => c.slug === "recensioni");

export const SEGNAPOSTO_VERDETTO = "<!--verdetto:1-->";

const VOTO = /<div class="platinatore-voto"[^>]*>([\s\S]*?)<\/div>/i;
const testoDi = (s: string) => s.replace(/<[^>]+>/g, "").trim();

/**
 * Stacca dal testo la scheda del verdetto: il voto e i paragrafi che lo seguono subito (il verdetto
 * finale), piu' il titolo «Verdetto» che li precede, se c'e'. Al loro posto un segnaposto: la pagina
 * mette li' la scheda. Senza voto il testo resta com'e'.
 */
export function estraiVerdetto(html: string): { voto: Voto | null; titolo: string; verdetto: string; corpo: string } {
  const m = html.match(VOTO);
  if (!m || m.index === undefined) return { voto: null, titolo: "", verdetto: "", corpo: html };
  const valore = numero(testoDi(m[1].match(/platinatore-voto__numero[^>]*>([\s\S]*?)</i)?.[1] ?? ""));
  const scala = numero(testoDi(m[1].match(/platinatore-voto__scala[^>]*>([\s\S]*?)</i)?.[1] ?? "").replace("/", "")) ?? 10;
  if (valore === null || !(scala > 0)) return { voto: null, titolo: "", verdetto: "", corpo: html };

  let inizio = m.index;
  let titolo = "Il verdetto";
  // SOLO l'ultimo titolo, subito prima del voto: il contenuto del titolo non puo' attraversare altri
  // tag di titolo (20/10/2026: con [\s\S]*? la ricerca partiva dal PRIMO titolo dell'articolo e il
  // corpo intero, fino al voto, spariva dalla pagina)
  const prima = html.slice(0, inizio).match(/<h([23])[^>]*>((?:(?!<\/?h[1-6][\s>])[\s\S])*)<\/h\1>\s*$/i);
  if (prima && /verdett/i.test(testoDi(prima[2]))) {
    inizio -= prima[0].length;
    titolo = testoDi(prima[2]);
  }
  let fine = m.index + m[0].length;
  const paragrafi: string[] = [];
  for (let p = html.slice(fine).match(/^\s*(<p[\s>][\s\S]*?<\/p>)/i); p; p = html.slice(fine).match(/^\s*(<p[\s>][\s\S]*?<\/p>)/i)) {
    paragrafi.push(p[1]);
    fine += p[0].length;
  }
  return { voto: { valore, scala }, titolo, verdetto: paragrafi.join("\n"), corpo: html.slice(0, inizio) + SEGNAPOSTO_VERDETTO + html.slice(fine) };
}

/**
 * Correlati automatici della recensione: una guida dello stesso gioco ogni due sezioni (dopo la 2a,
 * la 4a, la 6a), prima la guida al Platino. Valgono solo se la redazione non li ha scelti a mano.
 */
export function correlatiAutomatici(
  idSezioni: string[],
  guide: Array<{ slug: string }>,
  platino: { slug: string } | null,
): Correlato[] {
  const ordinate = [...(platino ? [platino] : []), ...guide.filter((g) => g.slug !== platino?.slug)];
  const posti = idSezioni.filter((_, i) => i % 2 === 1).slice(0, 3);
  return posti.slice(0, ordinate.length).map((dopo, i) => ({
    id: `automatico-${i + 1}`,
    tipo: i === 0 && platino ? "Guida al Platino" : "Leggi anche",
    articolo: ordinate[i].slug,
    perche: "",
    dopo,
  }));
}
