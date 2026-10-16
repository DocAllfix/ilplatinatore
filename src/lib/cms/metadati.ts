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
