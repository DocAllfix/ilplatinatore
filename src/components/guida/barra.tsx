"use client";

// Barra di progressione (PDF 05): contatore generale e quattro comandi, Indice, Da completare,
// Riprendi, Inizio. Fissa in basso da telefono e in alto da computer; compare quando la scheda
// riassuntiva esce dallo schermo (IntersectionObserver, niente ascolto dello scorrimento).

import { ArrowLineUpIcon, ListBulletsIcon, PlayIcon, FunnelSimpleIcon } from "@phosphor-icons/react/ssr";
import { useEffect, useState } from "react";
import type { VoceIndice } from "@/lib/guida/checklist";
import { useSpunte } from "./spunte";

export function BarraProgressione({ articolo, ids, indice }: { articolo: number; ids: string[]; indice: VoceIndice[] }) {
  const { fatti, filtro, impostaFiltro } = useSpunte(articolo);
  const [visibile, setVisibile] = useState(false);
  const [indiceAperto, setIndiceAperto] = useState(false);
  const n = ids.filter((i) => fatti.has(i)).length;

  useEffect(() => {
    const segno = document.getElementById("fine-scheda");
    if (!segno) return; // il segnaposto c'e' sempre nelle guide con checklist
    const oss = new IntersectionObserver(([e]) => setVisibile(e.boundingClientRect.top < 0 && !e.isIntersecting));
    oss.observe(segno);
    return () => oss.disconnect();
  }, []);

  function riprendi() {
    const primo = ids.find((i) => !fatti.has(i));
    if (!primo) return;
    // la stessa riga esiste in ogni variante dell'anteprima: si prende quella visibile
    const el = [...document.querySelectorAll<HTMLElement>(`[data-trofeo="${primo}"]`)].find((x) => x.checkVisibility());
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
    el?.querySelector<HTMLElement>("input,button")?.focus({ preventScroll: true });
  }

  const comando =
    "flex min-h-11 flex-1 flex-col items-center justify-center gap-0.5 rounded-lg px-1 text-[0.6875rem] font-semibold transition-[background-color,color,transform] duration-150 active:scale-[0.97] md:flex-row md:gap-1.5 md:px-3 md:text-sm";

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-40 border-t border-linea bg-superficie-alta pb-[env(safe-area-inset-bottom)] transition-transform duration-[var(--durata-media)] ease-[var(--ease-uscita)] md:top-0 md:bottom-auto md:border-t-0 md:border-b ${
        visibile ? "translate-y-0" : "translate-y-full md:-translate-y-full"
      }`}
      aria-hidden={!visibile}
      inert={!visibile}
    >
      {indiceAperto && (
        <nav aria-label="Indice della guida" className="max-h-[55vh] overflow-y-auto border-b border-linea px-4 py-2 md:absolute md:inset-x-0 md:top-full md:border-t md:bg-superficie-alta">
          <ol className="mx-auto max-w-3xl">
            {indice.map((v) => (
              <li key={v.id}>
                <a href={`#${v.id}`} onClick={() => setIndiceAperto(false)} className="flex min-h-11 items-center text-sm hover:text-link">
                  {v.testo}
                </a>
              </li>
            ))}
          </ol>
        </nav>
      )}
      <div className="mx-auto flex max-w-3xl items-center gap-2 px-3 py-2">
        <div className="min-w-[6.5rem] pr-1">
          <p className="cifre text-sm font-bold leading-tight" aria-live="polite">
            <span key={n} className="inline-block animate-[scatto_250ms_var(--ease-uscita)]">{n}</span> di {ids.length}
          </p>
          <p className="text-[0.6875rem] text-tenue">trofei in questa guida</p>
          <span className="mt-1 block h-1 overflow-hidden rounded-full bg-linea" aria-hidden="true">
            <span
              className="block h-full origin-left rounded-full bg-riempimento transition-transform duration-[var(--durata-lunga)] ease-[var(--ease-uscita)]"
              style={{ transform: `scaleX(${ids.length ? n / ids.length : 0})` }}
            />
          </span>
        </div>
        <button type="button" onClick={() => setIndiceAperto((x) => !x)} aria-expanded={indiceAperto} className={`${comando} ${indiceAperto ? "bg-sfondo text-link" : "text-testo"}`}>
          <ListBulletsIcon className="size-5" aria-hidden="true" />
          Indice
        </button>
        <button type="button" onClick={() => impostaFiltro(!filtro)} aria-pressed={filtro} className={`${comando} ${filtro ? "bg-azione text-su-azione" : "text-testo"}`}>
          <FunnelSimpleIcon className="size-5" aria-hidden="true" />
          Da completare
        </button>
        <button type="button" onClick={riprendi} disabled={n === ids.length} className={`${comando} text-testo disabled:opacity-40`}>
          <PlayIcon className="size-5" aria-hidden="true" />
          Riprendi
        </button>
        <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className={`${comando} text-testo`}>
          <ArrowLineUpIcon className="size-5" aria-hidden="true" />
          Inizio
        </button>
      </div>
    </div>
  );
}
