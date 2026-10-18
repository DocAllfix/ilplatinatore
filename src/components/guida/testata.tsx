// Testata della guida: briciole, gioco, titolo, firma e data di aggiornamento (ancora: Eurogamer).
// La variante C mette il titolo sulla copertina.

import Link from "@/components/collegamento";
import { dataLeggibile } from "@/components/archivio";
import type { Articolo } from "@/lib/cms/tipi";

function Briciole({ a }: { a: Articolo }) {
  const gioco = a.tag[0];
  return (
    <nav aria-label="Briciole" className="text-sm text-tenue">
      <ol className="flex flex-wrap items-center gap-x-1.5">
        <li>
          <Link prefetch={false} href="/" className="inline-flex min-h-11 items-center hover:text-testo">
            Home
          </Link>
        </li>
        {a.categoria && (
          <li className="flex items-center gap-x-1.5">
            <span aria-hidden="true">›</span>
            <Link prefetch={false} href={`/category/${a.categoria.slug}/`} className="inline-flex min-h-11 items-center hover:text-testo">
              {a.categoria.nome}
            </Link>
          </li>
        )}
        {gioco && (
          <li className="flex min-w-0 items-center gap-x-1.5">
            <span aria-hidden="true">›</span>
            <Link prefetch={false} href={`/tag/${gioco.slug}/`} className="inline-flex min-h-11 items-center truncate hover:text-testo">
              {gioco.nome}
            </Link>
          </li>
        )}
      </ol>
    </nav>
  );
}

function Firma({ a }: { a: Articolo }) {
  const aggiornata = a.modificato && a.modificato.slice(0, 10) !== a.data.slice(0, 10);
  return (
    <p className="text-sm text-tenue">
      {a.autore && <>di {a.autore.nome} · </>}
      {aggiornata ? (
        <>
          Aggiornata il <time dateTime={a.modificato}>{dataLeggibile(a.modificato!)}</time>
        </>
      ) : (
        <time dateTime={a.data}>{dataLeggibile(a.data)}</time>
      )}
    </p>
  );
}

export function TestataGuida({ a }: { a: Articolo }) {
  return (
    <header>
      <Briciole a={a} />
      <h1 className="mt-2 text-[clamp(1.75rem,1.4rem+2.4vw,2.75rem)] font-bold leading-[1.1] tracking-[-0.01em] text-balance">
        {a.titolo}
      </h1>
      <div className="mt-3">
        <Firma a={a} />
      </div>
    </header>
  );
}

/** Variante C: copertina a tutta larghezza, titolo sopra l'immagine scurita. */
export function TestataCopertina({ a, alta = false }: { a: Articolo; alta?: boolean }) {
  if (!a.immagine) {
    return (
      <div className="-mx-4 bg-superficie-alta px-4 pb-5 pt-1">
        <TestataGuida a={a} />
      </div>
    );
  }
  return (
    <header className="-mx-4">
      <div className="px-4">
        <Briciole a={a} />
      </div>
      <div className={`relative isolate flex flex-col justify-end overflow-hidden px-4 pt-16 ${alta ? "min-h-[21rem] pb-16" : "min-h-[18rem] pb-5"}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={a.immagine.src}
          srcSet={a.immagine.srcset}
          sizes="(min-width: 768px) 768px, 100vw"
          alt=""
          fetchPriority="high"
          className="absolute inset-0 -z-10 size-full object-cover"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-notte via-notte/80 to-notte/10" aria-hidden="true" />
        <h1 className="text-[clamp(1.75rem,1.4rem+2.4vw,2.75rem)] font-bold leading-[1.1] tracking-[-0.01em] text-platino text-balance">
          {a.titolo}
        </h1>
        <div className="mt-3 [&_p]:text-platino/80">
          <Firma a={a} />
        </div>
      </div>
    </header>
  );
}
