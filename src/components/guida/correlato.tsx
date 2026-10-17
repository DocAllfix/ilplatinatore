// Correlato contestuale (PDF 07): nel punto del testo in cui serve, con il perche'. Variante scelta
// del piano 03: C «Con immagine» (17/10/2026).

import { SignpostIcon, WarningIcon } from "@phosphor-icons/react/ssr";
import Link from "next/link";
import type { Articolo } from "@/lib/cms/tipi";
import type { Correlato as Dati } from "@/lib/guida/collezionabili";

type Props = { c: Dati; a: Pick<Articolo, "percorso" | "titolo" | "immagine"> };

/** «Prima di continuare» avverte di un rischio; gli altri indicano la strada. */
const avviso = (tipo: string) => /prima|attenzion|mancabil/i.test(tipo);

function Icona({ tipo, className }: { tipo: string; className: string }) {
  return avviso(tipo) ? (
    <WarningIcon weight="bold" className={`${className} text-avviso`} aria-hidden="true" />
  ) : (
    <SignpostIcon weight="bold" className={`${className} text-link`} aria-hidden="true" />
  );
}

function Etichetta({ tipo }: { tipo: string }) {
  return <span className={`block text-xs font-semibold uppercase tracking-[0.06em] ${avviso(tipo) ? "text-avviso" : "text-link"}`}>{tipo}</span>;
}

/** Miniatura dell'articolo di destinazione dell'articolo di destinazione accanto a titolo e perche'. */
export function Correlato({ c, a }: Props) {
  return (
    <aside aria-label={c.tipo} className="my-6">
      <Link
        href={a.percorso}
        data-misura="correlato"
        data-misura-dettaglio={c.tipo}
        className="group grid grid-cols-[6rem_1fr] gap-3 overflow-hidden rounded-xl border border-linea bg-superficie transition-[border-color,transform] duration-150 active:scale-[0.99] md:grid-cols-[10rem_1fr] [@media(hover:hover)]:hover:border-link"
      >
        {a.immagine ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={a.immagine.src} srcSet={a.immagine.srcset} sizes="160px" alt="" loading="lazy" className="h-full min-h-24 w-full object-cover" />
        ) : (
          <span className="flex items-center justify-center bg-superficie-alta">
            <Icona tipo={c.tipo} className="size-7" />
          </span>
        )}
        <span className="min-w-0 py-3 pr-3">
          <span className="flex items-center gap-1.5">
            <Icona tipo={c.tipo} className="size-4 shrink-0" />
            <Etichetta tipo={c.tipo} />
          </span>
          <span className="mt-1 block font-bold leading-snug [@media(hover:hover)]:group-hover:text-link">{a.titolo}</span>
          {c.perche && <span className="mt-1 block text-sm text-tenue">{c.perche}</span>}
        </span>
      </Link>
    </aside>
  );
}
