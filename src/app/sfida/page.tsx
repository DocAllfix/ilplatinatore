// La sfida del giorno (PDF 08, piano 05) su /sfida/: indirizzo nuovo, nessun conflitto con quelli
// di oggi. Si rigenera spesso perche' a mezzanotte cambia la sfida.

import type { Metadata } from "next";
import { ArrowRightIcon } from "@phosphor-icons/react/ssr";
import Link from "@/components/collegamento";
import { LaSfida } from "@/components/sfida/sfida";
import { sitoPubblico } from "@/lib/cms/config";
import { robotsConDopo } from "@/lib/cms/metadati";
import { giornoRoma } from "@/lib/sfida";
import { datiSfida } from "@/lib/sfida-dati";

export const revalidate = 300;

export const metadata: Metadata = {
  title: { absolute: "La sfida del giorno: riconosci il gioco - 🎮 Il Platinatore" },
  description: "Ogni giorno una sfida nuova: riconosci il gioco dall'immagine, indovina il trofeo o il classico dagli indizi. Cinque tentativi, soluzione sempre in chiaro.",
  alternates: { canonical: `${sitoPubblico().replace(/\/$/, "")}/sfida/` },
  ...robotsConDopo(true),
};

export default async function PaginaSfida() {
  const dati = await datiSfida(giornoRoma(new Date()));
  return (
    // Piano 05 chiuso: regole per formato in lib/sfida.ts (REGOLE)
    <>
      <h1 className="sr-only">La sfida del giorno</h1>
      <LaSfida dati={dati} />
      {/* il gioco 4: il Wordle dei videogiochi */}
      <Link
        prefetch={false}
        href="/sfida/parola/"
        data-misura="sfida_rimando"
        data-misura-dettaglio="verso-parola"
        className="group mx-auto mt-10 flex max-w-xl items-center gap-4 rounded-xl border border-linea bg-superficie p-4 transition-[border-color,transform] duration-150 active:scale-[0.99] [@media(hover:hover)]:hover:border-link"
      >
        <span className="flex shrink-0 gap-0.5" aria-hidden="true">
          <span className="flex size-8 items-center justify-center rounded bg-azione font-bold text-su-azione">P</span>
          <span className="flex size-8 items-center justify-center rounded bg-ciano font-bold text-notte">A</span>
          <span className="flex size-8 items-center justify-center rounded bg-[#3d2d80] font-bold text-white">R</span>
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-bold leading-snug [@media(hover:hover)]:group-hover:text-link">Gioca anche a La parola</span>
          <span className="block text-sm text-tenue">Il Wordle dei videogiochi: il gioco, la software house, il boss.</span>
        </span>
        <ArrowRightIcon weight="bold" className="size-4 shrink-0 text-link" aria-hidden="true" />
      </Link>
    </>
  );
}
