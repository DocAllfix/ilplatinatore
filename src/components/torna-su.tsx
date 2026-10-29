"use client";

// Il classico pulsante con la freccia che riporta all'inizio, su tutti gli articoli (richiesta del
// proprietario, 16/10/2026: al posto del comando «Inizio» della barra). Compare quando il segnaposto
// in cima all'articolo esce dallo schermo (IntersectionObserver). In basso a destra; la pillola della
// checklist sta a sinistra, cosi' non si toccano.

import { ArrowUpIcon } from "@phosphor-icons/react/ssr";
import { useEffect, useState } from "react";

export function TornaSu() {
  const [visibile, setVisibile] = useState(false);

  useEffect(() => {
    const segno = document.getElementById("inizio-articolo");
    if (!segno) return;
    // compare dopo circa uno schermo di lettura
    const oss = new IntersectionObserver(([e]) => setVisibile(!e.isIntersecting && e.boundingClientRect.top < 0), {
      rootMargin: "100% 0px 0px 0px",
    });
    oss.observe(segno);
    return () => oss.disconnect();
  }, []);

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
      className={`fixed right-3 bottom-[calc(max(0.75rem,env(safe-area-inset-bottom))+var(--annunci-destra,0px))] z-40 flex size-12 items-center justify-center rounded-full border border-linea bg-superficie-alta shadow-[0_8px_24px_oklch(0%_0_0/0.45)] transition-[opacity,transform,bottom] duration-[var(--durata-media)] ease-(--ease-uscita) active:scale-[0.97] [@media(hover:hover)]:hover:text-link ${
        visibile ? "opacity-100" : "pointer-events-none translate-y-4 opacity-0"
      }`}
    >
      <ArrowUpIcon weight="bold" className="size-5" aria-hidden="true" />
    </button>
  );
}
