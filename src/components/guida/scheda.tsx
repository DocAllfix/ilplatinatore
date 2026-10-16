// Scheda riassuntiva della guida (PDF 03), in tre varianti da scegliere sull'anteprima.
// Solo HTML e CSS: il «tutti i dati» e' un <details> nativo. I numeri usano cifre tabulari.

import { CaretDownIcon, WarningIcon } from "@phosphor-icons/react/ssr";
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
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between text-sm font-medium text-link [@media(hover:hover)]:hover:underline [@media(hover:hover)]:hover:underline-offset-4">
        {apertoDa} ({voci.length})
        <CaretDownIcon
          weight="bold"
          aria-hidden="true"
          className="size-4 transition-transform duration-[var(--durata-media)] ease-[var(--ease-uscita)] group-open:rotate-180"
        />
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
      <WarningIcon weight="fill" className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <span>
        {s.mancabili.numero === 1 ? "1 trofeo mancabile" : `${s.mancabili.numero} trofei mancabili`}
        {s.mancabili.nomi && <span className="text-testo">: {s.mancabili.nomi}</span>}
      </span>
    </p>
  );
}

function Dato({ etichetta, children, className = "" }: { etichetta: string; children: React.ReactNode; className?: string }) {
  return (
    // un <div> che raggruppa dt e dd e' figlio ammesso di <dl>: niente altri contenitori in mezzo
    <div className={`min-w-0 ${className}`}>
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
        <Dato etichetta="Platino in" className={cella}>
            <BloccoAcido>{s.tempo}</BloccoAcido>
          </Dato>
      )}
      {s.difficolta && (
        <Dato etichetta="Difficoltà" className={cella}>
            <span className="cifre text-[1.625rem] font-bold leading-none">
              {s.difficolta.voto}
              <span className="text-base font-medium text-tenue">/{s.difficolta.massimo}</span>
            </span>
            <span className="mt-2 block">
              <Tacche {...s.difficolta} />
            </span>
          </Dato>
      )}
      {s.partite && (
        <Dato etichetta="Partite" className={cella}>
            <span className="cifre text-[1.625rem] font-bold leading-none">{s.partite}</span>
          </Dato>
      )}
      {s.trofei?.totale !== undefined && (
        <Dato etichetta="Trofei" className={cella}>
            <span className="cifre text-[1.625rem] font-bold leading-none">{s.trofei.totale}</span>
          </Dato>
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
      <p className="mt-2 text-xs text-tenue">{s.nota || NOTA}</p>
    </>
  );
}

/** Scheda riassuntiva (scelta: «Sovrapposta»): il riquadro sale sul fondo della copertina. */
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

