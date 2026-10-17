"use client";

// La fila orizzontale della home. Le immagini partono quando servono (Fase 3 e 17/10/2026):
// - «vicino»: le prime schede di ogni fila, quando la fila sta per entrare nello schermo. Chrome da
//   solo, su rete lenta, scaricava in anticipo tutto quello che sta entro ~2.500 px: 4-5 sezioni di
//   immagini prima ancora di scorrere;
// - «dopo»: le altre schede, quando il lettore tocca o scorre la fila.
// La prima fila della home non passa di qui: e' subito visibile. Titoli e link sono gia' nell'HTML.

import { useEffect, useRef } from "react";

function sveglia(fila: HTMLElement | null, quali: string) {
  fila?.querySelectorAll<HTMLImageElement>(`img[data-carico${quali}]`).forEach((img) => {
    if (img.dataset.srcset) img.srcset = img.dataset.srcset;
    if (img.dataset.src) img.src = img.dataset.src;
    img.removeAttribute("data-carico");
  });
}

export function FilaScorrevole({ children }: { children: React.ReactNode }) {
  const fila = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const el = fila.current;
    if (!el) return;
    const oss = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        sveglia(el, '="vicino"');
        oss.disconnect();
      },
      { rootMargin: "300px 0px" },
    );
    oss.observe(el);
    return () => oss.disconnect();
  }, []);

  const tutte = () => sveglia(fila.current, "");
  return (
    <ul
      ref={fila}
      onScroll={tutte}
      onPointerEnter={tutte}
      onTouchStart={tutte}
      onFocus={tutte}
      className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:thin]"
    >
      {children}
    </ul>
  );
}
