import { sitemapArticoli } from "@/lib/cms/sitemap-articoli";

export const revalidate = 3600;

// file successivi al primo: esistono solo quando gli articoli superano i 1.000 per file
export function GET() {
  return sitemapArticoli(4);
}
