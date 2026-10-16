// Feed RSS su /feed/, come oggi: 10 articoli, con il riassunto (impostazioni di WordPress:
// posts_per_rss = 10, rss_use_excerpt = 1). Aggregatori e lettori lo usano: va mantenuto.

import { sitoPubblico } from "@/lib/cms/config";
import { paginaArticoli } from "@/lib/cms/wp";

export const revalidate = 3600;

const x = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export async function GET() {
  const pub = sitoPubblico();
  const r = await paginaArticoli({ pagina: 1 });
  const voci = (r?.articoli ?? [])
    .map(
      (a) => `    <item>
      <title>${x(a.titolo)}</title>
      <link>${pub}${a.percorso}</link>
      <guid isPermaLink="false">${pub}/?p=${a.id}</guid>
      <pubDate>${new Date(a.data).toUTCString()}</pubDate>
      ${a.autore ? `<dc:creator><![CDATA[${a.autore.nome}]]></dc:creator>` : ""}
      ${[...a.categorie, ...a.tag].map((t) => `<category><![CDATA[${t.nome}]]></category>`).join("")}
      <description><![CDATA[${a.riassunto}]]></description>
    </item>`,
    )
    .join("\n");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>🎮 Il Platinatore</title>
    <atom:link href="${pub}/feed/" rel="self" type="application/rss+xml" />
    <link>${pub}/</link>
    <description></description>
    <language>it-IT</language>
${voci}
  </channel>
</rss>`;
  return new Response(xml, { headers: { "Content-Type": "application/rss+xml; charset=UTF-8" } });
}
