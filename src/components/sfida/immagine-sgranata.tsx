"use client";

// L'immagine di «Riconosci il gioco», a quadretti grandi che rimpiccioliscono a ogni errore.
// Un <canvas>: si disegna l'immagine piccolissima e la si ingrandisce senza smussare. A fine partita
// l'immagine vera, nitida. Il testo alternativo non rivela la soluzione.

import { useEffect, useRef, useState } from "react";
import type { Immagine } from "@/lib/cms/tipi";

export function ImmagineSgranata({ immagine, lato, classe = "" }: { immagine: Immagine; lato: number; classe?: string }) {
  const tela = useRef<HTMLCanvasElement>(null);
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [errore, setErrore] = useState(false);

  useEffect(() => {
    const i = new Image();
    i.decoding = "async";
    i.onload = () => setImg(i);
    i.onerror = () => setErrore(true);
    i.src = immagine.src;
  }, [immagine.src]);

  useEffect(() => {
    const c = tela.current;
    if (!c || !img || !lato) return;
    const L = 480;
    const A = Math.round((L * img.naturalHeight) / img.naturalWidth) || 270;
    c.width = L;
    c.height = A;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const w = Math.max(1, Math.round(L / lato));
    const h = Math.max(1, Math.round(A / lato));
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(img, 0, 0, w, h);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(c, 0, 0, w, h, 0, 0, L, A);
  }, [img, lato]);

  if (errore)
    return (
      <div className={`flex aspect-video items-center justify-center bg-superficie-alta p-4 text-center text-sm text-tenue ${classe}`}>
        L&apos;immagine non si carica. Puoi provare lo stesso: la soluzione resta sotto.
      </div>
    );
  if (!lato)
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={immagine.src} srcSet={immagine.srcset} sizes="(min-width: 768px) 736px, 100vw" alt={immagine.alt || ""} className={`aspect-video w-full object-cover ${classe}`} />;
  return (
    <canvas
      ref={tela}
      role="img"
      aria-label="Immagine da riconoscere, sgranata"
      className={`aspect-video w-full bg-superficie-alta object-cover [image-rendering:pixelated] ${classe}`}
    />
  );
}
