// Le sitemap degli articoli, ricostruite come quelle di Yoast di oggi (verificate con la parita' il
// 20/10/2026):
// - ordine per data di modifica crescente;
// - il primo file ha la home IN PIU' dei 1.000 articoli (1.001 voci), i successivi 1.000 articoli;
// - lastmod di un articolo: la modifica se e' piu' recente della pubblicazione, altrimenti la
//   pubblicazione (un articolo programmato esce dopo la sua ultima modifica);
// - lastmod di categorie e tag: quello dell'articolo piu' recente che contengono.

import { sitoPubblico } from "./config";
import { PER_SITEMAP, urlset, type Voce } from "./sitemap";
import type { VoceArticolo } from "./tipi";
import { tuttiGliArticoli } from "./wp";

const lastmod = (iso?: string) => (iso ? iso.replace(/\.\d+Z$|Z$/, "+00:00") : undefined);

/** La data di Yoast per un articolo: la piu' recente fra modifica e pubblicazione. */
export function dataYoast(a: Pick<VoceArticolo, "data" | "modificato">): string | undefined {
  const m = a.modificato && a.modificato > a.data ? a.modificato : a.data;
  return lastmod(m || undefined);
}

/** I file delle sitemap degli articoli: il primo con la home davanti. */
export async function fileArticoli(): Promise<Voce[][]> {
  const pub = sitoPubblico();
  const tutti = await tuttiGliArticoli();
  const ordinati = [...tutti].sort((a, b) => (a.modificato ?? a.data).localeCompare(b.modificato ?? b.data));
  const voci: Voce[] = ordinati.map((a) => ({ loc: `${pub}${a.percorso}`, lastmod: dataYoast(a) }));
  const piuRecente = voci.map((v) => v.lastmod).filter(Boolean).sort().at(-1);
  const file: Voce[][] = [];
  for (let i = 0; i < voci.length; i += PER_SITEMAP) file.push(voci.slice(i, i + PER_SITEMAP));
  if (!file.length) file.push([]);
  file[0] = [{ loc: `${pub}/`, lastmod: piuRecente }, ...file[0]];
  return file;
}

/** Il file numero `n` (1, 2, 3…) delle sitemap degli articoli; 404 se non esiste. */
export async function sitemapArticoli(n: number): Promise<Response> {
  const fetta = (await fileArticoli())[n - 1];
  if (!fetta?.length) return new Response("Not found", { status: 404 });
  return urlset(fetta);
}

/** Per ogni categoria o tag (id), il lastmod dell'articolo piu' recente che lo contiene. */
export async function ultimaPerTermine(campo: "categorie" | "tag"): Promise<Map<number, string>> {
  const m = new Map<number, string>();
  for (const a of await tuttiGliArticoli()) {
    const d = dataYoast(a);
    if (!d) continue;
    for (const id of a[campo] ?? []) if (!m.has(id) || m.get(id)! < d) m.set(id, d);
  }
  return m;
}

export { lastmod };
