// Le recensioni in home (richiesta del proprietario, 20/10/2026: «posizionamento e trattamento
// premium»). La piu' recente in vetrina: copertina larga, il voto nella sua figura sopra il bordo
// dell'immagine, titolo, riassunto del verdetto e invito a leggerla; la barra laterale ha il colore
// della fascia del voto, sempre, come la scheda del verdetto (richiesta del proprietario). Le altre seguono in fila come locandine.

import { ArrowRightIcon } from "@phosphor-icons/react/ssr";
import { CartaArticolo } from "@/components/carta-articolo";
import Link from "@/components/collegamento";
import { BarraFascia, FiguraVoto } from "@/components/recensione/figura-voto";
import type { Articolo } from "@/lib/cms/tipi";
import { votoDaMeta } from "@/lib/recensione";
import { FilaScorrevole } from "./fila-scorrevole";

function Vetrina({ a, sezione }: { a: Articolo; sezione: string }) {
  const voto = votoDaMeta(a.meta);
  const gioco = a.tag[0]?.nome;
  return (
    <Link
      prefetch={false}
      href={a.percorso}
      data-misura="home_sezione"
      data-misura-dettaglio={sezione}
      className="group relative block overflow-hidden rounded-xl border border-linea bg-superficie transition-[border-color,transform] duration-150 active:scale-[0.99] [@media(hover:hover)]:hover:border-link"
    >
      {voto && <BarraFascia voto={voto} />}
      <span className="relative block aspect-[16/9] bg-superficie-alta">
        {a.immagine && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={a.immagine.src}
            srcSet={a.immagine.srcset}
            sizes="(min-width: 768px) 736px, 100vw"
            alt=""
            loading="lazy"
            decoding="async"
            className="absolute inset-0 size-full object-cover"
          />
        )}
        <span className="absolute inset-0 bg-gradient-to-t from-notte/70 to-transparent" aria-hidden="true" />
      </span>
      <span className="relative flex flex-col gap-2 px-5 pb-5 pl-6">
        {voto && (
          <span className="-mt-11 block">
            <FiguraVoto voto={voto} />
          </span>
        )}
        <span className={`flex min-w-0 items-center gap-2 ${voto ? "" : "mt-4"}`}>
          <span className="shrink-0 rounded bg-viola px-1.5 py-0.5 text-[0.6875rem] font-bold uppercase tracking-[0.05em] text-su-viola">Recensione</span>
          {gioco && <span className="truncate text-sm font-semibold text-tenue">{gioco}</span>}
        </span>
        <span className="text-[1.375rem] font-bold leading-tight text-balance [@media(hover:hover)]:group-hover:text-link">{a.titolo}</span>
        {a.riassunto && <span className="line-clamp-3 text-[0.9375rem] text-tenue">{a.riassunto}</span>}
        <span className="mt-1 inline-flex items-center gap-1.5 font-semibold text-link">
          Leggi la recensione
          <ArrowRightIcon weight="bold" className="size-4" aria-hidden="true" />
        </span>
      </span>
    </Link>
  );
}

export function VetrinaRecensioni({ voci, sezione }: { voci: Articolo[]; sezione: string }) {
  const [prima, ...altre] = voci;
  if (!prima) return null;
  return (
    <div className="flex flex-col gap-4">
      <Vetrina a={prima} sezione={sezione} />
      {altre.length > 0 && (
        <FilaScorrevole>
          {altre.map((a, i) => (
            <li key={a.id} data-scheda className="w-[min(11rem,46vw)] shrink-0 snap-start">
              <CartaArticolo a={a} carico={i < 3 ? "vicino" : "dopo"} misura={{ nome: "home_sezione", dettaglio: sezione }} />
            </li>
          ))}
        </FilaScorrevole>
      )}
    </div>
  );
}
