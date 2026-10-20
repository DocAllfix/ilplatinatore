// Da Seo (Yoast riscritto) ai metadati di Next.
//
// I `robots` NON vengono da Yoast. Sul CMS «Scoraggia i motori di ricerca» e' acceso (deve esserlo),
// e Yoast di conseguenza dichiarerebbe noindex anche sulle pagine del sito vero. Il robots lo
// decide il sito: noindex finche' SITO_NOINDEX non e' "0", poi quello di oggi su Aruba.

import type { Metadata } from "next";
import { noindex } from "./config";
import { decodificaEntita } from "./mappa";
import { schemaPaginato } from "./seo";
import type { Articolo, Seo } from "./tipi";

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
 * robots della pagina, piu' (solo sull'anteprima in noindex) quello che dira' dopo il passaggio,
 * nella stessa forma di Yoast: lo confronta il controllo di parita' (scripts/qa/parita.py).
 */
export function robotsConDopo(indicizzabile = true): Pick<Metadata, "robots" | "other"> {
  if (!noindex()) return { robots: robots(indicizzabile) };
  const dopo = indicizzabile ? "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" : "noindex, follow";
  return { robots: robots(indicizzabile), other: { "platinatore-robots-dopo": dopo } };
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

/**
 * La stessa Seo per la pagina N di un archivio: titolo, canonical e schema della pagina stessa.
 * `primo` e' il primo articolo della pagina: la sua immagine e' l'immagine principale nello schema.
 */
export function seoPaginata(seo: Seo, n: number, totale: number, primo?: Articolo): Seo {
  if (n <= 1) return seo;
  const titolo = seo.title ? titoloPaginato(seo.title, n, totale) : undefined;
  const canonical = `${seo.canonical}page/${n}/`;
  const img = primo?.immagine;
  return {
    ...seo,
    title: titolo,
    ogTitle: seo.ogTitle ? titoloPaginato(seo.ogTitle, n, totale) : titolo,
    canonical,
    schema: seo.schema && seo.canonical
      ? schemaPaginato(seo.schema, seo.canonical, canonical, titolo ?? "", img && {
          url: img.src.replace(/\?.*$/, ""),
          larghezza: img.larghezza,
          altezza: img.altezza,
          didascalia: img.alt || undefined,
        })
      : seo.schema,
  };
}

// Yoast passa i testi con le entita' di HTML («SMG &amp; Pump»); Next le scrive a sua volta: senza
// decodificarle qui, la pagina mostrerebbe «&amp;» (trovato dalla parita' il 20/10/2026).
const t = (s: string | undefined) => (s === undefined ? undefined : decodificaEntita(s));

export function metadatiDaSeo(seo: Seo, opts: { titoloRiserva?: string; indicizzabile?: boolean } = {}): Metadata {
  return {
    title: { absolute: t(seo.title) ?? opts.titoloRiserva ?? "" },
    description: t(seo.description),
    alternates: { canonical: seo.canonical },
    ...robotsConDopo(opts.indicizzabile ?? true),
    openGraph: {
      title: t(seo.ogTitle ?? seo.title),
      description: t(seo.ogDescription ?? seo.description),
      url: seo.canonical,
      siteName: t(seo.ogSiteName),
      locale: "it_IT",
      type: seo.ogType === "article" ? "article" : "website",
      ...(seo.publishedTime ? { publishedTime: seo.publishedTime } : {}),
      ...(seo.modifiedTime ? { modifiedTime: seo.modifiedTime } : {}),
      images: seo.ogImage ? [{ url: seo.ogImage.url, width: seo.ogImage.width, height: seo.ogImage.height }] : undefined,
    },
    twitter: { card: seo.twitterCard === "summary" ? "summary" : "summary_large_image" },
  };
}
