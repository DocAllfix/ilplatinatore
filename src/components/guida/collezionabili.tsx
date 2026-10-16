"use client";

// Tabella dei mancanti (PDF 06, piano 03) in testa agli articoli dei collezionabili. Stesse spunte,
// stessa memoria e stessa pillola della checklist dei trofei. Variante scelta: B «Tabella»
// (17/10/2026).

import { ArrowDownIcon, CheckIcon, EyeIcon } from "@phosphor-icons/react/ssr";
import { useState } from "react";
import { distinti, plurale, type Collezionabile } from "@/lib/guida/collezionabili";
import { Casella } from "./checklist";
import { useSpunte } from "./spunte";

type Props = { articolo: number; voci: Collezionabile[] };

const PULSANTE =
  "inline-flex min-h-11 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-4 text-sm font-semibold transition-[background-color,border-color,color,transform] duration-150 active:scale-[0.97]";
const pulsante = (attivo: boolean) =>
  `${PULSANTE} ${attivo ? "border-azione bg-azione text-su-azione" : "border-linea text-testo [@media(hover:hover)]:hover:border-link"}`;

function Conteggio({ n, di, chiave }: { n: number; di: number; chiave?: string }) {
  return (
    <span key={chiave ?? n} className="cifre inline-block animate-[scatto_250ms_var(--ease-uscita)]">
      {n} di {di}
    </span>
  );
}

/** Contatore generale e per tipo: il colpo d'occhio su cosa manca. */
function Riepilogo({ voci, fatti }: { voci: Collezionabile[]; fatti: ReadonlySet<string> }) {
  const n = voci.filter((v) => fatti.has(v.id)).length;
  const completo = n === voci.length;
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-lg font-bold" aria-live="polite">
          <Conteggio n={n} di={voci.length} /> <span className="font-medium text-tenue">oggetti</span>
        </p>
        {completo && (
          <span className="inline-flex items-center gap-1 rounded bg-azione px-2 py-0.5 text-sm font-semibold text-su-azione">
            <CheckIcon weight="bold" className="size-3.5" aria-hidden="true" />
            Capitolo completato
          </span>
        )}
      </div>
      <span className="block h-1.5 overflow-hidden rounded-full bg-linea" aria-hidden="true">
        <span
          className="block h-full origin-left rounded-full bg-riempimento transition-transform duration-[var(--durata-lunga)] ease-(--ease-uscita)"
          style={{ transform: `scaleX(${voci.length ? n / voci.length : 0})` }}
        />
      </span>
      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-tenue">
        {distinti(voci, (v) => v.tipo).map((t) => {
          const delTipo = voci.filter((v) => v.tipo === t);
          const k = delTipo.filter((v) => fatti.has(v.id)).length;
          return (
            <li key={t} className={k === delTipo.length ? "text-testo" : ""}>
              <span className="font-medium">{plurale(t)}</span> <Conteggio n={k} di={delTipo.length} chiave={`${t}-${k}`} />
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** Il nome, o un velo se e' uno spoiler e il lettore non ha chiesto di vederlo. */
function Nome({ v, spoiler }: { v: Collezionabile; spoiler: boolean }) {
  const [visto, setVisto] = useState(false);
  if (!v.spoiler || spoiler || visto)
    return <span className="block font-semibold leading-snug">{v.oggetto}</span>;
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        setVisto(true);
      }}
      className="relative z-20 -my-2 inline-flex min-h-11 items-center gap-1.5 font-semibold text-tenue"
    >
      <EyeIcon className="size-4" aria-hidden="true" />
      Spoiler, tocca per vedere
    </button>
  );
}

function ComePrenderlo({ ancora }: { ancora: string | null }) {
  if (!ancora) return null;
  return (
    <a
      href={`#${ancora}`}
      className="relative z-20 inline-flex min-h-11 shrink-0 items-center gap-1 text-sm font-semibold whitespace-nowrap text-link [@media(hover:hover)]:hover:underline"
    >
      Come prenderlo
      <ArrowDownIcon weight="bold" className="size-3.5" aria-hidden="true" />
    </a>
  );
}

function Vuoto({ children }: { children: React.ReactNode }) {
  return <p className="border-b border-linea py-4 text-sm text-tenue">{children}</p>;
}

/** Una tabella vera (Stato, Oggetto, Area, Tipo); da telefono le righe si impilano. */
function Tabella({ articolo, voci, spoiler }: Props & { spoiler: boolean }) {
  const { fatti, cambia } = useSpunte(articolo);
  if (!voci.length) return <Vuoto>Nessun oggetto da mostrare con questi filtri.</Vuoto>;
  return (
    <table className="w-full border-collapse text-left text-sm">
      <thead className="sr-only md:not-sr-only">
        <tr className="border-b border-linea text-xs uppercase tracking-[0.04em] text-tenue">
          <th scope="col" className="w-12 py-2 font-semibold">Stato</th>
          <th scope="col" className="py-2 font-semibold">Oggetto</th>
          <th scope="col" className="py-2 font-semibold">Area</th>
          <th scope="col" className="py-2 font-semibold">Tipo</th>
        </tr>
      </thead>
      <tbody>
        {voci.map((v) => {
          const fatto = fatti.has(v.id);
          return (
            <tr
              key={v.id}
              data-trofeo={v.id}
              data-fatto={fatto}
              className={`grid grid-cols-[2.5rem_1fr] gap-x-2 border-b border-linea py-2 transition-opacity duration-150 md:table-row md:py-0 ${fatto ? "opacity-55" : ""}`}
            >
              <td className="pt-2.5 md:py-3 md:align-top">
                <Casella id={`t-${v.id}`} fatto={fatto} onCambia={() => cambia(v.id)} etichetta={v.spoiler && !spoiler ? `Oggetto nascosto, ${v.tipo}` : v.oggetto} />
              </td>
              <td className="min-w-0 pt-2 md:py-3 md:pr-3 md:align-top">
                <label htmlFor={`t-${v.id}`} className="block cursor-pointer">
                  <Nome v={v} spoiler={spoiler} />
                  {/* da telefono area e tipo stanno qui, sotto il nome */}
                  <span className="block text-tenue md:hidden">
                    {v.area} · {v.tipo}
                  </span>
                  {v.prerequisito && <span className="block text-tenue">serve: {v.prerequisito}</span>}
                </label>
                <div className="-mb-2 -mt-1">
                  <ComePrenderlo ancora={v.ancora} />
                </div>
              </td>
              <td className="hidden md:table-cell md:py-3 md:pr-3 md:align-top">{v.area}</td>
              <td className="hidden md:table-cell md:py-3 md:align-top">{v.tipo}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

/** Fila di pulsanti per le aree, scorrevole da telefono. */
function FiltroAree({ voci, area, scegli }: Pick<Props, "voci"> & { area: string | null; scegli: (a: string | null) => void }) {
  const aree = distinti(voci, (v) => v.area);
  return (
    <div className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] md:mx-0 md:px-0" role="group" aria-label="Filtra per area">
      <div className="flex w-max gap-2">
        <button type="button" onClick={() => scegli(null)} aria-pressed={area === null} className={pulsante(area === null)}>
          Tutte le aree
        </button>
        {aree.map((a) => (
          <button key={a} type="button" onClick={() => scegli(a)} aria-pressed={area === a} className={pulsante(area === a)}>
            {a}
          </button>
        ))}
      </div>
    </div>
  );
}

export function TabellaCollezionabili({ articolo, voci }: Props) {
  const { fatti, filtro, impostaFiltro } = useSpunte(articolo);
  const [area, setArea] = useState<string | null>(null);
  const [spoiler, setSpoiler] = useState(false);
  const ciSonoSpoiler = voci.some((v) => v.spoiler);
  const visibile = (v: Collezionabile) => !(filtro && fatti.has(v.id)) && (!area || v.area === area);
  const righe = voci.filter(visibile);

  return (
    <section id="collezionabili" data-collezionabili aria-labelledby="titolo-collezionabili" className="my-6 scroll-mt-4 rounded-xl border border-linea p-4 md:p-5">
      <h2 id="titolo-collezionabili" className="mb-3 text-xs font-semibold uppercase tracking-[0.06em] text-tenue">
        Cosa ti manca in questo capitolo
      </h2>
      <Riepilogo voci={voci} fatti={fatti} />

      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" onClick={() => impostaFiltro(!filtro)} aria-pressed={filtro} className={pulsante(filtro)}>
          Solo mancanti
        </button>
        {ciSonoSpoiler && (
          <button type="button" onClick={() => setSpoiler((x) => !x)} aria-pressed={spoiler} className={pulsante(spoiler)}>
            <EyeIcon className="size-4" aria-hidden="true" />
            Mostra spoiler
          </button>
        )}
      </div>
      <div className="mt-3">
        <FiltroAree voci={voci} area={area} scegli={setArea} />
      </div>

      <div className="mt-4">
        <Tabella articolo={articolo} voci={righe} spoiler={spoiler} />
      </div>
    </section>
  );
}
