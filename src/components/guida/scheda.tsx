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
          className={`${piccole ? "h-1.5 w-2" : "h-2 w-full max-w-4"} rounded-full ${i < Math.round(voto) ? "bg-riempimento" : "bg-linea"}`}
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

/** Il valore principale (ore per il platino) sul blocco Acido inclinato, firma dei post social. */
function BloccoAcido({ children }: { children: React.ReactNode }) {
  return (
    <span className="cifre inline-block -skew-x-6 whitespace-nowrap bg-azione px-2.5 py-1 text-[1.375rem] font-bold leading-none text-su-azione min-[400px]:text-[1.625rem]">
      {children}
    </span>
  );
}

/** La griglia di quattro dati (dalla variante A), comune alle tre varianti della copertina. */
function Griglia4({ s, linee = false }: { s: Scheda; linee?: boolean }) {
  const cella = linee ? "border-linea p-3 [&:nth-child(odd)]:border-r [&:nth-child(-n+2)]:border-b" : "";
  return (
    <dl className={`grid grid-cols-2 ${linee ? "" : "gap-x-4 gap-y-5"}`}>
      {s.tempo && (
        <div className={cella}>
          <Dato etichetta="Platino in">
            <BloccoAcido>{s.tempo}</BloccoAcido>
          </Dato>
        </div>
      )}
      {s.difficolta && (
        <div className={cella}>
          <Dato etichetta="Difficoltà">
            <span className="cifre text-[1.625rem] font-bold leading-none">
              {s.difficolta.voto}
              <span className="text-base font-medium text-tenue">/{s.difficolta.massimo}</span>
            </span>
            <span className="mt-2 block">
              <Tacche {...s.difficolta} />
            </span>
          </Dato>
        </div>
      )}
      {s.partite && (
        <div className={cella}>
          <Dato etichetta="Partite">
            <span className="cifre text-[1.625rem] font-bold leading-none">{s.partite}</span>
          </Dato>
        </div>
      )}
      {s.trofei?.totale !== undefined && (
        <div className={cella}>
          <Dato etichetta="Trofei">
            <span className="cifre text-[1.625rem] font-bold leading-none">{s.trofei.totale}</span>
          </Dato>
        </div>
      )}
    </dl>
  );
}

function Piede({ s }: { s: Scheda }) {
  return (
    <>
      <div className="mt-4">
        <Mancabili s={s} />
      </div>
      <TuttiIDati s={s} />
      <p className="mt-2 text-xs text-tenue">{NOTA}</p>
    </>
  );
}

/** A, «Pannello»: sotto la copertina, la griglia in un riquadro separato. */
export function SchedaPannello({ s }: { s: Scheda }) {
  return (
    <section aria-label="Il platino in breve" className="mt-4 rounded-xl border border-linea bg-superficie p-4">
      <Griglia4 s={s} />
      <Piede s={s} />
    </section>
  );
}

/** B, «Sovrapposta»: il riquadro sale sul fondo della copertina, come una scheda appoggiata. */
export function SchedaSovrapposta({ s }: { s: Scheda }) {
  return (
    <section
      aria-label="Il platino in breve"
      className="relative z-10 -mt-12 rounded-xl border border-linea bg-superficie-alta p-4 shadow-[0_8px_24px_oklch(0%_0_0/0.45)]"
    >
      <Griglia4 s={s} />
      <Piede s={s} />
    </section>
  );
}

/** C, «Fascia»: la griglia a tutta larghezza attaccata alla copertina, con linee sottili fra i dati. */
export function SchedaFascia({ s }: { s: Scheda }) {
  return (
    <section aria-label="Il platino in breve" className="-mx-4 border-b border-linea bg-superficie px-4 pb-4 pt-1">
      <div className="-mx-1">
        <Griglia4 s={s} linee />
      </div>
      <Piede s={s} />
    </section>
  );
}
