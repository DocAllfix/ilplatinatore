import { sitoPubblico } from "@/lib/cms/config";
import { indice, ultimo } from "@/lib/cms/sitemap";
import { fileArticoli, lastmod, ultimaPerTermine } from "@/lib/cms/sitemap-articoli";
import { tutteLePagine } from "@/lib/cms/wp";

export const revalidate = 3600;

// lastmod di ogni file come Yoast: la data piu' recente fra le sue voci. L'autore non ce l'ha: Yoast
// usa la data di aggiornamento del profilo, che la REST non espone (differenza dichiarata).
export async function GET() {
  const pub = sitoPubblico();
  const [file, pagine, categorie, tag] = await Promise.all([fileArticoli(), tutteLePagine(), ultimaPerTermine("categorie"), ultimaPerTermine("tag")]);
  const massimo = (m: Map<number, string>) => [...m.values()].sort().at(-1);
  return indice([
    ...file.map((f, i) => ({ loc: `${pub}/post-sitemap${i === 0 ? "" : i + 1}.xml`, lastmod: ultimo(f) })),
    { loc: `${pub}/page-sitemap.xml`, lastmod: pagine.map((p) => lastmod(p.modified_gmt ? `${p.modified_gmt}Z` : undefined)).filter(Boolean).sort().at(-1) },
    { loc: `${pub}/category-sitemap.xml`, lastmod: massimo(categorie) },
    { loc: `${pub}/post_tag-sitemap.xml`, lastmod: massimo(tag) },
    { loc: `${pub}/author-sitemap.xml` },
  ]);
}
