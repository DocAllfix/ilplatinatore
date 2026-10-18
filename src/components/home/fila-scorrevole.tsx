"use client";

// La fila orizzontale della home.
// Immagini (Fase 3 e 17/10/2026): «vicino» = le prime schede, quando la fila sta per entrare nello
// schermo (Chrome su rete lenta scaricava in anticipo 4-5 sezioni di immagini); «dopo» = le altre,
// quando il lettore tocca o scorre la fila. Titoli e link sono gia' nell'HTML.
// Indicatore (piano 07, scelta del proprietario): al posto della barra grigia del sistema, una barra
// sfumata Ciano, Viola, Acido che si puo' toccare e trascinare.

import { useEffect, useRef, useState } from "react";

function sveglia(fila: HTMLElement | null, quali: string) {
  fila?.querySelectorAll<HTMLImageElement>(`img[data-carico${quali}]`).forEach((img) => {
    if (img.dataset.srcset) img.srcset = img.dataset.srcset;
    if (img.dataset.src) img.src = img.dataset.src;
    img.removeAttribute("data-carico");
  });
}

export function FilaScorrevole({ children }: { children: React.ReactNode }) {
  const fila = useRef<HTMLUListElement>(null);
  const cursore = useRef<HTMLSpanElement>(null);
  const [scorre, setScorre] = useState(false);

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

    // indicatore: scrive direttamente sul cursore (niente stato React a ogni scorrimento)
    let attesa = 0;
    const aggiorna = () => {
      attesa = 0;
      const { scrollLeft, scrollWidth, clientWidth } = el;
      setScorre(scrollWidth > clientWidth + 4);
      if (cursore.current) {
        cursore.current.style.width = `${(clientWidth / scrollWidth) * 100}%`;
        cursore.current.style.left = `${(scrollLeft / scrollWidth) * 100}%`;
      }
    };
    const pianifica = () => {
      if (!attesa) attesa = requestAnimationFrame(aggiorna);
    };
    aggiorna();
    el.addEventListener("scroll", pianifica, { passive: true });
    window.addEventListener("resize", pianifica);
    return () => {
      oss.disconnect();
      cancelAnimationFrame(attesa);
      el.removeEventListener("scroll", pianifica);
      window.removeEventListener("resize", pianifica);
    };
  }, []);

  const tutte = () => sveglia(fila.current, "");

  /** Toccare o trascinare sulla barra porta la fila in quel punto. */
  function verso(e: React.PointerEvent<HTMLDivElement>) {
    const el = fila.current;
    if (!el) return;
    tutte();
    const r = e.currentTarget.getBoundingClientRect();
    const quota = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
    el.scrollTo({ left: quota * el.scrollWidth - el.clientWidth / 2, behavior: e.type === "pointerdown" ? "smooth" : "auto" });
  }


  return (
    <div>
      <ul
        ref={fila}
        onScroll={tutte}
        onPointerEnter={tutte}
        onTouchStart={tutte}
        onFocus={tutte}
        className="senza-barra -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1"
      >
        {children}
      </ul>
      {/* sempre nella pagina (il cursore va misurato da subito), nascosto se la fila non scorre;
          decorativo per i lettori di schermo: la fila si scorre anche da tastiera di scheda in scheda */}
      {(
        <div aria-hidden="true" className={`mt-2 ${scorre ? "" : "hidden"}`}>
          <div
            className="relative h-5 cursor-pointer touch-none"
            onPointerDown={(e) => {
              e.currentTarget.setPointerCapture(e.pointerId);
              verso(e);
            }}
            onPointerMove={(e) => {
              if (e.buttons) verso(e);
            }}
          >
            <span className="absolute inset-x-0 top-2 h-1 rounded-full bg-linea" />
            <span
              ref={cursore}
              className="absolute top-1.5 h-2 rounded-full bg-[linear-gradient(90deg,var(--ciano),var(--viola),var(--acido))] shadow-[0_0_10px_oklch(80%_0.15_250/0.45)]"
            />
          </div>
        </div>
      )}
    </div>
  );
}
