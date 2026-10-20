import { sitoPubblico } from "@/lib/cms/config";
import { urlset } from "@/lib/cms/sitemap";
import { ultimaPerTermine } from "@/lib/cms/sitemap-articoli";
import { tuttiITermini } from "@/lib/cms/wp";

export const revalidate = 3600;

// come Yoast: lastmod della categoria = quello del suo articolo piu' recente
export async function GET() {
  const pub = sitoPubblico();
  const [t, date] = await Promise.all([tuttiITermini("categories"), ultimaPerTermine("categorie")]);
  return urlset(t.filter((x) => x.count > 0).map((x) => ({ loc: `${pub}/category/${x.slug}/`, lastmod: date.get(x.id) })));
}
