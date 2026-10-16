// Correlato contestuale (PDF 07): nel punto del testo in cui serve, con il perche'. Tre varianti in
// prova (piano 03): A «Riquadro», B «Riga», C «Con immagine».

import { ArrowRightIcon, SignpostIcon, WarningIcon } from "@phosphor-icons/react/ssr";
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

/** A: riquadro a bordo pieno, tutto cliccabile. */
export function CorrelatoRiquadro({ c, a }: Props) {
  return (
    <aside aria-label={c.tipo} className="my-6">
      <Link
        href={a.percorso}
        className={`group flex gap-3 rounded-xl border-2 bg-superficie p-4 transition-[border-color,transform] duration-150 active:scale-[0.99] ${avviso(c.tipo) ? "border-avviso/60" : "border-linea"} [@media(hover:hover)]:hover:border-link`}
      >
        <Icona tipo={c.tipo} className="mt-0.5 size-6 shrink-0" />
        <span className="min-w-0">
          <Etichetta tipo={c.tipo} />
          <span className="mt-1 block font-bold leading-snug text-balance">{a.titolo}</span>
          {c.perche && <span className="mt-1.5 block text-sm text-tenue">{c.perche}</span>}
          <span className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-link">
            Procedura dettagliata
            <ArrowRightIcon weight="bold" className="size-3.5 transition-transform duration-150 [@media(hover:hover)]:group-hover:translate-x-0.5" aria-hidden="true" />
          </span>
        </span>
      </Link>
    </aside>
  );
}

/** B: una riga compatta col filo a sinistra, il perche' sotto. */
export function CorrelatoRiga({ c, a }: Props) {
  return (
    <aside aria-label={c.tipo} className={`my-6 border-l-2 pl-4 ${avviso(c.tipo) ? "border-avviso" : "border-link"}`}>
      <Etichetta tipo={c.tipo} />
      <Link href={a.percorso} className="group mt-0.5 inline-flex min-h-11 items-center gap-1.5 font-semibold text-link">
        <span className="[@media(hover:hover)]:group-hover:underline">{a.titolo}</span>
        <ArrowRightIcon weight="bold" className="size-4 shrink-0" aria-hidden="true" />
      </Link>
      {c.perche && <p className="text-sm text-tenue">{c.perche}</p>}
    </aside>
  );
}

/** C: miniatura dell'articolo di destinazione accanto a titolo e perche'. */
export function CorrelatoConImmagine({ c, a }: Props) {
  return (
    <aside aria-label={c.tipo} className="my-6">
      <Link
        href={a.percorso}
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
