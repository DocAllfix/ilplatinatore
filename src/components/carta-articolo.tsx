// La scheda «locandina» di un articolo (piano 06, scelta del proprietario), condivisa da home,
// archivi e pagine dei tag (piano 07: «tutti gli articoli sulla falsa riga delle card della home,
// anche se piu' piccole e discrete»). Immagine piena, titolo sopra la sfumatura, Guida o News.

import { FireIcon } from "@phosphor-icons/react/ssr";
import Link from "@/components/collegamento";
import { dataLeggibile } from "@/components/archivio";
import type { Articolo } from "@/lib/cms/tipi";

const NEWS = /^news$/i;
export const eNews = (a: Articolo) => a.categorie.some((c) => NEWS.test(c.slug));

/**
 * «Ultim'ora» (piano 07, richiesta del proprietario: cornice rossa e fuoco stile breaking news):
 * le news uscite nelle 48 ore prima dell'ultimo articolo pubblicato sul sito (`riferimento`). Sul
 * sito vero, che pubblica ogni giorno, sono le ultime 48 ore; sull'anteprima, ferma ai dati del CMS
 * di lavoro, si vedono lo stesso. Regola scritta nel brief 07.
 */
export const eUltimora = (a: Articolo, riferimento: number) => {
  if (!eNews(a) || !a.data) return false;
  const d = new Date(a.data).getTime();
  return d <= riferimento && riferimento - d < 48 * 3_600_000;
};

/** Guida o News: due formati coerenti (PDF 01), si distinguono a colpo d'occhio. */
function Tipo({ a, ultimora }: { a: Articolo; ultimora: boolean }) {
  if (ultimora)
    return (
      // sempre sull'immagine scurita: rosso chiaro fisso con scritta Notte (7:1) in tutti e due i temi
      <span className="inline-flex shrink-0 items-center gap-1 rounded bg-[#ff6b6b] px-1.5 py-0.5 text-[0.6875rem] font-bold uppercase tracking-[0.05em] text-notte">
        <FireIcon weight="fill" className="size-3.5" aria-hidden="true" />
        Ultim&apos;ora
      </span>
    );
  const news = eNews(a);
  return (
    <span className={`shrink-0 rounded px-1.5 py-0.5 text-[0.6875rem] font-bold uppercase tracking-[0.05em] ${news ? "bg-ciano/20 text-platino" : "bg-notte/70 text-platino"}`}>
      {news ? "News" : "Guida"}
    </span>
  );
}

export type Carico = "subito" | "pigro" | "vicino" | "dopo";

/**
 * `carico`: «subito» (la prima della pagina, priorita' alta), «pigro» (lazy del browser), «vicino»
 * (parte quando la fila della home sta per entrare nello schermo), «dopo» (quando si tocca la fila).
 */
function Img({ a, sizes, carico }: { a: Articolo; sizes: string; carico: Carico }) {
  const classe = "absolute inset-0 -z-10 size-full bg-superficie-alta object-cover";
  if (!a.immagine) return <span className={`block ${classe}`} />;
  const differita = carico === "vicino" || carico === "dopo";
  const sorgente = differita
    ? { "data-src": a.immagine.src, "data-srcset": a.immagine.srcset, "data-carico": carico }
    : { src: a.immagine.src, srcSet: a.immagine.srcset };
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img {...sorgente} sizes={sizes} alt="" loading={carico === "subito" ? "eager" : "lazy"} fetchPriority={carico === "subito" ? "high" : "auto"} decoding="async" className={classe} />
  );
}

export function CartaArticolo({
  a,
  carico,
  grande = false,
  piccola = false,
  conData = false,
  misura,
  riferimento,
}: {
  a: Articolo;
  carico: Carico;
  /** larga il doppio nelle file della home, alta come le altre */
  grande?: boolean;
  /** negli archivi: piu' piccola e discreta */
  piccola?: boolean;
  conData?: boolean;
  misura?: { nome: string; dettaglio: string };
  /** momento dell'ultimo articolo pubblicato, per l'«ultim'ora»; senza, nessuna cornice rossa */
  riferimento?: number;
}) {
  const ultimora = riferimento !== undefined && eUltimora(a, riferimento);
  return (
    <Link
      prefetch={false}
      href={a.percorso}
      data-misura={misura?.nome}
      data-misura-dettaglio={misura?.dettaglio}
      className={`group relative isolate flex flex-col justify-end overflow-hidden rounded-xl ${
        ultimora ? "border-2 border-errore shadow-[0_0_16px_oklch(66%_0.2_25/0.5)]" : "border border-linea shadow-[0_6px_18px_oklch(0%_0_0/0.28)]"
      } transition-[border-color,transform] duration-150 active:scale-[0.99] [@media(hover:hover)]:hover:-translate-y-0.5 [@media(hover:hover)]:hover:border-link ${
        grande ? "h-full p-4" : piccola ? "aspect-[4/5] p-2.5" : "aspect-[3/4] p-3"
      }`}
    >
      <Img a={a} sizes={grande ? "360px" : piccola ? "(min-width: 768px) 240px, 46vw" : "180px"} carico={carico} />
      <span className="absolute inset-0 -z-10 bg-gradient-to-t from-notte via-notte/80 to-transparent" aria-hidden="true" />
      <span className="flex min-w-0 items-center gap-1.5">
        <Tipo a={a} ultimora={ultimora} />
        {a.tag[0] && <span className="truncate text-xs font-semibold text-platino/90">{a.tag[0].nome}</span>}
      </span>
      <span className={`mt-1.5 font-bold leading-snug text-platino ${grande ? "line-clamp-3 text-lg text-balance" : piccola ? "line-clamp-3 text-[0.8125rem]" : "line-clamp-4 text-sm"}`}>
        {a.titolo}
      </span>
      {conData && <span className="mt-1 text-[0.6875rem] text-platino/75">{dataLeggibile(a.modificato ?? a.data)}</span>}
    </Link>
  );
}
