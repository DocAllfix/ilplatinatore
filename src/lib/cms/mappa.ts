// Traduzione dei post WordPress nella forma del sito. Funzioni PURE: si provano con un post finto.

import { sanificaHtml, soloTesto } from "./sanitize";
import { riportaSuPubblico } from "./seo";
import type { Articolo, Immagine, PostWP, Termine, VoceArticolo } from "./tipi";

const ENTITA: Record<string, string> = {
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ",
  agrave: "à", egrave: "è", eacute: "é", igrave: "ì", ograve: "ò", ugrave: "ù",
  Agrave: "À", Egrave: "È", Eacute: "É", Igrave: "Ì", Ograve: "Ò", Ugrave: "Ù",
  ccedil: "ç", ntilde: "ñ", uuml: "ü", ouml: "ö", auml: "ä",
  laquo: "«", raquo: "»", ldquo: "“", rdquo: "”", lsquo: "‘", rsquo: "’",
  ndash: "–", mdash: "—", hellip: "…", deg: "°", euro: "€", copy: "©", reg: "®", trade: "™",
  middot: "·", bull: "•", times: "×",
};

/** WordPress salva «Cos&#8217;&egrave;» nei titoli: qui tornano caratteri veri. */
export function decodificaEntita(s: string | undefined): string {
  if (!s) return "";
  return s
    .replace(/&#(\d+);/g, (_, n: string) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n: string) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&([a-zA-Z][a-zA-Z0-9]*);/g, (intero, nome: string) => ENTITA[nome] ?? intero)
    .trim();
}

/**
 * L'indirizzo di oggi, /AAAA/MM/GG/slug/, dalla data LOCALE di WordPress (campo `date`).
 * Mai da `date_gmt`: il sito ha fuso fisso +2, e un articolo pubblicato all'01:00 cambierebbe giorno.
 */
export function percorsoArticolo(dataLocale: string, slug: string): string {
  const [anno, mese, giorno] = dataLocale.slice(0, 10).split("-");
  return `/${anno}/${mese}/${giorno}/${slug}/`;
}

function utc(d: string | undefined): string | undefined {
  return d ? `${d.replace(/Z$/, "")}Z` : undefined;
}

function termini(post: PostWP, tassonomia: string): Termine[] {
  const out: Termine[] = [];
  for (const gruppo of post._embedded?.["wp:term"] ?? []) {
    for (const t of gruppo ?? []) {
      if (t?.taxonomy === tassonomia && t.name && t.slug) out.push({ nome: decodificaEntita(t.name), slug: t.slug });
    }
  }
  return out;
}

function immagine(post: PostWP, cms: string, pubblico: string): Immagine | undefined {
  const m = post._embedded?.["wp:featuredmedia"]?.[0];
  if (!m?.source_url) return undefined;
  const r = (u: string) => riportaSuPubblico(u, cms, pubblico);
  const misure = Object.values(m.media_details?.sizes ?? {})
    .filter((x) => x.source_url && x.width)
    .sort((a, b) => (a.width ?? 0) - (b.width ?? 0));
  // le misure che WordPress genera gia': niente ottimizzazione immagini di Vercel (si paga)
  const srcset = misure.map((x) => `${r(x.source_url!)} ${x.width}w`).join(", ") || undefined;
  return {
    src: r(m.source_url),
    srcset,
    larghezza: m.media_details?.width,
    altezza: m.media_details?.height,
    alt: decodificaEntita(m.alt_text ?? ""),
  };
}

export function mappaVoce(post: PostWP): VoceArticolo {
  return {
    id: post.id,
    slug: post.slug,
    percorso: percorsoArticolo(post.date, post.slug),
    titolo: decodificaEntita(post.title?.rendered),
    data: utc(post.date_gmt) ?? "",
    modificato: utc(post.modified_gmt),
  };
}

export function mappaPost(post: PostWP, opts: { cms: string; pubblico: string }): Articolo {
  const categorie = termini(post, "category");
  const a = post._embedded?.author?.[0];
  return {
    id: post.id,
    slug: post.slug,
    percorso: percorsoArticolo(post.date, post.slug),
    titolo: decodificaEntita(post.title?.rendered),
    riassunto: soloTesto(post.excerpt?.rendered),
    categorie,
    categoria: categorie[0],
    tag: termini(post, "post_tag"),
    autore: a?.name && a.slug ? { slug: a.slug, nome: decodificaEntita(a.name), bio: a.description || undefined } : undefined,
    data: utc(post.date_gmt) ?? "",
    modificato: utc(post.modified_gmt),
    immagine: immagine(post, opts.cms, opts.pubblico),
    // la sanificazione va per ULTIMA, sull'HTML gia' riscritto: cosi' nulla le sfugge
    contenuto: sanificaHtml(riportaSuPubblico(post.content?.rendered ?? "", opts.cms, opts.pubblico)),
    meta: post.meta,
  };
}
