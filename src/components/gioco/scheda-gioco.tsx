// La scheda del gioco (piano 07, richiesta del proprietario): a fine articolo al posto
// dell'etichetta in testa, e in cima alla pagina del tag. Contornata da un bagliore che alterna i
// colori della palette (scelta del proprietario: «pulsa», il colore del bordo cambia). Con movimento
// ridotto il bagliore resta fermo. I dati arrivano dalla descrizione del tag (lib/scheda-gioco.ts).

import { ArrowRightIcon, CalendarBlankIcon, ClockIcon, StarIcon, TagIcon } from "@phosphor-icons/react/ssr";
import Link from "next/link";
import type { SchedaGioco as Dati } from "@/lib/scheda-gioco";

function Dato({ icona, etichetta, valore }: { icona: React.ReactNode; etichetta: string; valore?: string }) {
  if (!valore) return null;
  // dl > div > dt + dd, niente altro in mezzo (axe): l'icona sta dentro l'etichetta
  return (
    <div className="min-w-0">
      <dt className="flex items-center gap-1.5 text-[0.6875rem] font-semibold uppercase tracking-[0.05em] text-tenue">
        <span className="text-viola-testo" aria-hidden="true">
          {icona}
        </span>
        {etichetta}
      </dt>
      <dd className="mt-0.5 font-semibold leading-snug">{valore}</dd>
    </div>
  );
}

/** Le tre durate come HowLongToBeat: barre in proporzione, il numero sempre scritto. */
function Durate({ s }: { s: Dati }) {
  const voci = [
    { etichetta: "Storia", valore: s.storia },
    { etichetta: "Storia + extra", valore: s.extra },
    { etichetta: "Completista", valore: s.completista },
  ].filter((v): v is { etichetta: string; valore: string } => Boolean(v.valore));
  if (!voci.length) return null;
  const ore = voci.map((v) => Number(v.valore.match(/\d+(?:[.,]\d+)?/)?.[0]?.replace(",", ".") ?? 0));
  const massimo = Math.max(...ore, 1);
  const colori = ["bg-ciano", "bg-viola", "bg-azione"];
  return (
    <div className="mt-4">
      <p className="flex items-center gap-1.5 text-[0.6875rem] font-semibold uppercase tracking-[0.05em] text-tenue">
        <ClockIcon weight="bold" className="size-3.5" aria-hidden="true" />
        Quanto dura
      </p>
      <dl className="mt-2 flex flex-col gap-2">
        {voci.map((v, i) => (
          <div key={v.etichetta} className="grid grid-cols-[7.5rem_1fr] items-center gap-2 text-sm">
            <dt className="text-tenue">{v.etichetta}</dt>
            {/* la barra sta dentro il valore: in un elenco di definizioni fra dt e dd non va altro */}
            <dd className="flex items-center gap-2">
              <span className="block h-2 flex-1 overflow-hidden rounded-full bg-linea" aria-hidden="true">
                <span className={`block h-full rounded-full ${colori[i]}`} style={{ width: `${Math.max(8, (ore[i] / massimo) * 100)}%` }} />
              </span>
              <span className="cifre font-semibold">{v.valore}</span>
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export function SchedaGioco({
  nome,
  slug,
  dati,
  grande = false,
}: {
  nome: string;
  slug: string;
  dati: Dati | null;
  /** in cima alla pagina del tag: titolo piu' grande, niente link a se stessa */
  grande?: boolean;
}) {
  return (
    <aside aria-label={`Scheda di ${nome}`} className="bagliore-pulsa">
      <div className="rounded-[14px] bg-superficie p-4 sm:p-5">
        <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.06em] text-viola-testo">
          <TagIcon weight="bold" className="size-3.5" aria-hidden="true" />
          Il gioco
        </p>
        {grande ? (
          <h1 className="mt-1 text-[clamp(1.75rem,1.4rem+2vw,2.5rem)] font-bold leading-tight text-balance">{nome}</h1>
        ) : (
          <p className="mt-1 text-[1.375rem] font-bold leading-tight text-balance">{nome}</p>
        )}
        {dati && (dati.anno || dati.genere || dati.voto || dati.piattaforme) && (
          <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Dato icona={<CalendarBlankIcon weight="bold" className="size-4" />} etichetta="Anno" valore={dati.anno} />
            <Dato icona={<TagIcon weight="bold" className="size-4" />} etichetta="Genere" valore={dati.genere} />
            <Dato icona={<StarIcon weight="fill" className="size-4" />} etichetta="Voto medio" valore={dati.voto} />
          </dl>
        )}
        {dati && <Durate s={dati} />}
        {!grande && (
          <Link
            prefetch={false}
            href={`/tag/${slug}/`}
            className="mt-4 inline-flex min-h-11 items-center gap-1.5 font-semibold text-link [@media(hover:hover)]:hover:underline"
          >
            Tutto su {nome}
            <ArrowRightIcon weight="bold" className="size-4" aria-hidden="true" />
          </Link>
        )}
      </div>
    </aside>
  );
}
