// Scheda riassuntiva della guida (PDF 03), in tre varianti da scegliere sull'anteprima.
// Solo HTML e CSS: il «tutti i dati» e' un <details> nativo. I numeri usano cifre tabulari.

import type { Scheda } from "@/lib/guida/scheda";

const NOTA = "Stime della redazione: tempi e difficoltà dipendono dall'abilità e dalla versione del gioco.";

/** Difficolta' come 10 tacche: il numero e' sempre scritto, le tacche aiutano a colpo d'occhio. */
export function Tacche({ voto, massimo, piccole = false }: { voto: number; massimo: number; piccole?: boolean }) {
  return (
    <span className="flex gap-0.5" role="img" aria-label={`Difficoltà ${voto} su ${massimo}`}>
      {Array.from({ length: massimo }, (_, i) => (
        <span
          key={i}
          className={`${piccole ? "h-1.5 w-2" : "h-2 w-full max-w-4"} rounded-full ${i < Math.round(voto) ? "bg-azione" : "bg-linea"}`}
        />
      ))}
    </span>
  );
}

function IconaAvviso() {
  return (
    <svg viewBox="0 0 20 20" className="size-4 shrink-0" aria-hidden="true">
      <path fill="currentColor" d="M10 2 1 18h18L10 2Zm0 5 .1 0c.5 0 .9.4.9.9l-.3 5c0 .4-.3.6-.7.6s-.7-.3-.7-.6l-.3-5c0-.5.4-.9 1-.9Zm0 9.2a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z" />
    </svg>
  );
}

function TuttiIDati({ s, apertoDa = "Tutti i dati" }: { s: Scheda; apertoDa?: string }) {
  const voci = [
    ...(s.online ? [{ etichetta: "Trofei online", valore: s.online }] : []),
    ...(s.trofei?.totale !== undefined
      ? [
          {
            etichetta: "Trofei",
            valore: [
              `${s.trofei.totale} in tutto`,
              s.trofei.oro !== undefined && `${s.trofei.oro} oro`,
              s.trofei.argento !== undefined && `${s.trofei.argento} argento`,
              s.trofei.bronzo !== undefined && `${s.trofei.bronzo} bronzo`,
            ]
              .filter(Boolean)
              .join(", "),
          },
        ]
      : []),
    ...s.altre,
  ];
  if (!voci.length) return null;
  return (
    <details className="group mt-3 border-t border-linea">
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between text-sm font-medium text-link">
        {apertoDa} ({voci.length})
        <span aria-hidden="true" className="transition-transform duration-200 group-open:rotate-180">
          ▾
        </span>
      </summary>
      <dl className="grid gap-x-4 gap-y-2 pb-2 text-sm sm:grid-cols-2">
        {voci.map((v) => (
          <div key={v.etichetta} className="flex justify-between gap-3 border-b border-linea/60 pb-2">
            <dt className="text-tenue">{v.etichetta}</dt>
            <dd className="text-right font-medium">{v.valore}</dd>
          </div>
        ))}
      </dl>
    </details>
  );
}

function Mancabili({ s }: { s: Scheda }) {
  if (!s.mancabili) return null;
  if (s.mancabili.numero === 0)
    return <p className="text-sm text-tenue">Nessun trofeo mancabile</p>;
  return (
    <p className="flex items-start gap-2 text-sm font-medium text-avviso">
      <IconaAvviso />
      <span>
        {s.mancabili.numero === 1 ? "1 trofeo mancabile" : `${s.mancabili.numero} trofei mancabili`}
        {s.mancabili.nomi && <span className="text-testo">: {s.mancabili.nomi}</span>}
      </span>
    </p>
  );
}

function Dato({ etichetta, children }: { etichetta: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-[0.8125rem] font-semibold uppercase tracking-[0.04em] text-tenue">{etichetta}</dt>
      <dd className="mt-1">{children}</dd>
    </div>
  );
}

/** A, «Pannello»: griglia di dati grandi, poi trofei e dettagli. */
export function SchedaPannello({ s }: { s: Scheda }) {
  return (
    <section aria-label="Il platino in breve" className="rounded-xl border border-linea bg-superficie p-4">
      <dl className="grid grid-cols-2 gap-x-4 gap-y-5">
        {s.difficolta && (
          <Dato etichetta="Difficoltà">
            <span className="cifre text-[1.75rem] font-bold leading-none">
              {s.difficolta.voto}
              <span className="text-base font-medium text-tenue">/{s.difficolta.massimo}</span>
            </span>
            <span className="mt-2 block">
              <Tacche {...s.difficolta} />
            </span>
          </Dato>
        )}
        {s.tempo && (
          <Dato etichetta="Platino in">
            <span className="cifre text-[1.75rem] font-bold leading-none">{s.tempo.replace(/\s*ore$/, "")}</span>
            <span className="ml-1 text-base text-tenue">{/ore$/.test(s.tempo) ? "ore" : ""}</span>
          </Dato>
        )}
        {s.partite && (
          <Dato etichetta="Partite">
            <span className="cifre text-[1.75rem] font-bold leading-none">{s.partite}</span>
          </Dato>
        )}
        {s.trofei?.totale !== undefined && (
          <Dato etichetta="Trofei">
            <span className="cifre text-[1.75rem] font-bold leading-none">{s.trofei.totale}</span>
          </Dato>
        )}
      </dl>
      <div className="mt-5">
        <Mancabili s={s} />
      </div>
      <TuttiIDati s={s} />
      <p className="mt-2 text-xs text-tenue">{NOTA}</p>
    </section>
  );
}

/** B, «Striscia»: tre numeri in una riga, il mancabile in evidenza, il resto in un pannello. */
export function SchedaStriscia({ s }: { s: Scheda }) {
  const voci = [
    s.difficolta && { e: "Difficoltà", v: `${s.difficolta.voto}/${s.difficolta.massimo}`, tacche: true },
    s.tempo && { e: "Platino", v: s.tempo },
    s.partite && { e: "Partite", v: s.partite },
  ].filter(Boolean) as Array<{ e: string; v: string; tacche?: boolean }>;
  return (
    <section aria-label="Il platino in breve" className="border-y border-linea py-3">
      <dl className="grid grid-cols-3 divide-x divide-linea">
        {voci.map((x) => (
          <div key={x.e} className="px-3 first:pl-0">
            <dt className="text-xs font-semibold uppercase tracking-[0.04em] text-tenue">{x.e}</dt>
            <dd className="cifre mt-1 text-lg font-bold leading-tight">{x.v}</dd>
            {x.tacche && s.difficolta && (
              <dd className="mt-1.5">
                <Tacche {...s.difficolta} piccole />
              </dd>
            )}
          </div>
        ))}
      </dl>
      {s.mancabili && (
        <div className="mt-3 rounded-lg bg-superficie px-3 py-2.5">
          <Mancabili s={s} />
        </div>
      )}
      <TuttiIDati s={s} apertoDa="Altri dati del platino" />
    </section>
  );
}

/** C, «Copertina»: la fascia sotto la copertina, con il dato principale su blocco Acido inclinato. */
export function SchedaCopertina({ s }: { s: Scheda }) {
  return (
    <section aria-label="Il platino in breve" className="bg-superficie px-4 pb-4 pt-5">
      <div className="flex flex-wrap items-end gap-x-6 gap-y-4">
        {s.tempo && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.04em] text-tenue">Platino in</p>
            <p className="mt-1.5">
              <span className="cifre inline-block -skew-x-6 bg-azione px-3 py-1 text-[1.75rem] font-bold leading-none text-su-azione">
                {s.tempo}
              </span>
            </p>
          </div>
        )}
        {s.difficolta && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.04em] text-tenue">Difficoltà</p>
            <p className="cifre mt-1.5 text-xl font-bold leading-none">
              {s.difficolta.voto}/{s.difficolta.massimo}
            </p>
            <span className="mt-1.5 block w-24">
              <Tacche {...s.difficolta} piccole />
            </span>
          </div>
        )}
        {s.partite && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.04em] text-tenue">Partite</p>
            <p className="cifre mt-1.5 text-xl font-bold leading-none">{s.partite}</p>
          </div>
        )}
      </div>
      <div className="mt-4">
        <Mancabili s={s} />
      </div>
      <TuttiIDati s={s} />
    </section>
  );
}
