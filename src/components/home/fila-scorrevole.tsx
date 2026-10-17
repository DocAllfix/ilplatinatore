"use client";

// La fila orizzontale della home.
// Immagini (Fase 3 e 17/10/2026): «vicino» = le prime schede, quando la fila sta per entrare nello
// schermo (Chrome su rete lenta scaricava in anticipo 4-5 sezioni di immagini); «dopo» = le altre,
// quando il lettore tocca o scorre la fila. Titoli e link sono gia' nell'HTML.
// Indicatore (piano 07): al posto della barra grigia del sistema, un indicatore nei colori della
// palette che si puo' toccare e trascinare. Due varianti in prova: A barra sfumata, B tacche.

import { useEffect, useRef, useState } from "react";

const COLORI = ["bg-ciano", "bg-viola", "bg-azione"];

function sveglia(fila: HTMLElement | null, quali: string) {
  fila?.querySelectorAll<HTMLImageElement>(`img[data-carico${quali}]`).forEach((img) => {
    if (img.dataset.srcset) img.srcset = img.dataset.srcset;
    if (img.dataset.src) img.src = img.dataset.src;
    img.removeAttribute("data-carico");
  });
}

export function FilaScorrevole({ children, quante }: { children: React.ReactNode; quante: number }) {
  const fila = useRef<HTMLUListElement>(null);
  const cursore = useRef<HTMLSpanElement>(null);
  const [scorre, setScorre] = useState(false);
  const [visibili, setVisibili] = useState<[number, number]>([0, 0]);

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
      const schede = [...el.querySelectorAll<HTMLElement>("[data-scheda]")];
      const dentro = schede
        .map((s, i) => ({ i, a: s.offsetLeft - el.offsetLeft, b: s.offsetLeft - el.offsetLeft + s.offsetWidth }))
        .filter((x) => x.b > scrollLeft + 8 && x.a < scrollLeft + clientWidth - 8)
        .map((x) => x.i);
      const nuovo: [number, number] = dentro.length ? [dentro[0], dentro[dentro.length - 1]] : [0, 0];
      setVisibili((v) => (v[0] === nuovo[0] && v[1] === nuovo[1] ? v : nuovo));
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

  function vaiAllaScheda(i: number) {
    tutte();
    fila.current?.querySelectorAll<HTMLElement>("[data-scheda]")[i]?.scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" });
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
      {scorre && (
        // decorativo per i lettori di schermo: la fila si scorre anche da tastiera passando di scheda in scheda
        <div aria-hidden="true" className="mt-2">
          <div
            data-variant="a"
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
          <div data-variant="b" className="flex h-5 items-center gap-1">
            {Array.from({ length: quante }, (_, i) => {
              const accesa = i >= visibili[0] && i <= visibili[1];
              return (
                <button
                  key={i}
                  type="button"
                  tabIndex={-1}
                  onClick={() => vaiAllaScheda(i)}
                  className={`h-1.5 flex-1 rounded-full transition-[background-color,transform] duration-200 ease-(--ease-uscita) ${
                    accesa ? `${COLORI[i % 3]} scale-y-[1.6]` : "bg-linea"
                  }`}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
