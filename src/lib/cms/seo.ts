// Riscrittura degli URL e metadati da Yoast. Adattato da EvalisDeck.
//
// E' LA PARTE PIU' IMPORTANTE DEL SITO. Yoast genera canonical, og:url e schema puntati al dominio
// del CMS. Pubblicati cosi', ogni articolo direbbe a Google «l'originale sta su cms.…», un dominio
// chiuso e noindex, e il sito sparirebbe dalla ricerca. Regola senza eccezioni: WordPress fornisce
// i VALORI, il frontend decide gli URL.
//
// Differenza dal riferimento: il titolo di Yoast si tiene COSI' COM'E'. La copia deve essere
// identica al sito di oggi (verifica di parita'), e qui il layout non accoda il marchio.

import type { Seo } from "./tipi";

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Ogni URL del CMS (http o https, con o senza www) diventa lo stesso percorso sul dominio pubblico. */
/**
 * Versione degli indirizzi delle immagini caricate. Cambiarla obbliga browser e Vercel a riscaricarle:
 * il 17/10/2026 alcuni 502 (WordPress fermo) erano stati conservati per 30 giorni come se fossero
 * immagini, e i telefoni le mostravano rotte. Il CMS ignora il parametro e serve lo stesso file.
 */
export const VERSIONE_IMMAGINI = "2";
const RX_CARICATE = /(\/wp-content\/uploads\/[^"'\s?#)]+\.(?:jpe?g|png|webp|avif|gif))(?![?\w])/gi;

/** Aggiunge la versione agli indirizzi delle immagini caricate (una volta sola). */
export function conVersione(testo: string): string {
  return testo ? testo.replace(RX_CARICATE, `$1?v=${VERSIONE_IMMAGINI}`) : testo;
}

export function riportaSuPubblico(testo: string, cms: string, pubblico: string): string {
  if (!testo || !cms) return testo ?? "";
  const host = cms.replace(/^https?:\/\//, "").replace(/\/+$/, "");
  const rx = new RegExp(`https?:(\\\\?/\\\\?/)(www\\.)?${escapeRe(host)}`, "gi");
  const pub = pubblico.replace(/\/+$/, "");
  // `\\/\\/` copre anche gli URL dentro JSON con le barre scappate ("https:\/\/cms…")
  return testo.replace(rx, (_m, barre: string) => (barre.includes("\\") ? pub.replace(/\//g, "\\/") : pub));
}

/** Riporta sul dominio pubblico ogni stringa dentro un valore qualsiasi (lo schema di Yoast). */
export function riportaInProfondita<T>(valore: T, cms: string, pubblico: string): T {
  return JSON.parse(riportaSuPubblico(JSON.stringify(valore), cms, pubblico)) as T;
}

type YoastHead = Record<string, unknown>;

/** Traduce `yoast_head_json`. Il canonical e' sempre il nostro: `pubblico + percorso`. */
export function seoDaYoast(
  yoast: YoastHead | undefined,
  opts: { percorso: string; cms: string; pubblico: string },
): Seo {
  const y = riportaInProfondita(yoast ?? {}, opts.cms, opts.pubblico);
  const s = (k: string): string | undefined => {
    const v = y[k];
    return typeof v === "string" && v.trim() ? v.trim() : undefined;
  };
  const og = (y["og_image"] as Array<{ url?: string; width?: number; height?: number }> | undefined)?.[0];
  return {
    title: s("title"),
    description: s("description"),
    canonical: `${opts.pubblico}${opts.percorso}`,
    ogTitle: s("og_title"),
    ogDescription: s("og_description"),
    ogType: s("og_type"),
    ogImage: og?.url ? { url: og.url, width: og.width, height: og.height } : undefined,
    ogSiteName: s("og_site_name"),
    twitterCard: s("twitter_card"),
    publishedTime: s("article_published_time"),
    modifiedTime: s("article_modified_time"),
    schema: y["schema"],
  };
}

/**
 * Serializza dati strutturati per <script type="application/ld+json">. JSON.stringify non scappa
 * `<`: un titolo con `</script>` chiuderebbe il tag. Si scappano anche `>` e U+2028/U+2029.
 */
export function jsonLd(dato: unknown): string {
  return JSON.stringify(dato)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(new RegExp(String.fromCharCode(0x2028), "g"), "\\u2028")
    .replace(new RegExp(String.fromCharCode(0x2029), "g"), "\\u2029");
}
