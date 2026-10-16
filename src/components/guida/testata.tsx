// Testata della guida: briciole, gioco, titolo, firma e data di aggiornamento (ancora: Eurogamer).
// La variante C mette il titolo sulla copertina.

import Link from "next/link";
import { dataLeggibile } from "@/components/archivio";
import type { Articolo } from "@/lib/cms/tipi";

function Briciole({ a }: { a: Articolo }) {
  const gioco = a.tag[0];
  return (
    <nav aria-label="Briciole" className="text-sm text-tenue">
      <ol className="flex flex-wrap items-center gap-x-1.5">
        <li>
          <Link href="/" className="inline-flex min-h-11 items-center hover:text-testo">
            Home
          </Link>
        </li>
        {a.categoria && (
          <li className="flex items-center gap-x-1.5">
            <span aria-hidden="true">›</span>
            <Link href={`/category/${a.categoria.slug}/`} className="inline-flex min-h-11 items-center hover:text-testo">
              {a.categoria.nome}
            </Link>
          </li>
        )}
        {gioco && (
          <li className="flex min-w-0 items-center gap-x-1.5">
            <span aria-hidden="true">›</span>
            <Link href={`/tag/${gioco.slug}/`} className="inline-flex min-h-11 items-center truncate hover:text-testo">
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

function Gioco({ a }: { a: Articolo }) {
  const gioco = a.tag[0];
  if (!gioco) return null;
  return (
    <Link
      href={`/tag/${gioco.slug}/`}
      className="inline-flex max-w-full items-center rounded bg-viola px-2 py-0.5 text-[0.8125rem] font-semibold text-su-viola"
    >
      <span className="truncate">{gioco.nome}</span>
    </Link>
  );
}

export function TestataGuida({ a }: { a: Articolo }) {
  return (
    <header>
      <Briciole a={a} />
      <div className="mt-1">
        <Gioco a={a} />
      </div>
      <h1 className="mt-3 text-[clamp(1.75rem,1.4rem+2.4vw,2.75rem)] font-bold leading-[1.1] tracking-[-0.01em] text-balance">
        {a.titolo}
      </h1>
      <div className="mt-3">
        <Firma a={a} />
      </div>
    </header>
  );
}

/** Variante C: copertina a tutta larghezza, titolo sopra l'immagine scurita. */
export function TestataCopertina({ a }: { a: Articolo }) {
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
      <div className="relative isolate flex min-h-[18rem] flex-col justify-end overflow-hidden px-4 pb-5 pt-16">
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
        <Gioco a={a} />
        <h1 className="mt-3 text-[clamp(1.75rem,1.4rem+2.4vw,2.75rem)] font-bold leading-[1.1] tracking-[-0.01em] text-platino text-balance">
          {a.titolo}
        </h1>
        <div className="mt-3 [&_p]:text-platino/80">
          <Firma a={a} />
        </div>
      </div>
    </header>
  );
}
