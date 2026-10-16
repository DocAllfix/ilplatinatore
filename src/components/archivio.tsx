import Link from "next/link";
import type { Articolo } from "@/lib/cms/tipi";

export function dataLeggibile(iso: string): string {
  if (!iso) return "";
  return new Intl.DateTimeFormat("it-IT", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Rome" }).format(
    new Date(iso),
  );
}

export function SchedaArticolo({ a, prima = false }: { a: Articolo; prima?: boolean }) {
  return (
    <article className="flex gap-4 border-b border-bordo py-4">
      {a.immagine && (
        // le misure le genera WordPress: niente ottimizzazione di Vercel
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={a.immagine.src}
          srcSet={a.immagine.srcset}
          sizes="(min-width: 640px) 160px, 112px"
          alt={a.immagine.alt}
          width={160}
          height={90}
          loading={prima ? "eager" : "lazy"}
          decoding="async"
          className="aspect-video h-auto w-28 shrink-0 rounded object-cover sm:w-40"
        />
      )}
      <div className="min-w-0">
        {a.categoria && <p className="text-xs uppercase tracking-wide text-tenue">{a.categoria.nome}</p>}
        <h2 className="mt-1 font-semibold leading-snug">
          <Link href={a.percorso} className="hover:text-accento">
            {a.titolo}
          </Link>
        </h2>
        <p className="mt-1 text-sm text-tenue">{dataLeggibile(a.data)}</p>
      </div>
    </article>
  );
}

export function Paginazione({ base, pagina, pagine }: { base: string; pagina: number; pagine: number }) {
  if (pagine <= 1) return null;
  const href = (n: number) => (n === 1 ? base : `${base}page/${n}/`);
  return (
    <nav aria-label="Pagine" className="mt-6 flex items-center justify-between text-sm">
      {pagina > 1 ? <Link href={href(pagina - 1)}>← Più recenti</Link> : <span />}
      <span className="text-tenue">
        Pagina {pagina} di {pagine}
      </span>
      {pagina < pagine ? <Link href={href(pagina + 1)}>Meno recenti →</Link> : <span />}
    </nav>
  );
}

export function PaginaArchivio(props: {
  titolo: string;
  descrizione?: string;
  articoli: Articolo[];
  base: string;
  pagina: number;
  pagine: number;
}) {
  return (
    <>
      <h1 className="text-2xl font-bold">{props.titolo}</h1>
      {props.descrizione && <p className="mt-2 text-tenue">{props.descrizione}</p>}
      <div className="mt-4">
        {props.articoli.map((a, i) => (
          <SchedaArticolo key={a.id} a={a} prima={i === 0} />
        ))}
      </div>
      <Paginazione base={props.base} pagina={props.pagina} pagine={props.pagine} />
    </>
  );
}
