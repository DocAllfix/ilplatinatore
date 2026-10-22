// Sitemap con gli STESSI nomi di Yoast (/sitemap_index.xml, /post-sitemap.xml, /post-sitemap2.xml…):
// Search Console le conosce gia', e cambiarle vorrebbe dire rinviarle e aspettare.
// `lastmod` solo quando la data e' nota: un valore «adesso» a ogni richiesta insegna a Google a
// ignorare il campo (regola del riferimento).

export const PER_SITEMAP = 1000; // come Yoast

/** `immagini`: come Yoast, l'immagine in evidenza e quelle del testo (Google Immagini le trova da qui). */
export type Voce = { loc: string; lastmod?: string; immagini?: string[]; id?: number };

/**
 * Un indirizzo come lo scrive Yoast: i caratteri non ASCII codificati (Δ -> %CE%94), il resto com'e'
 * (un %XX gia' presente non si codifica due volte), poi le entita' dell'XML.
 */
export function indirizzoXml(u: string): string {
  return u
    .replace(/[^\x21-\x7e]/gu, (c) => encodeURIComponent(c))
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function urlset(voci: Voce[]): Response {
  const corpo = voci
    .map((v) => {
      const lastmod = v.lastmod ? `\n\t\t<lastmod>${v.lastmod}</lastmod>` : "";
      const immagini = (v.immagini ?? [])
        .map((i) => `\n\t\t<image:image>\n\t\t\t<image:loc>${indirizzoXml(i)}</image:loc>\n\t\t</image:image>`)
        .join("");
      return `\t<url>\n\t\t<loc>${v.loc}</loc>${lastmod}${immagini}\n\t</url>`;
    })
    .join("\n");
  return xml(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
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
