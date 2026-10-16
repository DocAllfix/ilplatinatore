"use client";

// Un gruppo di trofei da spuntare, al posto della tabella della guida (piano 02, variante scelta:
// «Lista»).

import { CheckIcon } from "@phosphor-icons/react/ssr";
import type { Gruppo } from "@/lib/guida/checklist";
import { useSpunte } from "./spunte";

function Contatore({ fatti, totale }: { fatti: number; totale: number }) {
  const completo = fatti === totale;
  return (
    <p className="cifre flex items-center gap-2 text-sm font-semibold" aria-live="polite">
      {completo ? (
        <span className="inline-flex items-center gap-1 rounded bg-azione px-2 py-0.5 text-su-azione">
          <CheckIcon weight="bold" className="size-3.5" aria-hidden="true" />
          Completato
        </span>
      ) : null}
      <span key={fatti} className="inline-block animate-[scatto_250ms_var(--ease-uscita)] text-tenue">
        {fatti} di {totale}
      </span>
    </p>
  );
}

/**
 * Casella di spunta vera (input checkbox): tastiera e screen reader gratis. L'input invisibile copre
 * 44x44 px intorno al quadratino visibile da 24 px, cosi' il pollice non manca il bersaglio.
 */
export function Casella({ id, fatto, onCambia, etichetta }: { id: string; fatto: boolean; onCambia: () => void; etichetta: string }) {
  return (
    <span className="relative inline-flex size-6 shrink-0">
      <input
        id={id}
        type="checkbox"
        checked={fatto}
        onChange={onCambia}
        aria-label={etichetta}
        className="peer absolute -inset-2.5 z-10 size-11 cursor-pointer appearance-none rounded-sm"
      />
      <span
        aria-hidden="true"
        className="size-6 rounded-sm border-2 border-linea bg-sfondo transition-colors duration-150 peer-checked:border-riempimento peer-checked:bg-riempimento peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-link"
      />
      <CheckIcon
        weight="bold"
        aria-hidden="true"
        className="pointer-events-none absolute inset-1 size-4 scale-50 text-sfondo opacity-0 transition-[opacity,transform] duration-150 ease-(--ease-uscita) peer-checked:scale-100 peer-checked:opacity-100"
      />
    </span>
  );
}

function Dettagli({ d, inline = false }: { d: Gruppo["voci"][number]["dettagli"]; inline?: boolean }) {
  if (!d.length) return null;
  if (d.length === 1) return <span className="block text-sm text-tenue">{d[0].valore}</span>;
  return (
    <span className={`block text-sm text-tenue ${inline ? "" : "mt-0.5"}`}>
      {d.map((x, i) => (
        <span key={i} className="block">
          <span className="font-medium">{x.etichetta}:</span> {x.valore}
        </span>
      ))}
    </span>
  );
}

export function ChecklistGruppo({ articolo, gruppo }: { articolo: number; gruppo: Gruppo }) {
  const { fatti, filtro, cambia } = useSpunte(articolo);
  const n = gruppo.voci.filter((v) => fatti.has(v.id)).length;
  const visibili = gruppo.voci.filter((v) => !(filtro && fatti.has(v.id)));
  const tuttiNascosti = filtro && visibili.length === 0;

  const testa = (
    <div className="mb-2 flex items-center justify-between gap-3">
      <p className="text-sm text-tenue">Spunta quelli che hai ottenuto</p>
      <Contatore fatti={n} totale={gruppo.voci.length} />
    </div>
  );
  const vuoto = tuttiNascosti ? <p className="py-3 text-sm text-tenue">Tutti i trofei di questo gruppo sono spuntati.</p> : null;

  return (
    <section aria-label={`Trofei: ${gruppo.titolo}`} className="my-6" id={gruppo.id}>
      {/* Scelta del piano 02: «Lista», spunta a sinistra, nome in grassetto, come ottenerlo sotto */}
      <div>
        {testa}
        {vuoto}
        <ul className="border-t border-linea">
          {visibili.map((v) => {
            const fatto = fatti.has(v.id);
            return (
              <li key={v.id} data-trofeo={v.id} data-fatto={fatto} className="scroll-mt-28 border-b border-linea">
                <label
                  htmlFor={`a-${v.id}`}
                  className={`-mx-2 flex min-h-11 cursor-pointer gap-3 rounded-lg px-2 py-3 transition-[opacity,background-color] duration-150 [@media(hover:hover)]:hover:bg-superficie ${fatto ? "opacity-55" : ""}`}
                >
                  <Casella id={`a-${v.id}`} fatto={fatto} onCambia={() => cambia(v.id)} etichetta={v.nome} />
                  <span className="min-w-0">
                    <span className="block font-semibold leading-snug">{v.nome}</span>
                    <Dettagli d={v.dettagli} />
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
      </div>

    </section>
  );
}

/** Nota onesta sul salvataggio e azzeramento con conferma in linea (niente finestre). */
export function NotaEAzzera({ articolo, ids }: { articolo: number; ids: string[] }) {
  const { fatti, persistente, azzera } = useSpunte(articolo);
  const quanti = ids.filter((i) => fatti.has(i)).length;
  return (
    <div className="my-6 rounded-lg border border-linea p-4 text-sm text-tenue">
      <p>
        {persistente
          ? "Le spunte restano su questo dispositivo e in questo browser. Non sono collegate al tuo profilo PlayStation: una spunta non certifica il trofeo."
          : "Questo browser non permette di salvare: le spunte valgono solo per questa visita."}
      </p>
      {quanti > 0 && (
        <details className="group mt-3">
          <summary className="inline-flex min-h-11 cursor-pointer list-none items-center font-medium text-link">
            Azzera le spunte di questa guida
          </summary>
          <p className="mt-1 flex flex-wrap items-center gap-3">
            <span>Sicuro? Le {quanti} spunte non si recuperano.</span>
            <button
              type="button"
              onClick={() => azzera(ids)}
              className="inline-flex min-h-11 items-center rounded-lg border border-(--errore) px-3 font-semibold text-(--errore) active:scale-[0.97]"
            >
              Azzera
            </button>
          </p>
        </details>
      )}
    </div>
  );
}
