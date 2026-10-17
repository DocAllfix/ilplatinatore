"use client";

// La fila orizzontale della home. Le immagini delle schede oltre la quarta partono solo quando il
// lettore tocca o scorre la fila: altrimenti il browser le scarica tutte anche se restano fuori
// dallo schermo (Fase 3: 106 immagini e 6,6 MB sulla home, LCP 3,6 s). Titoli e link sono gia'
// nell'HTML: per i motori di ricerca non cambia niente.

import { useRef } from "react";

export function FilaScorrevole({ children }: { children: React.ReactNode }) {
  const fila = useRef<HTMLUListElement>(null);
  const fatto = useRef(false);
  function sveglia() {
    if (fatto.current || !fila.current) return;
    fatto.current = true;
    fila.current.querySelectorAll<HTMLImageElement>("img[data-src]").forEach((img) => {
      if (img.dataset.srcset) img.srcset = img.dataset.srcset;
      img.src = img.dataset.src!;
      img.removeAttribute("data-src");
    });
  }
  return (
    <ul
      ref={fila}
      onScroll={sveglia}
      onPointerEnter={sveglia}
      onTouchStart={sveglia}
      onFocus={sveglia}
      className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:thin]"
    >
      {children}
    </ul>
  );
}
