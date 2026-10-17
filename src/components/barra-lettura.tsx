"use client";

// Avanzamento della lettura su tutti gli articoli (richiesta dell'utente, 17/10/2026), variante scelta
// C «Anello»: l'anello si riempie intorno al pulsante per tornare all'inizio e a fine lettura diventa
// un trofeo. Prende il posto del vecchio pulsante «Torna all'inizio».
// Si aggiorna scrivendo direttamente sull'elemento (niente stato React a ogni scorrimento).

import { ArrowUpIcon, TrophyIcon } from "@phosphor-icons/react/ssr";
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

/** L'anello di avanzamento intorno al pulsante «Torna all'inizio»; a fine lettura diventa un trofeo. */
export function BarraLettura() {
  const cerchio = useRef<SVGCircleElement>(null);
  const [visibile, setVisibile] = useState(false);
  const [finito, setFinito] = useState(false);
  const R = 22;
  const C = 2 * Math.PI * R;
  useScorrimento((p, inizio) => {
    if (cerchio.current) cerchio.current.style.strokeDashoffset = String(C * (1 - p));
    const v = inizio.getBoundingClientRect().top < -window.innerHeight;
    setVisibile((x) => (x !== v ? v : x));
    setFinito((x) => (x !== p > 0.995 ? p > 0.995 : x));
  });
  function torna() {
    const ridotto = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: ridotto ? "auto" : "smooth" });
  }
  return (
    <button
      type="button"
      onClick={torna}
      aria-label="Torna all'inizio"
      aria-hidden={!visibile}
      tabIndex={visibile ? 0 : -1}
      className={`fixed right-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-40 flex size-13 items-center justify-center rounded-full bg-superficie-alta shadow-[0_8px_24px_oklch(0%_0_0/0.45)] transition-[opacity,transform] duration-[var(--durata-media)] ease-(--ease-uscita) active:scale-[0.97] ${
        visibile ? "opacity-100" : "pointer-events-none translate-y-4 opacity-0"
      }`}
    >
      <svg viewBox="0 0 52 52" className="absolute inset-0 size-full -rotate-90" aria-hidden="true">
        <circle cx="26" cy="26" r={R} fill="none" strokeWidth="3" className="stroke-linea" />
        <circle
          ref={cerchio}
          cx="26"
          cy="26"
          r={R}
          fill="none"
          strokeWidth="3"
          strokeLinecap="round"
          className="stroke-riempimento"
          style={{ strokeDasharray: C, strokeDashoffset: C }}
        />
      </svg>
      {finito ? (
        <TrophyIcon weight="fill" className="size-5 animate-[scatto_250ms_var(--ease-uscita)] text-riempimento" aria-hidden="true" />
      ) : (
        <ArrowUpIcon weight="bold" className="size-5" aria-hidden="true" />
      )}
    </button>
  );
}
