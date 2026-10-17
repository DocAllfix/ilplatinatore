// Home a sezioni (piano 06, modello games.gg chiesto dal proprietario). Tre varianti in prova:
// A «File» (schede 16:9 scorrevoli, come Netflix), B «Locandine» (schede verticali col titolo
// sull'immagine), C «In evidenza» (la prima scheda grande, le altre in elenco compatto).

import Link from "next/link";
import { dataLeggibile } from "@/components/archivio";
import type { Articolo } from "@/lib/cms/tipi";
import type { SezioneDati } from "@/lib/home-dati";
import { CartaSfida } from "./carta-sfida";

export type VarianteHome = "a" | "b" | "c";

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

function Img({ a, classe, sizes, prima }: { a: Articolo; classe: string; sizes: string; prima?: boolean }) {
  if (!a.immagine) return <span className={`block bg-superficie-alta ${classe}`} />;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={a.immagine.src} srcSet={a.immagine.srcset} sizes={sizes} alt="" loading={prima ? "eager" : "lazy"} decoding="async" className={`object-cover ${classe}`} />
  );
}

const quando = (a: Articolo) =>
  a.modificato && a.modificato.slice(0, 10) !== a.data.slice(0, 10) ? `Aggiornato il ${dataLeggibile(a.modificato)}` : dataLeggibile(a.data);

function CartaFila({ a, prima }: { a: Articolo; prima?: boolean }) {
  return (
    <Link
      href={a.percorso}
      className="group flex h-full flex-col overflow-hidden rounded-xl border border-linea bg-superficie transition-[border-color,transform] duration-150 active:scale-[0.99] [@media(hover:hover)]:hover:border-link"
    >
      <Img a={a} classe="aspect-video w-full" sizes="256px" prima={prima} />
      <span className="flex flex-1 flex-col gap-1.5 p-3">
        <span className="flex min-w-0 items-center gap-1.5">
          <Tipo a={a} />
          {a.tag[0] && <span className="truncate text-xs font-semibold text-viola-testo">{a.tag[0].nome}</span>}
        </span>
        <span className="line-clamp-3 text-sm font-semibold leading-snug [@media(hover:hover)]:group-hover:text-link">{a.titolo}</span>
        <span className="mt-auto text-xs text-tenue">{quando(a)}</span>
      </span>
    </Link>
  );
}

function CartaLocandina({ a, prima }: { a: Articolo; prima?: boolean }) {
  return (
    <Link
      href={a.percorso}
      className="group relative isolate flex aspect-[3/4] flex-col justify-end overflow-hidden rounded-xl border border-linea p-3 transition-[border-color,transform] duration-150 active:scale-[0.99] [@media(hover:hover)]:hover:border-link"
    >
      <Img a={a} classe="absolute inset-0 -z-10 size-full" sizes="200px" prima={prima} />
      <span className="absolute inset-0 -z-10 bg-gradient-to-t from-notte via-notte/80 to-transparent" aria-hidden="true" />
      <span className="flex min-w-0 items-center gap-1.5">
        <Tipo a={a} sopra />
        {a.tag[0] && <span className="truncate text-xs font-semibold text-platino/90">{a.tag[0].nome}</span>}
      </span>
      <span className="mt-1.5 line-clamp-4 text-sm font-bold leading-snug text-platino">{a.titolo}</span>
    </Link>
  );
}

function Fila({ voci, variante, prima }: { voci: Articolo[]; variante: "a" | "b"; prima: boolean }) {
  return (
    <ul className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:thin]">
      {voci.map((a, i) => (
        <li key={a.id} className={`shrink-0 snap-start ${variante === "a" ? "w-[min(16rem,74vw)]" : "w-[min(11rem,46vw)]"}`}>
          {variante === "a" ? <CartaFila a={a} prima={prima && i < 2} /> : <CartaLocandina a={a} prima={prima && i < 2} />}
        </li>
      ))}
    </ul>
  );
}

function InEvidenza({ voci, prima }: { voci: Articolo[]; prima: boolean }) {
  const [primo, ...altri] = voci;
  return (
    <div className="grid gap-3 md:grid-cols-[1.3fr_1fr]">
      <CartaFila a={primo} prima={prima} />
      <ul className="border-t border-linea">
        {altri.slice(0, 5).map((a) => (
          <li key={a.id} className="border-b border-linea">
            <Link href={a.percorso} className="flex min-h-14 items-center gap-3 py-2 [@media(hover:hover)]:hover:text-link">
              <Img a={a} classe="aspect-video w-20 shrink-0 rounded" sizes="80px" />
              <span className="min-w-0">
                <span className="line-clamp-2 text-sm font-semibold leading-snug">{a.titolo}</span>
                <span className="mt-0.5 flex items-center gap-1.5 text-xs text-tenue">
                  <Tipo a={a} />
                  {quando(a)}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Sezioni({ sezioni, variante }: { sezioni: SezioneDati[]; variante: VarianteHome }) {
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
              <Link href={s.tutti.href} className="inline-flex min-h-11 shrink-0 items-center text-sm font-semibold text-link underline underline-offset-4">
                {s.tutti.testo}
              </Link>
            )}
          </div>
          {s.tipo === "sfida" ? (
            <CartaSfida s={s.sfida} grande={variante === "c"} />
          ) : variante === "c" ? (
            <InEvidenza voci={s.voci} prima={i === 0} />
          ) : (
            <Fila voci={s.voci} variante={variante} prima={i === 0} />
          )}
        </section>
      ))}
    </div>
  );
}
