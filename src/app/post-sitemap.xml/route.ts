import { sitemapArticoli } from "@/lib/cms/sitemap-articoli";

export const revalidate = 3600;

export function GET() {
  return sitemapArticoli(1);
}
