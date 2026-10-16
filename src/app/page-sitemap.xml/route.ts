import { sitoPubblico } from "@/lib/cms/config";
import { lastmod } from "@/lib/cms/sitemap-articoli";
import { urlset } from "@/lib/cms/sitemap";
import { tutteLePagine } from "@/lib/cms/wp";

export const revalidate = 3600;

export async function GET() {
  const pub = sitoPubblico();
  const pagine = await tutteLePagine();
  return urlset([{ loc: `${pub}/` }, ...pagine.map((p) => ({ loc: `${pub}/${p.slug}/`, lastmod: lastmod(p.modified_gmt ? `${p.modified_gmt}Z` : undefined) }))]);
}
