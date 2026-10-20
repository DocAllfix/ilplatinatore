// La scheda del verdetto delle recensioni (richiesta del proprietario, 20/10/2026): il voto nella sua
// figura e il paragrafo del verdetto finale, una barra laterale nel colore della fascia del voto e in
// basso l'invito alle guide del gioco (il suo hub). Prende il posto dello shortcode nel testo.

import { ArrowRightIcon } from "@phosphor-icons/react/ssr";
import Link from "@/components/collegamento";
import type { Voto } from "@/lib/recensione";
import { BarraFascia, FiguraVoto } from "./figura-voto";

export function SchedaVerdetto({
  voto,
  titolo,
  verdetto,
  gioco,
}: {
  voto: Voto;
  titolo: string;
  /** HTML gia' sanificato del paragrafo (o dei paragrafi) del verdetto finale */
  verdetto: string;
  gioco?: { nome: string; slug: string };
}) {
  return (
    <aside aria-label={titolo} className="relative my-8 overflow-hidden rounded-xl border border-linea bg-superficie">
      <BarraFascia voto={voto} />
      <div className="flex flex-col gap-4 py-5 pl-6 pr-5 sm:flex-row sm:items-start sm:gap-5">
        <div className="flex items-center gap-4 sm:flex-col sm:items-center sm:gap-2">
          <FiguraVoto voto={voto} />
          <p className="sm:hidden">
            <span className="block text-xs font-semibold uppercase tracking-[0.06em] text-tenue">{titolo}</span>
            {gioco && <span className="block text-lg font-bold leading-tight text-balance">{gioco.nome}</span>}
          </p>
        </div>
        <div className="min-w-0">
          <p className="hidden sm:block">
            <span className="block text-xs font-semibold uppercase tracking-[0.06em] text-tenue">{titolo}</span>
            {gioco && <span className="block text-lg font-bold leading-tight text-balance">{gioco.nome}</span>}
          </p>
          <div className="contenuto mt-2 [&>p:last-child]:mb-0" dangerouslySetInnerHTML={{ __html: verdetto }} />
        </div>
      </div>
      {gioco && (
        <Link
          prefetch={false}
          href={`/tag/${gioco.slug}/`}
          data-misura="verdetto_hub"
          className="flex min-h-12 items-center justify-between gap-3 border-t border-linea py-3 pl-6 pr-5 font-semibold text-link transition-colors [@media(hover:hover)]:hover:bg-superficie-alta"
        >
          <span className="min-w-0">Tutte le guide di {gioco.nome}</span>
          <ArrowRightIcon weight="bold" className="size-4 shrink-0" aria-hidden="true" />
        </Link>
      )}
    </aside>
  );
}
