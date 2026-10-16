// Da Seo (Yoast riscritto) ai metadati di Next.
//
// I `robots` NON vengono da Yoast. Sul CMS «Scoraggia i motori di ricerca» e' acceso (deve esserlo),
// e Yoast di conseguenza dichiarerebbe noindex anche sulle pagine del sito vero. Il robots lo
// decide il sito: noindex finche' SITO_NOINDEX non e' "0", poi quello di oggi su Aruba.

import type { Metadata } from "next";
import { noindex } from "./config";
import type { Seo } from "./tipi";

const ROBOTS_OGGI: Metadata["robots"] = {
  index: true,
  follow: true,
  "max-image-preview": "large",
  "max-snippet": -1,
  "max-video-preview": -1,
};

export function robots(indicizzabile = true): Metadata["robots"] {
  if (noindex()) return { index: false, follow: false, nocache: true };
  return indicizzabile ? ROBOTS_OGGI : { index: false, follow: true };
}

/**
 * Il titolo di una pagina d'archivio successiva alla prima, con la regola di Yoast di oggi:
 * « - Pagina N di M» prima dell'ultimo « -», oppure in fondo se non c'e'.
 *   «🎮 Il Platinatore -»                       → «🎮 Il Platinatore - Pagina 2 di 175 -»
 *   «Crimson Desert Archivi - 🎮 Il Platinatore» → «Crimson Desert Archivi - Pagina 2 di 31 - 🎮 Il Platinatore»
 *   «ilplatinatore, Autore presso 🎮 Il Platinatore» → «… 🎮 Il Platinatore - Pagina 2 di 175»
 */
export function titoloPaginato(titolo: string, n: number, totale: number): string {
  const inserto = ` - Pagina ${n} di ${totale}`;
  const i = titolo.lastIndexOf(" -");
  return i === -1 ? `${titolo}${inserto}` : `${titolo.slice(0, i)}${inserto}${titolo.slice(i)}`;
}

/** La stessa Seo per la pagina N di un archivio: titolo e canonical della pagina stessa. */
export function seoPaginata(seo: Seo, n: number, totale: number): Seo {
  if (n <= 1) return seo;
  const titolo = seo.title ? titoloPaginato(seo.title, n, totale) : undefined;
  return {
    ...seo,
    title: titolo,
    ogTitle: seo.ogTitle ? titoloPaginato(seo.ogTitle, n, totale) : titolo,
    canonical: `${seo.canonical}page/${n}/`,
  };
}

export function metadatiDaSeo(seo: Seo, opts: { titoloRiserva?: string; indicizzabile?: boolean } = {}): Metadata {
  return {
    title: { absolute: seo.title ?? opts.titoloRiserva ?? "" },
    description: seo.description,
    alternates: { canonical: seo.canonical },
    robots: robots(opts.indicizzabile ?? true),
    openGraph: {
      title: seo.ogTitle ?? seo.title,
      description: seo.ogDescription ?? seo.description,
      url: seo.canonical,
      siteName: seo.ogSiteName,
      locale: "it_IT",
      type: seo.ogType === "article" ? "article" : "website",
      ...(seo.publishedTime ? { publishedTime: seo.publishedTime } : {}),
      ...(seo.modifiedTime ? { modifiedTime: seo.modifiedTime } : {}),
      images: seo.ogImage ? [{ url: seo.ogImage.url, width: seo.ogImage.width, height: seo.ogImage.height }] : undefined,
    },
    twitter: { card: seo.twitterCard === "summary" ? "summary" : "summary_large_image" },
  };
}
