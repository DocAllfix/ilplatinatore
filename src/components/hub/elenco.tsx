"use client";

// Le guide del gioco per tipo di aiuto, con il filtro (primo filtro chiesto dal PDF 04). Due stili:
// pulsanti in fila («chip») o tessere con icona e numero («tessere», sul modello dell'indice di Game8).

import { CaretDownIcon } from "@phosphor-icons/react/ssr";
import Link from "next/link";
import { useState } from "react";
import { IconaAiuto } from "./icone";
import { senzaGioco, type Aiuto } from "@/lib/hub";

export type VoceGuida = { id: number; titolo: string; percorso: string };
export type Gruppo = { aiuto: Aiuto; guide: VoceGuida[] };

const PRIME = 6;

function Elenco({ g, tutte }: { g: Gruppo; tutte: boolean }) {
  const [aperto, setAperto] = useState(false);
  const mostra = tutte || aperto ? g.guide : g.guide.slice(0, PRIME);
  return (
    <section aria-label={g.aiuto}>
      <h3 className="flex items-center gap-2 text-lg font-bold">
        <IconaAiuto aiuto={g.aiuto} className="size-5 text-viola" />
        {g.aiuto}
        <span className="cifre text-sm font-medium text-tenue">{g.guide.length}</span>
      </h3>
      <ul className="mt-2 border-t border-linea">
        {mostra.map((v) => (
          <li key={v.id} className="border-b border-linea">
            <Link href={v.percorso} className="flex min-h-12 items-center py-2.5 leading-snug [@media(hover:hover)]:hover:text-link">
              {senzaGioco(v.titolo)}
            </Link>
          </li>
        ))}
      </ul>
      {!tutte && !aperto && g.guide.length > PRIME && (
        <button type="button" onClick={() => setAperto(true)} className="mt-1 inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-link">
          Mostra tutte ({g.guide.length})
          <CaretDownIcon weight="bold" className="size-3.5" aria-hidden="true" />
        </button>
      )}
    </section>
  );
}

export function GuidePerTipo({ gruppi, stile = "chip" }: { gruppi: Gruppo[]; stile?: "chip" | "tessere" }) {
  const [scelto, setScelto] = useState<Aiuto | null>(null);
  const visibili = scelto ? gruppi.filter((g) => g.aiuto === scelto) : gruppi;
  const totale = gruppi.reduce((n, g) => n + g.guide.length, 0);

  const filtro =
    stile === "tessere" ? (
      <div role="group" aria-label="Filtra per tipo di aiuto" className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {gruppi.map((g) => {
          const attivo = scelto === g.aiuto;
          return (
            <button
              key={g.aiuto}
              type="button"
              aria-pressed={attivo}
              onClick={() => setScelto(attivo ? null : g.aiuto)}
              className={`flex min-h-16 items-center gap-3 rounded-xl border p-3 text-left transition-[background-color,border-color,transform] duration-150 active:scale-[0.98] ${
                attivo ? "border-azione bg-azione text-su-azione" : "border-linea bg-superficie [@media(hover:hover)]:hover:border-link"
              }`}
            >
              <IconaAiuto aiuto={g.aiuto} className={`size-6 shrink-0 ${attivo ? "" : "text-viola"}`} />
              <span className="min-w-0">
                <span className="block text-sm font-semibold leading-tight">{g.aiuto}</span>
                <span className={`cifre text-xs ${attivo ? "" : "text-tenue"}`}>{g.guide.length === 1 ? "1 guida" : `${g.guide.length} guide`}</span>
              </span>
            </button>
          );
        })}
      </div>
    ) : (
      <div className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none]" role="group" aria-label="Filtra per tipo di aiuto">
        <div className="flex w-max gap-2">
          {[null, ...gruppi.map((g) => g.aiuto)].map((a) => {
            const attivo = scelto === a;
            return (
              <button
                key={a ?? "tutte"}
                type="button"
                aria-pressed={attivo}
                onClick={() => setScelto(a)}
                className={`inline-flex min-h-11 items-center gap-1.5 whitespace-nowrap rounded-full border px-4 text-sm font-semibold transition-[background-color,border-color,transform] duration-150 active:scale-[0.97] ${
                  attivo ? "border-azione bg-azione text-su-azione" : "border-linea [@media(hover:hover)]:hover:border-link"
                }`}
              >
                {a ? a : `Tutte (${totale})`}
              </button>
            );
          })}
        </div>
      </div>
    );

  return (
    <div className="flex flex-col gap-6">
      {filtro}
      {visibili.map((g) => (
        <Elenco key={g.aiuto} g={g} tutte={scelto !== null} />
      ))}
    </div>
  );
}
