import { sitoPubblico } from "@/lib/cms/config";
import { urlset } from "@/lib/cms/sitemap";
import { tuttiITermini } from "@/lib/cms/wp";

export const revalidate = 3600;

export async function GET() {
  const pub = sitoPubblico();
  const t = await tuttiITermini("categories");
  return urlset(t.filter((x) => x.count > 0).map((x) => ({ loc: `${pub}/category/${x.slug}/` })));
}
