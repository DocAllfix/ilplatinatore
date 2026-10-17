import { BottoneAcido } from "@/components/bottone-acido";
import { CartaArticolo } from "@/components/carta-articolo";
import type { Articolo } from "@/lib/cms/tipi";

export function dataLeggibile(iso: string): string {
  if (!iso) return "";
  return new Intl.DateTimeFormat("it-IT", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Rome" }).format(
    new Date(iso),
  );
}

/** «Piu' recenti» e «Meno recenti» come bottoni Acido (piano 07); indirizzi /page/N/ come oggi. */
export function Paginazione({ base, pagina, pagine }: { base: string; pagina: number; pagine: number }) {
  if (pagine <= 1) return null;
  const href = (n: number) => (n === 1 ? base : `${base}page/${n}/`);
  return (
    <nav aria-label="Pagine" className="mt-8 flex flex-wrap items-center justify-between gap-3 text-sm">
      {pagina > 1 ? (
        <BottoneAcido href={href(pagina - 1)} verso="indietro">
          Più recenti
        </BottoneAcido>
      ) : (
        <span />
      )}
      <span className="cifre text-tenue">
        Pagina {pagina} di {pagine}
      </span>
      {pagina < pagine ? <BottoneAcido href={href(pagina + 1)}>Meno recenti</BottoneAcido> : <span />}
    </nav>
  );
}

/** Gli articoli come schede piccole e discrete, sulla falsa riga della home (piano 07). */
export function GrigliaArticoli({ articoli }: { articoli: Articolo[] }) {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {articoli.map((a, i) => (
        <li key={a.id}>
          <CartaArticolo a={a} carico={i === 0 ? "subito" : "pigro"} piccola conData />
        </li>
      ))}
    </ul>
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
      <div className="mt-5">
        <GrigliaArticoli articoli={props.articoli} />
      </div>
      <Paginazione base={props.base} pagina={props.pagina} pagine={props.pagine} />
    </>
  );
}
