// Home a sezioni (piano 06, modello games.gg chiesto dal proprietario). Scelta del proprietario
// (17/10/2026): le schede verticali della B «Locandine», e ogni tanto una scheda grande come nella
// C «In evidenza», per dare impatto: una sezione si' e una no apre con una locandina larga il doppio.

import Link from "next/link";
import type { Articolo } from "@/lib/cms/tipi";
import type { SezioneDati } from "@/lib/home-dati";
import { CartaSfida } from "./carta-sfida";
import { FilaScorrevole } from "./fila-scorrevole";

const NEWS = /^news$/i;

/** Guida o News: due formati coerenti (PDF 01), si distinguono a colpo d'occhio. */
function Tipo({ a, sopra = false }: { a: Articolo; sopra?: boolean }) {
  const news = a.categorie.some((c) => NEWS.test(c.slug));
  return (
    <span
      className={`shrink-0 rounded px-1.5 py-0.5 text-[0.6875rem] font-bold uppercase tracking-[0.05em] ${
        news ? "bg-link/15 text-link" : sopra ? "bg-notte/70 text-platino" : "bg-superficie-alta text-tenue"
      }`}
    >
      {news ? "News" : "Guida"}
    </span>
  );
}

/** `carico`: «subito» (la prima della home, priorita' alta), «pigro» (lazy), «dopo» (parte quando si tocca la fila). */
function Img({ a, classe, sizes, carico }: { a: Articolo; classe: string; sizes: string; carico: "subito" | "pigro" | "dopo" }) {
  if (!a.immagine) return <span className={`block bg-superficie-alta ${classe}`} />;
  const sorgente =
    carico === "dopo" ? { "data-src": a.immagine.src, "data-srcset": a.immagine.srcset } : { src: a.immagine.src, srcSet: a.immagine.srcset };
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      {...sorgente}
      sizes={sizes}
      alt=""
      loading={carico === "subito" ? "eager" : "lazy"}
      fetchPriority={carico === "subito" ? "high" : "auto"}
      decoding="async"
      className={`bg-superficie-alta object-cover ${classe}`}
    />
  );
}

function CartaLocandina({ a, carico, grande = false, sezione }: { a: Articolo; carico: "subito" | "pigro" | "dopo"; grande?: boolean; sezione: string }) {
  return (
    <Link
      href={a.percorso}
      data-misura="home_sezione"
      data-misura-dettaglio={sezione}
      className={`group relative isolate flex flex-col justify-end overflow-hidden rounded-xl border border-linea transition-[border-color,transform] duration-150 active:scale-[0.99] [@media(hover:hover)]:hover:border-link ${
        grande ? "h-full p-4" : "aspect-[3/4] p-3"
      }`}
    >
      <Img a={a} classe="absolute inset-0 -z-10 size-full" sizes={grande ? "360px" : "180px"} carico={carico} />
      <span className="absolute inset-0 -z-10 bg-gradient-to-t from-notte via-notte/80 to-transparent" aria-hidden="true" />
      <span className="flex min-w-0 items-center gap-1.5">
        <Tipo a={a} sopra />
        {a.tag[0] && <span className="truncate text-xs font-semibold text-platino/90">{a.tag[0].nome}</span>}
      </span>
      <span className={`mt-1.5 font-bold leading-snug text-platino ${grande ? "line-clamp-3 text-lg text-balance" : "line-clamp-4 text-sm"}`}>{a.titolo}</span>
    </Link>
  );
}

/** Una fila di locandine; con `apertura` la prima e' larga il doppio, alta come le altre. */
function Fila({ voci, prima, apertura, sezione }: { voci: Articolo[]; prima: boolean; apertura: boolean; sezione: string }) {
  return (
    <FilaScorrevole>
      {voci.map((a, i) => {
        const grande = apertura && i === 0;
        return (
          <li key={a.id} className={`shrink-0 snap-start ${grande ? "w-[min(22rem,84vw)]" : "w-[min(11rem,46vw)]"}`}>
            <CartaLocandina a={a} carico={prima && i === 0 ? "subito" : i < 4 ? "pigro" : "dopo"} grande={grande} sezione={sezione} />
          </li>
        );
      })}
    </FilaScorrevole>
  );
}

export function Sezioni({ sezioni }: { sezioni: SezioneDati[] }) {
  return (
    <div className="flex flex-col gap-10">
      {sezioni.map((s, i) => (
        <section key={s.titolo} aria-label={s.titolo}>
          <div className="mb-3 flex items-end justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-[1.375rem] font-bold leading-tight">{s.titolo}</h2>
              {s.tipo === "articoli" && <p className="mt-0.5 text-sm text-tenue">{s.criterio}</p>}
            </div>
            {s.tipo === "articoli" && s.tutti && (
              <Link href={s.tutti.href} className="inline-flex min-h-11 max-w-[45%] shrink-0 items-center text-right text-sm font-semibold text-link underline underline-offset-4">
                {s.tutti.testo}
              </Link>
            )}
          </div>
          {s.tipo === "sfida" ? (
            <CartaSfida s={s.sfida} />
          ) : (
            // una sezione si' e una no apre con la scheda grande
            <Fila voci={s.voci} prima={i === 0} apertura={i % 2 === 0} sezione={s.titolo} />
          )}
        </section>
      ))}
    </div>
  );
}
