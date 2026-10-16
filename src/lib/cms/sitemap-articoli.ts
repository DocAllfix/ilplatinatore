// Le sitemap degli articoli, ricostruite come quelle di Yoast di oggi: 1.000 voci per file, ordine
// per data di modifica crescente, la home come prima voce del primo file.

import { sitoPubblico } from "./config";
import { PER_SITEMAP, urlset, type Voce } from "./sitemap";
import { tuttiGliArticoli } from "./wp";

const lastmod = (iso?: string) => (iso ? iso.replace(/\.\d+Z$|Z$/, "+00:00") : undefined);

export async function vociArticoli(): Promise<Voce[]> {
  const pub = sitoPubblico();
  const tutti = await tuttiGliArticoli();
  const ordinati = [...tutti].sort((a, b) => (a.modificato ?? a.data).localeCompare(b.modificato ?? b.data));
  const voci: Voce[] = ordinati.map((a) => ({ loc: `${pub}${a.percorso}`, lastmod: lastmod(a.modificato ?? a.data) }));
  const piuRecente = voci.map((v) => v.lastmod).filter(Boolean).sort().at(-1);
  return [{ loc: `${pub}/`, lastmod: piuRecente }, ...voci];
}

/** Il file numero `n` (1, 2, 3…) delle sitemap degli articoli; 404 se non esiste. */
export async function sitemapArticoli(n: number): Promise<Response> {
  const voci = await vociArticoli();
  const fetta = voci.slice((n - 1) * PER_SITEMAP, n * PER_SITEMAP);
  if (fetta.length === 0) return new Response("Not found", { status: 404 });
  return urlset(fetta);
}

export async function quanteSitemapArticoli(): Promise<number> {
  return Math.ceil((await vociArticoli()).length / PER_SITEMAP);
}

export { lastmod };
