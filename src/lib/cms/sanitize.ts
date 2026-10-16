// Sanificazione dell'HTML che arriva da WordPress. Adattato da EvalisDeck.
//
// L'HTML del CMS finirebbe nella pagina cosi' com'e': chi ha accesso all'editor (o wpvibe, o chi
// ne ruba le credenziali) potrebbe iniettare uno <script>. Lista bianca STRETTA: aggiungere un tag
// e' una decisione consapevole.
//
// Differenze per il Platinatore, viste sul campione dei 1.710 articoli:
// - 12 video di YouTube: si tengono, ma dal dominio youtube-nocookie (nessun cookie di Google
//   prima del consenso).
// - 63 incorporamenti di articoli del sito stesso (iframe verso /embed/): l'iframe si toglie,
//   resta il link dentro il <blockquote> che WordPress mette accanto.
// - il markup pubblicitario non c'e': Advanced Ads non e' installato sul CMS.

import sanitizeHtml from "sanitize-html";

const YOUTUBE = /^https:\/\/(www\.)?youtube(-nocookie)?\.com\/embed\//i;

const OPZIONI: sanitizeHtml.IOptions = {
  allowedTags: [
    "p", "br", "hr",
    "h2", "h3", "h4", "h5", "h6", // niente h1: e' il titolo dell'articolo
    "strong", "b", "em", "i", "u", "s", "mark", "sup", "sub", "small",
    "ul", "ol", "li",
    "blockquote", "cite",
    "a", "img", "figure", "figcaption",
    "table", "thead", "tbody", "tfoot", "tr", "th", "td", "caption",
    "code", "pre",
    "span", "div",
    "iframe",
  ],
  allowedAttributes: {
    a: ["href", "title", "rel", "target"],
    img: ["src", "srcset", "sizes", "alt", "width", "height", "loading", "decoding"],
    th: ["colspan", "rowspan", "scope"],
    td: ["colspan", "rowspan"],
    ol: ["start", "reversed"],
    iframe: ["src", "width", "height", "title", "allow", "allowfullscreen", "loading"],
    // classi e id: servono agli stili dei blocchi e alle ancore dei titoli
    "*": ["class", "id"],
  },
  allowedSchemes: ["http", "https", "mailto", "tel"],
  allowedSchemesByTag: { img: ["http", "https"], iframe: ["https"] },
  allowedIframeHostnames: ["www.youtube.com", "youtube.com", "www.youtube-nocookie.com"],
  transformTags: {
    a: (nomeTag, attribs) => {
      const href = attribs.href ?? "";
      const esterno = /^https?:\/\//i.test(href);
      return {
        tagName: nomeTag,
        attribs: esterno ? { ...attribs, target: "_blank", rel: "noopener noreferrer" } : { ...attribs },
      };
    },
    img: (nomeTag, attribs) => ({
      tagName: nomeTag,
      attribs: { ...attribs, loading: "lazy", decoding: "async" },
    }),
    iframe: (nomeTag, attribs) => {
      const src = attribs.src ?? "";
      if (!YOUTUBE.test(src)) return { tagName: "span", attribs: {} };
      return {
        tagName: nomeTag,
        attribs: {
          ...attribs,
          src: src.replace(/^https:\/\/(www\.)?youtube\.com/i, "https://www.youtube-nocookie.com"),
          loading: "lazy",
        },
      };
    },
  },
};

export function sanificaHtml(html: string | undefined | null): string {
  if (!html) return "";
  return sanitizeHtml(html, OPZIONI);
}

export function soloTesto(html: string | undefined | null): string {
  if (!html) return "";
  const senzaTag = sanitizeHtml(html, { allowedTags: [], allowedAttributes: {} });
  return senzaTag.replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
}
