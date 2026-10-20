import { sitoPubblico } from "@/lib/cms/config";
import { urlset } from "@/lib/cms/sitemap";
import { ultimaPerTermine } from "@/lib/cms/sitemap-articoli";
import { tuttiITermini } from "@/lib/cms/wp";

export const revalidate = 3600;

// come Yoast: i tag senza articoli non entrano in sitemap; lastmod = quello dell'articolo piu' recente
export async function GET() {
  const pub = sitoPubblico();
  const [t, date] = await Promise.all([tuttiITermini("tags"), ultimaPerTermine("tag")]);
  return urlset(t.filter((x) => x.count > 0).map((x) => ({ loc: `${pub}/tag/${x.slug}/`, lastmod: date.get(x.id) })));
}
