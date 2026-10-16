import { sitoPubblico } from "@/lib/cms/config";
import { urlset } from "@/lib/cms/sitemap";
import { tuttiITermini } from "@/lib/cms/wp";

export const revalidate = 3600;

// come Yoast: i tag senza articoli non entrano in sitemap
export async function GET() {
  const pub = sitoPubblico();
  const t = await tuttiITermini("tags");
  return urlset(t.filter((x) => x.count > 0).map((x) => ({ loc: `${pub}/tag/${x.slug}/` })));
}
