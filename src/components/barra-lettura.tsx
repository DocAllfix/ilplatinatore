"use client";

// Barra di lettura su tutti gli articoli (richiesta dell'utente, 17/10/2026): a che punto sei della
// pagina, «un po' piu' ludica». Variante scelta: A «Linea», col trofeo in punta che si accende a fine
// lettura. Si aggiorna scrivendo direttamente sugli elementi (niente stato React a ogni scorrimento).

import { TrophyIcon } from "@phosphor-icons/react/ssr";
import { useEffect, useRef, useState } from "react";

/** Da 0 a 1: dall'inizio dell'articolo a quando la sua fine arriva in fondo allo schermo. */
function avanzamento(inizio: HTMLElement, fine: HTMLElement) {
  const y0 = inizio.getBoundingClientRect().top + window.scrollY;
  const y1 = fine.getBoundingClientRect().bottom + window.scrollY - window.innerHeight;
  if (y1 <= y0) return 1;
  return Math.min(1, Math.max(0, (window.scrollY - y0) / (y1 - y0)));
}

function useScorrimento(aggiorna: (p: number, inizio: HTMLElement, fine: HTMLElement) => void) {
  const f = useRef(aggiorna);
  useEffect(() => {
    f.current = aggiorna;
  });
  useEffect(() => {
    const inizio = document.getElementById("inizio-articolo");
    const fine = inizio?.closest("article");
    if (!inizio || !fine) return;
    let attesa = 0;
    const calcola = () => {
      attesa = 0;
      f.current(avanzamento(inizio, fine), inizio, fine);
    };
    const pianifica = () => {
      if (!attesa) attesa = requestAnimationFrame(calcola);
    };
    calcola();
    window.addEventListener("scroll", pianifica, { passive: true });
    window.addEventListener("resize", pianifica);
    return () => {
      cancelAnimationFrame(attesa);
      window.removeEventListener("scroll", pianifica);
      window.removeEventListener("resize", pianifica);
    };
  }, []);
}

/** Una linea Acido in cima, con il trofeo che la cavalca; a fine lettura il trofeo si accende. */
export function BarraLettura() {
  const barra = useRef<HTMLSpanElement>(null);
  const punta = useRef<HTMLSpanElement>(null);
  const [finito, setFinito] = useState(false);
  useScorrimento((p) => {
    if (barra.current) barra.current.style.transform = `scaleX(${p})`;
    // larghezza vera della barra (100vw comprende la barra di scorrimento da computer)
    const largo = punta.current?.parentElement?.clientWidth ?? 0;
    if (punta.current) punta.current.style.transform = `translateX(${p * Math.max(0, largo - 24)}px)`;
    setFinito((x) => (x !== p > 0.995 ? p > 0.995 : x));
  });
  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-40 h-1 bg-linea/40" aria-hidden="true">
      <span ref={barra} className="block h-full origin-left bg-riempimento" style={{ transform: "scaleX(0)" }} />
      <span ref={punta} className="absolute left-0 top-1 block">
        <span
          className={`flex size-6 items-center justify-center rounded-full border transition-[background-color,color,transform] duration-[var(--durata-media)] ease-(--ease-uscita) ${
            finito ? "scale-110 border-azione bg-azione text-su-azione" : "border-linea bg-superficie-alta text-tenue"
          }`}
        >
          <TrophyIcon weight={finito ? "fill" : "bold"} className="size-3.5" />
        </span>
      </span>
    </div>
  );
}
