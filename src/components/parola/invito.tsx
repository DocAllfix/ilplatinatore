"use client";

// «La parola di oggi» in fondo a ogni articolo (richiesta del proprietario, 21/10/2026, variante A
// «Fine lettura»: finito l'articolo, si ha voglia di qualcos'altro). Le caselle vuote della parola
// facile del giorno e «Gioca»: il gioco si apre in una finestra sopra l'articolo, senza cambiare
// pagina. I dati arrivano da /api/parola-oggi/ quando la scheda sta per entrare nello schermo; lo
// spazio e' riservato da subito (niente salti). Il gioco si monta solo a finestra aperta: cosi' non
// cattura i tasti premuti mentre si legge.

import { XIcon } from "@phosphor-icons/react/ssr";
import { useEffect, useRef, useState } from "react";
import { misura } from "@/lib/misure";
import { LIVELLI, schema } from "@/lib/parola";
import type { DatiParola } from "@/lib/parola-dati";
import { LaParola } from "./parola";

const COLORI_ANTEPRIMA = ["bg-azione text-su-azione", "bg-ciano text-notte", "bg-[#3d2d80] text-white"];

function giocateOggi(giorno: number): number {
  try {
    return LIVELLI.filter((l) => JSON.parse(window.localStorage.getItem(`platinatore:parola:${l}:${giorno}`) ?? "null")?.finita === true).length;
  } catch {
    return 0;
  }
}

export function InvitoParola() {
  const scheda = useRef<HTMLElement>(null);
  const finestra = useRef<HTMLDialogElement>(null);
  const [dati, setDati] = useState<DatiParola | null>(null);
  const [aperta, setAperta] = useState(false);
  const [giocate, setGiocate] = useState(0);

  // i dati quando la scheda sta per entrare nello schermo, non prima
  useEffect(() => {
    const el = scheda.current;
    if (!el) return;
    const os = new IntersectionObserver(
      async ([e]) => {
        if (!e.isIntersecting) return;
        os.disconnect();
        try {
          const r = await fetch("/api/parola-oggi/");
          if (!r.ok) return;
          const d = (await r.json()) as DatiParola;
          setDati(d);
          setGiocate(giocateOggi(d.giorno));
        } catch {
          /* la scheda resta con le caselle di riserva e «Gioca» porta alla pagina */
        }
      },
      { rootMargin: "400px" },
    );
    os.observe(el);
    return () => os.disconnect();
  }, []);

  function apri() {
    misura("sfida_apertura", { gioco: "parola", da: "fine-articolo" });
    if (!dati) {
      // caricamento completo voluto (Fase 5: lo script della pubblicita' riparte a ogni pagina)
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.href = "/sfida/parola/";
      return;
    }
    setAperta(true);
    finestra.current?.showModal();
  }

  const facile = dati?.parole.facile;
  const pezzi = (facile && schema(facile.nome)) || [4, 5];
  const lettere = pezzi.reduce((a, b) => a + b, 0);
  const tutte = dati ? LIVELLI.filter((l) => dati.parole[l]).length : 3;

  return (
    <>
      <section ref={scheda} aria-label="La parola di oggi" className="relative mt-10 overflow-hidden rounded-xl border border-linea bg-superficie">
        <span className="absolute inset-y-0 left-0 w-1.5 bg-viola" aria-hidden="true" />
        <div className="flex flex-col items-center gap-3 px-5 py-5 pl-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.06em] text-tenue">Hai finito di leggere? Gioca</p>
          <h2 className="text-[1.375rem] font-bold leading-tight">La parola di oggi</h2>
          {/* le caselle vuote della parola facile: lunghezza e spazi veri, le prime tre coi colori del gioco */}
          <div className="flex min-h-9 flex-wrap justify-center gap-2" aria-hidden="true">
            {pezzi.map((n, k) => (
              <span key={k} className="flex gap-1">
                {Array.from({ length: n }, (_, i) => {
                  const j = pezzi.slice(0, k).reduce((a, b) => a + b, 0) + i;
                  return <span key={i} className={`block size-7 rounded border-2 ${j < 3 ? `border-transparent ${COLORI_ANTEPRIMA[j]}` : "border-linea"}`} />;
                })}
              </span>
            ))}
          </div>
          <p className="text-[0.9375rem] text-tenue">
            {facile ? `Il videogioco di oggi ha ${lettere} lettere${pezzi.length > 1 ? `, ${pezzi.length} parole` : ""}.` : "Il Wordle dei videogiochi."} Poi la software house e il boss.
          </p>
          <button
            type="button"
            onClick={apri}
            className="inline-flex min-h-11 -skew-x-6 items-center gap-1.5 bg-azione px-5 font-bold text-su-azione transition-transform duration-150 active:scale-[0.97]"
          >
            <span>{giocate >= tutte ? "Rivedi le parole di oggi" : giocate > 0 ? `Continua: ${giocate} di ${tutte} giocate` : "Gioca"}</span>
          </button>
        </div>
      </section>

      <dialog
        ref={finestra}
        aria-label="La parola"
        onClose={() => {
          setAperta(false);
          if (dati) setGiocate(giocateOggi(dati.giorno));
        }}
        className="m-0 h-dvh max-h-none w-full max-w-none bg-sfondo p-0 text-testo backdrop:bg-notte/80 open:animate-[apri_200ms_var(--ease-uscita)] sm:m-auto sm:h-[min(92dvh,56rem)] sm:max-w-2xl sm:rounded-2xl sm:border sm:border-linea"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-linea bg-sfondo/95 px-4 py-1 backdrop-blur">
          <p className="text-sm font-semibold text-tenue">La parola</p>
          <form method="dialog">
            <button type="submit" aria-label="Chiudi il gioco" className="flex size-11 items-center justify-center rounded-full [@media(hover:hover)]:hover:bg-superficie-alta">
              <XIcon weight="bold" className="size-5" aria-hidden="true" />
            </button>
          </form>
        </div>
        <div className="px-4 py-4">{aperta && dati && <LaParola dati={dati} />}</div>
      </dialog>
    </>
  );
}
