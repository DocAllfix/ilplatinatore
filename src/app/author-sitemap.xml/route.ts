import { sitoPubblico } from "@/lib/cms/config";
import { urlset } from "@/lib/cms/sitemap";
import { tuttiGliAutori } from "@/lib/cms/wp";

export const revalidate = 3600;

export async function GET() {
  const pub = sitoPubblico();
  return urlset((await tuttiGliAutori()).map((a) => ({ loc: `${pub}/author/${a.slug}/` })));
}
