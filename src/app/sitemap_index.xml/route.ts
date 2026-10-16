import { sitoPubblico } from "@/lib/cms/config";
import { indice, ultimo } from "@/lib/cms/sitemap";
import { PER_SITEMAP } from "@/lib/cms/sitemap";
import { vociArticoli } from "@/lib/cms/sitemap-articoli";

export const revalidate = 3600;

export async function GET() {
  const pub = sitoPubblico();
  const voci = await vociArticoli();
  const file = [];
  for (let n = 1; (n - 1) * PER_SITEMAP < voci.length; n++) {
    const fetta = voci.slice((n - 1) * PER_SITEMAP, n * PER_SITEMAP);
    file.push({ loc: `${pub}/post-sitemap${n === 1 ? "" : n}.xml`, lastmod: ultimo(fetta) });
  }
  return indice([
    ...file,
    { loc: `${pub}/page-sitemap.xml` },
    { loc: `${pub}/category-sitemap.xml` },
    { loc: `${pub}/post_tag-sitemap.xml` },
    { loc: `${pub}/author-sitemap.xml` },
  ]);
}
