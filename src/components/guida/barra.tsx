"use client";

// Barra di progressione (PDF 05): contatore generale e quattro comandi, Indice, Mancanti (Da
// completare), Riprendi, Inizio. Sempre IN BASSO: in alto, da tablet e computer, al proprietario non
// piaceva (16/10/2026). Tre varianti in prova (piano 02, giro 2):
//   A «In basso ovunque»  la barra completa, fissa in basso
//   B «Pillola»            pillola compatta col contatore; un tocco apre il pannello dei comandi
//   C «Al bisogno»         la barra completa, ma compare solo quando si risale la pagina

import { ArrowLineUpIcon, CaretUpIcon, FunnelSimpleIcon, ListBulletsIcon, PlayIcon, XIcon } from "@phosphor-icons/react/ssr";
import { useEffect, useRef, useState } from "react";
import type { VoceIndice } from "@/lib/guida/checklist";
import { useSpunte } from "./spunte";

type Props = { articolo: number; ids: string[]; indice: VoceIndice[] };

/** La scheda riassuntiva e' uscita dallo schermo? (IntersectionObserver, niente calcoli sullo scorrimento) */
function useDopoLaScheda() {
  const [dopo, setDopo] = useState(false);
  useEffect(() => {
    const segno = document.getElementById("fine-scheda");
    if (!segno) return;
    const oss = new IntersectionObserver(([e]) => setDopo(e.boundingClientRect.top < 0 && !e.isIntersecting));
    oss.observe(segno);
    return () => oss.disconnect();
  }, []);
  return dopo;
}

/** Il lettore sta risalendo? Aggiorna lo stato solo quando la direzione cambia, non a ogni pixel. */
function useRisalendo(attivo: boolean) {
  const [su, setSu] = useState(false);
  const ultimo = useRef(0);
  useEffect(() => {
    if (!attivo) return;
    let inAttesa = false;
    const leggi = () => {
      inAttesa = false;
      const y = window.scrollY;
      const delta = y - ultimo.current;
      if (Math.abs(delta) > 8) {
        setSu(delta < 0);
        ultimo.current = y;
      }
    };
    const suScorrimento = () => {
      if (!inAttesa) {
        inAttesa = true;
        requestAnimationFrame(leggi);
      }
    };
    window.addEventListener("scroll", suScorrimento, { passive: true });
    return () => window.removeEventListener("scroll", suScorrimento);
  }, [attivo]);
  return su;
}

function useComandi({ articolo, ids }: Props) {
  const { fatti, filtro, impostaFiltro } = useSpunte(articolo);
  const n = ids.filter((i) => fatti.has(i)).length;
  function riprendi() {
    const primo = ids.find((i) => !fatti.has(i));
    if (!primo) return;
    const el = document.querySelector<HTMLElement>(`[data-trofeo="${primo}"]`);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
    el?.querySelector<HTMLElement>("input,button")?.focus({ preventScroll: true });
  }
  return { n, filtro, impostaFiltro, riprendi, inizio: () => window.scrollTo({ top: 0, behavior: "smooth" }) };
}

function Contatore({ n, totale }: { n: number; totale: number }) {
  return (
    <div className="min-w-[6.5rem] pr-1">
      <p className="cifre text-sm font-bold leading-tight" aria-live="polite" data-contatore-barra>
        <span key={n} className="inline-block animate-[scatto_250ms_var(--ease-uscita)]">
          {n}
        </span>{" "}
        di {totale}
      </p>
      <p className="text-[0.6875rem] text-tenue">trofei in questa guida</p>
      <span className="mt-1 block h-1 overflow-hidden rounded-full bg-linea" aria-hidden="true">
        <span
          className="block h-full origin-left rounded-full bg-riempimento transition-transform duration-[var(--durata-lunga)] ease-(--ease-uscita)"
          style={{ transform: `scaleX(${totale ? n / totale : 0})` }}
        />
      </span>
    </div>
  );
}

function ElencoIndice({ indice, chiudi }: { indice: VoceIndice[]; chiudi: () => void }) {
  return (
    <nav aria-label="Indice della guida" className="max-h-[50vh] overflow-y-auto px-4 py-2">
      <ol className="mx-auto max-w-3xl">
        {indice.map((v) => (
          <li key={v.id}>
            <a href={`#${v.id}`} onClick={chiudi} className="flex min-h-11 items-center text-sm [@media(hover:hover)]:hover:text-link">
              {v.testo}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

const COMANDO =
  "flex min-h-11 flex-1 flex-col items-center justify-center gap-0.5 whitespace-nowrap rounded-lg px-1 text-[0.6875rem] font-semibold transition-[background-color,color,transform] duration-150 active:scale-[0.97] md:flex-row md:gap-1.5 md:px-3 md:text-sm [@media(hover:hover)]:hover:text-link";

function Comandi({ props, indiceAperto, apriIndice }: { props: Props; indiceAperto: boolean; apriIndice: () => void }) {
  const c = useComandi(props);
  return (
    <>
      <button type="button" onClick={apriIndice} aria-expanded={indiceAperto} className={`${COMANDO} ${indiceAperto ? "bg-sfondo text-link" : "text-testo"}`}>
        <ListBulletsIcon className="size-5" aria-hidden="true" />
        Indice
      </button>
      <button
        type="button"
        onClick={() => c.impostaFiltro(!c.filtro)}
        aria-pressed={c.filtro}
        aria-label="Da completare"
        className={`${COMANDO} ${c.filtro ? "bg-azione text-su-azione" : "text-testo"}`}
      >
        <FunnelSimpleIcon className="size-5" aria-hidden="true" />
        Mancanti
      </button>
      <button type="button" onClick={c.riprendi} disabled={c.n === props.ids.length} className={`${COMANDO} text-testo disabled:opacity-40`}>
        <PlayIcon className="size-5" aria-hidden="true" />
        Riprendi
      </button>
      <button type="button" onClick={c.inizio} className={`${COMANDO} text-testo`}>
        <ArrowLineUpIcon className="size-5" aria-hidden="true" />
        Inizio
      </button>
    </>
  );
}

/** A e C: la barra completa in basso. Con `alBisogno` compare solo risalendo. */
export function BarraProgressione(props: Props & { alBisogno?: boolean }) {
  const dopo = useDopoLaScheda();
  const su = useRisalendo(Boolean(props.alBisogno));
  const [indiceAperto, setIndiceAperto] = useState(false);
  const { n } = useComandi(props);
  const visibile = dopo && (!props.alBisogno || su || indiceAperto);

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-40 border-t border-linea bg-superficie-alta pb-[env(safe-area-inset-bottom)] transition-transform duration-[var(--durata-media)] ease-(--ease-uscita) ${
        visibile ? "translate-y-0" : "translate-y-full"
      }`}
      aria-hidden={!visibile}
      inert={!visibile}
    >
      {indiceAperto && (
        <div className="border-b border-linea">
          <ElencoIndice indice={props.indice} chiudi={() => setIndiceAperto(false)} />
        </div>
      )}
      <div className="mx-auto flex max-w-3xl items-center gap-2 px-3 py-2">
        <Contatore n={n} totale={props.ids.length} />
        <Comandi props={props} indiceAperto={indiceAperto} apriIndice={() => setIndiceAperto((x) => !x)} />
      </div>
    </div>
  );
}

/** B: una pillola col contatore; il tocco apre il pannello dei comandi sopra di lei. */
export function PillolaProgressione(props: Props) {
  const dopo = useDopoLaScheda();
  const [aperta, setAperta] = useState(false);
  const [indiceAperto, setIndiceAperto] = useState(false);
  const { n } = useComandi(props);

  return (
    <div
      className={`fixed bottom-[max(0.75rem,env(safe-area-inset-bottom))] left-1/2 z-40 w-[min(100%-1.5rem,32rem)] -translate-x-1/2 transition-[opacity,transform] duration-[var(--durata-media)] ease-(--ease-uscita) ${
        dopo ? "opacity-100" : "pointer-events-none translate-y-4 opacity-0"
      }`}
      aria-hidden={!dopo}
      inert={!dopo}
    >
      {aperta && (
        <div className="mb-2 origin-bottom animate-[apri_200ms_var(--ease-uscita)] rounded-2xl border border-linea bg-superficie-alta shadow-[0_8px_24px_oklch(0%_0_0/0.45)]">
          {indiceAperto && (
            <div className="border-b border-linea">
              <ElencoIndice indice={props.indice} chiudi={() => setIndiceAperto(false)} />
            </div>
          )}
          <div className="flex gap-1 p-2">
            <Comandi props={props} indiceAperto={indiceAperto} apriIndice={() => setIndiceAperto((x) => !x)} />
          </div>
        </div>
      )}
      <button
        type="button"
        onClick={() => {
          setAperta((x) => !x);
          setIndiceAperto(false);
        }}
        aria-expanded={aperta}
        className="ml-auto flex min-h-12 items-center gap-3 rounded-full border border-linea bg-superficie-alta py-1.5 pl-4 pr-2 shadow-[0_8px_24px_oklch(0%_0_0/0.45)] transition-transform duration-150 active:scale-[0.97]"
      >
        <span className="cifre text-sm font-bold" aria-live="polite" data-contatore-barra>
          <span key={n} className="inline-block animate-[scatto_250ms_var(--ease-uscita)]">
            {n}
          </span>{" "}
          di {props.ids.length} <span className="font-medium text-tenue">trofei</span>
        </span>
        <span className="block h-1 w-14 overflow-hidden rounded-full bg-linea" aria-hidden="true">
          <span
            className="block h-full origin-left rounded-full bg-riempimento transition-transform duration-[var(--durata-lunga)] ease-(--ease-uscita)"
            style={{ transform: `scaleX(${props.ids.length ? n / props.ids.length : 0})` }}
          />
        </span>
        <span className="flex size-9 items-center justify-center rounded-full bg-sfondo">
          {aperta ? <XIcon weight="bold" className="size-4" aria-hidden="true" /> : <CaretUpIcon weight="bold" className="size-4" aria-hidden="true" />}
          <span className="sr-only">{aperta ? "Chiudi i comandi" : "Apri i comandi"}</span>
        </span>
      </button>
    </div>
  );
}
