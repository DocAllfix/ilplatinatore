// Sitemap con gli STESSI nomi di Yoast (/sitemap_index.xml, /post-sitemap.xml, /post-sitemap2.xml…):
// Search Console le conosce gia', e cambiarle vorrebbe dire rinviarle e aspettare.
// `lastmod` solo quando la data e' nota: un valore «adesso» a ogni richiesta insegna a Google a
// ignorare il campo (regola del riferimento).

export const PER_SITEMAP = 1000; // come Yoast

export type Voce = { loc: string; lastmod?: string };

export function urlset(voci: Voce[]): Response {
  const corpo = voci
    .map((v) => `\t<url>\n\t\t<loc>${v.loc}</loc>${v.lastmod ? `\n\t\t<lastmod>${v.lastmod}</lastmod>` : ""}\n\t</url>`)
    .join("\n");
  return xml(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${corpo}
</urlset>`);
}

export function indice(voci: Voce[]): Response {
  const corpo = voci
    .map((v) => `\t<sitemap>\n\t\t<loc>${v.loc}</loc>${v.lastmod ? `\n\t\t<lastmod>${v.lastmod}</lastmod>` : ""}\n\t</sitemap>`)
    .join("\n");
  return xml(`<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${corpo}
</sitemapindex>`);
}

function xml(s: string): Response {
  return new Response(s, { headers: { "Content-Type": "text/xml; charset=UTF-8" } });
}

/** Il piu' recente fra i lastmod, per l'indice. */
export function ultimo(voci: Voce[]): string | undefined {
  return voci.map((v) => v.lastmod).filter(Boolean).sort().at(-1);
}
