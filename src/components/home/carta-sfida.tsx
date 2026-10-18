"use client";

// La card della sfida in home: invito, numero, e lo stato se il lettore ha gia' giocato oggi.

import { ArrowRightIcon, CheckIcon, PuzzlePieceIcon } from "@phosphor-icons/react/ssr";
import Link from "@/components/collegamento";
import { ImmagineSgranata } from "@/components/sfida/immagine-sgranata";
import { usePartita } from "@/components/sfida/partita";
import { REGOLE } from "@/lib/sfida";
import type { SfidaInBreve } from "@/lib/home-dati";

export function CartaSfida({ s, grande = false }: { s: SfidaInBreve; grande?: boolean }) {
  // solo lettura dello stato salvato: la soluzione qui non serve
  const max = REGOLE[s.formato].tentativi;
  const p = usePartita(`platinatore:sfida:${s.giorno}:${s.formato}`, () => false, max);
  const stato = p.finita ? (p.vinta ? "Indovinata oggi" : "Giocata oggi") : p.tentativi.length ? `In corso: ${p.tentativi.length} di ${max}` : null;
  return (
    <Link prefetch={false}
      href="/sfida/"
      data-misura="home_sezione"
      data-misura-dettaglio="La sfida del giorno"
      className={`group grid overflow-hidden rounded-xl border-2 border-viola/70 bg-superficie transition-[border-color,transform] duration-150 active:scale-[0.99] [@media(hover:hover)]:hover:border-link ${
        grande ? "md:grid-cols-[1.2fr_1fr]" : "sm:grid-cols-[14rem_1fr]"
      }`}
    >
      {s.immagine ? (
        <ImmagineSgranata immagine={s.immagine} lato={40} />
      ) : (
        <span className="flex aspect-video items-center justify-center bg-superficie-alta">
          <PuzzlePieceIcon weight="duotone" className="size-14 text-viola-testo" aria-hidden="true" />
        </span>
      )}
      <span className="flex flex-col justify-center gap-1.5 p-4">
        <span className="cifre text-xs font-semibold uppercase tracking-[0.06em] text-viola-testo">Sfida n. {s.numero}</span>
        <span className="text-xl font-bold leading-tight">{s.nome}</span>
        <span className="text-sm text-tenue">{s.invito}</span>
        {stato ? (
          <span className="mt-1 inline-flex items-center gap-1 text-sm font-semibold">
            {p.finita && <CheckIcon weight="bold" className="size-4 text-riempimento" aria-hidden="true" />}
            {stato}
            {p.finita && <span className="font-normal text-tenue"> · nuova sfida domani</span>}
          </span>
        ) : (
          <span className="mt-2 inline-flex min-h-11 items-center gap-1.5 self-start rounded-xl bg-azione px-4 font-semibold text-su-azione">
            Gioca
            <ArrowRightIcon weight="bold" className="size-4" aria-hidden="true" />
          </span>
        )}
      </span>
    </Link>
  );
}
