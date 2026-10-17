"use client";

// Barra di lettura su tutti gli articoli (richiesta dell'utente, 17/10/2026): a che punto sei della
// pagina, «un po' piu' ludica». Tre varianti in prova: A «Linea» col trofeo in punta, B «Livelli»
// a tacche per sezione, C «Anello» intorno al pulsante per tornare su.
// Si aggiorna scrivendo direttamente sugli elementi (niente stato React a ogni scorrimento).

import { ArrowUpIcon, TrophyIcon } from "@phosphor-icons/react/ssr";
import { useEffect, useRef, useState } from "react";

export type VarianteLettura = "a" | "b" | "c";

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

/** A: una linea Acido in cima, con il trofeo che la cavalca; a fine lettura il trofeo si accende. */
function Linea() {
  const barra = useRef<HTMLSpanElement>(null);
  const punta = useRef<HTMLSpanElement>(null);
  const [finito, setFinito] = useState(false);
  useScorrimento((p) => {
    if (barra.current) barra.current.style.transform = `scaleX(${p})`;
    if (punta.current) punta.current.style.transform = `translateX(calc(${p * 100}vw - ${p * 1.5}rem))`;
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

/** B: una tacca per ogni sezione (h2) dell'articolo, come i livelli di una barra dell'esperienza. */
function Livelli() {
  const [sezioni, setSezioni] = useState<number[]>([]);
  const riempimenti = useRef<Array<HTMLSpanElement | null>>([]);
  const etichetta = useRef<HTMLSpanElement>(null);
  const [mostra, setMostra] = useState(false);
  const timer = useRef<number>(0);

  useEffect(() => {
    const art = document.getElementById("inizio-articolo")?.closest("article");
    if (!art) return;
    // inizi di sezione in proporzione all'articolo: almeno una tacca anche senza titoli
    const misura = () => {
      const r = art.getBoundingClientRect();
      const alto = r.height - window.innerHeight;
      const h2 = [...art.querySelectorAll<HTMLElement>(".contenuto h2")];
      const inizi = [0, ...h2.map((h) => Math.min(1, Math.max(0, (h.getBoundingClientRect().top - r.top - window.innerHeight * 0.3) / Math.max(1, alto))))];
      setSezioni([...new Set(inizi.map((x) => Math.round(x * 1000) / 1000))].sort((a, b) => a - b));
    };
    misura();
    window.addEventListener("resize", misura);
    return () => window.removeEventListener("resize", misura);
  }, []);

  // le tacche arrivano dopo la prima misura: si ridisegna subito, senza aspettare lo scorrimento
  useEffect(() => {
    window.dispatchEvent(new Event("scroll"));
  }, [sezioni]);

  useScorrimento((p) => {
    let corrente = 0;
    sezioni.forEach((s, i) => {
      const fine = sezioni[i + 1] ?? 1;
      const q = Math.min(1, Math.max(0, (p - s) / Math.max(0.0001, fine - s)));
      if (p >= s) corrente = i;
      const el = riempimenti.current[i];
      if (el) el.style.transform = `scaleX(${q})`;
    });
    if (etichetta.current) etichetta.current.textContent = p > 0.995 ? "Letto tutto" : `Sezione ${corrente + 1} di ${sezioni.length}`;
    setMostra(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setMostra(false), 1200);
  });

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-40" aria-hidden="true">
      <div className="flex h-1.5 gap-0.5">
        {sezioni.map((s, i) => (
          <span key={s} className="h-full overflow-hidden rounded-b-sm bg-linea/60" style={{ flexGrow: (sezioni[i + 1] ?? 1) - s }}>
            <span
              ref={(el) => {
                riempimenti.current[i] = el;
              }}
              className="block h-full origin-left bg-riempimento"
              style={{ transform: "scaleX(0)" }}
            />
          </span>
        ))}
      </div>
      <span
        ref={etichetta}
        className={`cifre absolute right-2 top-2.5 rounded-full border border-linea bg-superficie-alta px-2.5 py-0.5 text-xs font-semibold transition-[opacity,transform] duration-[var(--durata-media)] ease-(--ease-uscita) ${
          mostra ? "opacity-100" : "-translate-y-1 opacity-0"
        }`}
      />
    </div>
  );
}

/** C: l'anello di avanzamento intorno al pulsante «Torna all'inizio»; a fine lettura diventa un trofeo. */
function Anello() {
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

export function BarraLettura({ variante }: { variante: VarianteLettura }) {
  if (variante === "a") return <Linea />;
  if (variante === "b") return <Livelli />;
  return <Anello />;
}
