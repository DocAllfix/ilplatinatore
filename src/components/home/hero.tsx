"use client";

// L'hero della home (piano 07, richiesta del proprietario): gli ultimi 3 articoli pubblicati, uno
// alla volta. La cornice ha un colore per articolo (Ciano, Viola, Acido) e si consuma come un timer
// circolare; quando sparisce, arriva l'articolo successivo.
// Accessibilita': pausa toccando, col mouse sopra o col fuoco dentro, e un tasto pausa/riprendi
// (WCAG 2.2.2); con movimento ridotto niente rotazione automatica, si cambia coi pallini; col dito
// si scorre di lato.

import { PauseIcon, PlayIcon } from "@phosphor-icons/react/ssr";
import Link from "@/components/collegamento";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";

export type VoceHero = {
  id: number;
  titolo: string;
  percorso: string;
  immagine?: { src: string; srcset?: string };
  gioco?: string;
  news: boolean;
};

const DURATA = 7000;
const COLORI = ["var(--ciano)", "var(--viola)", "var(--acido)"];

function useMovimentoRidotto() {
  return useSyncExternalStore(
    (f) => {
      const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
      mq.addEventListener("change", f);
      return () => mq.removeEventListener("change", f);
    },
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  );
}

export function Hero({ voci }: { voci: VoceHero[] }) {
  const [attivo, setAttivo] = useState(0);
  const [fermo, setFermo] = useState(false); // pausa scelta col tasto
  const [sospeso, setSospeso] = useState(false); // mouse sopra, fuoco dentro, dito appoggiato
  const ridotto = useMovimentoRidotto();
  const partenza = useRef<number | null>(null);
  // le immagini degli articoli 2 e 3 partono dopo: sovrapposte alla prima sono «a schermo» e il browser
  // le scaricava insieme, rubando banda all'immagine principale (LCP 3,5 s su rete lenta)
  const [tutte, setTutte] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setTutte(true), 2500);
    return () => window.clearTimeout(t);
  }, []);
  const n = voci.length;
  const gira = !ridotto && !fermo && !sospeso && n > 1;

  const vai = (i: number) => {
    setTutte(true);
    setAttivo(((i % n) + n) % n);
  };

  // il nuovo articolo riparte da zero (la cornice e' un'animazione CSS: riparte cambiando chiave)
  useEffect(() => {
    if (!gira) return;
    const t = window.setTimeout(() => vai(attivo + 1), DURATA);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attivo, gira]);

  if (!n) return null;

  return (
    <section
      aria-roledescription="carosello"
      aria-label="Gli ultimi articoli"
      className="mb-10"
      onPointerEnter={(e) => e.pointerType === "mouse" && setSospeso(true)}
      onPointerLeave={(e) => e.pointerType === "mouse" && setSospeso(false)}
      onFocus={() => setSospeso(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setSospeso(false);
      }}
    >
      <div
        className="relative aspect-[4/3] touch-pan-y sm:aspect-[16/9]"
        onPointerDown={(e) => {
          partenza.current = e.clientX;
          if (e.pointerType !== "mouse") setSospeso(true);
        }}
        onPointerUp={(e) => {
          const da = partenza.current;
          partenza.current = null;
          if (e.pointerType !== "mouse") setSospeso(false);
          if (da !== null && Math.abs(e.clientX - da) > 40) vai(attivo + (e.clientX < da ? 1 : -1));
        }}
      >
        {voci.map((v, i) => {
          const visibile = i === attivo;
          return (
            <div
              key={v.id}
              className={`absolute inset-0 transition-opacity duration-500 ease-(--ease-uscita) ${visibile ? "opacity-100" : "pointer-events-none opacity-0"}`}
              aria-hidden={!visibile}
              inert={!visibile}
              role="group"
              aria-roledescription="articolo"
              aria-label={`${i + 1} di ${n}`}
            >
              <Link
                prefetch={false}
                href={v.percorso}
                data-misura="home_sezione"
                data-misura-dettaglio="Hero"
                draggable={false}
                className="group relative isolate flex size-full flex-col justify-end overflow-hidden rounded-2xl p-5"
              >
                {v.immagine && (i === 0 || tutte) && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={v.immagine.src}
                    srcSet={v.immagine.srcset}
                    sizes="(min-width: 768px) 736px, calc(100vw - 2rem)"
                    alt=""
                    draggable={false}
                    loading={i === 0 ? "eager" : "lazy"}
                    fetchPriority={i === 0 ? "high" : "auto"}
                    className="absolute inset-0 -z-10 size-full bg-superficie-alta object-cover"
                  />
                )}
                <span className="absolute inset-0 -z-10 bg-gradient-to-t from-notte via-notte/70 to-notte/5" aria-hidden="true" />
                <span className="flex items-center gap-2">
                  <span className="rounded bg-notte/70 px-1.5 py-0.5 text-[0.6875rem] font-bold uppercase tracking-[0.05em] text-platino">
                    {v.news ? "News" : "Guida"}
                  </span>
                  {v.gioco && <span className="truncate text-sm font-semibold text-platino/90">{v.gioco}</span>}
                </span>
                <span className="mt-2 line-clamp-3 text-[clamp(1.375rem,1.1rem+1.6vw,2rem)] font-bold leading-tight text-platino text-balance">
                  {v.titolo}
                </span>
              </Link>
            </div>
          );
        })}

        {/* la cornice-timer: un rettangolo arrotondato tracciato attorno all'hero, che si consuma */}
        <svg className="pointer-events-none absolute inset-0 size-full overflow-visible" aria-hidden="true">
          <rect x="0" y="0" width="100%" height="100%" rx="16" fill="none" stroke="var(--linea)" strokeWidth="3" />
          <rect
            key={`${attivo}-${gira}`}
            x="0"
            y="0"
            width="100%"
            height="100%"
            rx="16"
            fill="none"
            stroke={COLORI[attivo % 3]}
            strokeWidth="3"
            pathLength={100}
            strokeDasharray="100"
            strokeLinecap="round"
            style={{
              animation: gira ? `timer-hero ${DURATA}ms linear forwards` : "none",
              filter: `drop-shadow(0 0 6px ${COLORI[attivo % 3]})`,
            }}
          />
        </svg>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-1" role="group" aria-label="Scegli l'articolo">
          {voci.map((v, i) => (
            <button
              key={v.id}
              type="button"
              onClick={() => vai(i)}
              aria-label={`Articolo ${i + 1} di ${n}`}
              aria-current={i === attivo}
              className="flex size-11 items-center justify-center"
            >
              <span
                className="block h-2 rounded-full transition-[width,background-color] duration-300 ease-(--ease-uscita)"
                style={{ width: i === attivo ? 28 : 8, background: i === attivo ? COLORI[i % 3] : "var(--linea)" }}
              />
            </button>
          ))}
        </div>
        {!ridotto && n > 1 && (
          <button
            type="button"
            onClick={() => setFermo((x) => !x)}
            aria-label={fermo ? "Riprendi lo scorrimento" : "Ferma lo scorrimento"}
            className="flex size-11 items-center justify-center rounded-full text-tenue [@media(hover:hover)]:hover:text-testo"
          >
            {fermo ? <PlayIcon weight="fill" className="size-5" aria-hidden="true" /> : <PauseIcon weight="fill" className="size-5" aria-hidden="true" />}
          </button>
        )}
      </div>
    </section>
  );
}
