"use client";

// «Riprendi da dove eri» (PDF 04 e 09): legge le spunte gia' salvate nel browser per le guide del
// gioco. Compare solo se il lettore ha spuntato qualcosa (scelta dell'utente, 17/10/2026): a chi
// arriva la prima volta nessun riquadro vuoto.

import { ArrowRightIcon, CheckIcon } from "@phosphor-icons/react/ssr";
import Link from "@/components/collegamento";
import { useSyncExternalStore } from "react";
import { archivio } from "@/components/guida/spunte";
import type { Tracciabile } from "@/lib/hub-dati";

/** Quante spunte per ogni guida: un'istantanea che cambia solo quando cambia un archivio. */
function useConteggi(t: Tracciabile[]) {
  const chiave = () => t.map((x) => x.ids.filter((i) => archivio(x.id).leggi().fatti.has(i)).length).join(",");
  const s = useSyncExternalStore(
    (f) => {
      const via = t.map((x) => archivio(x.id).iscrivi(f));
      return () => via.forEach((v) => v());
    },
    chiave,
    () => "",
  );
  return s ? s.split(",").map(Number) : t.map(() => 0);
}

export function Riprendi({ tracciabili, compatto = false }: { tracciabili: Tracciabile[]; compatto?: boolean }) {
  const n = useConteggi(tracciabili);
  const iniziate = tracciabili.map((t, i) => ({ ...t, fatti: n[i] })).filter((t) => t.fatti > 0);
  if (!iniziate.length) return null;
  return (
    <section aria-label="Riprendi da dove eri" className={compatto ? "" : "my-8"}>
      <h2 className="text-xs font-semibold uppercase tracking-[0.06em] text-tenue">
        Riprendi da dove eri
      </h2>
      <ul className="mt-2 flex flex-col gap-2">
        {iniziate.map((t) => {
          const completo = t.fatti === t.ids.length;
          return (
            <li key={t.id}>
              <Link prefetch={false}
                href={t.percorso}
                data-misura="hub_riprendi"
                className="group flex items-center gap-3 rounded-xl border border-linea bg-superficie p-3 transition-[border-color,transform] duration-150 active:scale-[0.99] [@media(hover:hover)]:hover:border-link"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{t.titolo}</span>
                  <span className="mt-1.5 flex items-center gap-2">
                    <span className="block h-1.5 flex-1 overflow-hidden rounded-full bg-linea" aria-hidden="true">
                      <span
                        className="block h-full origin-left rounded-full bg-riempimento"
                        style={{ transform: `scaleX(${t.fatti / t.ids.length})` }}
                      />
                    </span>
                    <span className="cifre shrink-0 text-xs text-tenue">
                      {completo ? (
                        <span className="inline-flex items-center gap-1 font-semibold text-testo">
                          <CheckIcon weight="bold" className="size-3 text-riempimento" aria-hidden="true" />
                          Completato
                        </span>
                      ) : (
                        `${t.fatti} di ${t.ids.length} ${t.unita}`
                      )}
                    </span>
                  </span>
                </span>
                <ArrowRightIcon weight="bold" className="size-4 shrink-0 text-link" aria-hidden="true" />
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
