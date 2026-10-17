"use client";

// La sfida da ogni pagina (piano 07, richiesta del proprietario: «un piccolo trigger luminoso che
// cliccando apre la sfida a schermo, parte attiva della conduzione del traffico»). Un controller che
// pulsa in basso a destra, sopra il «torna su»; al tocco la sfida di oggi si apre a schermo intero,
// caricata in quel momento (la pagina non si appesantisce). Sparisce quando la sfida di oggi e'
// finita e sulla pagina /sfida/. Pulsazione spenta con movimento ridotto (regola globale).

import { GameControllerIcon, XIcon } from "@phosphor-icons/react/ssr";
import { usePathname } from "next/navigation";
import { useRef, useState, useSyncExternalStore } from "react";
import type { DatiSfida } from "@/lib/sfida-dati";
import { FORMATI, giornoRoma } from "@/lib/sfida";
import { misura } from "@/lib/misure";
import { LaSfida } from "./sfida";

/** La sfida di oggi e' gia' finita in questo browser (in qualunque formato)? */
function finitaOggi(): boolean {
  try {
    const g = giornoRoma(new Date());
    return FORMATI.some((f) => {
      const v = JSON.parse(window.localStorage.getItem(`platinatore:sfida:${g}:${f}`) ?? "null");
      return Boolean(v?.finita);
    });
  } catch {
    return false;
  }
}

const ascoltatori = new Set<() => void>();
const avvisa = () => ascoltatori.forEach((f) => f());

function useFinitaOggi() {
  return useSyncExternalStore(
    (f) => {
      ascoltatori.add(f);
      window.addEventListener("storage", f);
      return () => {
        ascoltatori.delete(f);
        window.removeEventListener("storage", f);
      };
    },
    finitaOggi,
    () => true, // lato server niente controller: compare dopo, solo se serve
  );
}

export function RichiamoSfida() {
  const percorso = usePathname();
  const finita = useFinitaOggi();
  const finestra = useRef<HTMLDialogElement>(null);
  const [dati, setDati] = useState<DatiSfida | null>(null);
  const [errore, setErrore] = useState(false);

  async function apri() {
    misura("sfida_apertura", { da: percorso });
    finestra.current?.showModal();
    if (dati) return;
    try {
      const r = await fetch("/api/sfida-oggi/");
      if (!r.ok) throw new Error(String(r.status));
      setDati((await r.json()) as DatiSfida);
      setErrore(false);
    } catch {
      setErrore(true);
    }
  }

  const nascosto = finita || percorso.startsWith("/sfida");

  return (
    <>
      {!nascosto && (
        <button
          type="button"
          onClick={apri}
          aria-label="Gioca la sfida del giorno"
          className="fixed right-3 bottom-[calc(max(0.75rem,env(safe-area-inset-bottom))+3.75rem)] z-40 flex size-12 animate-[pulsa-sfida_2.4s_ease-in-out_infinite] items-center justify-center rounded-full border-2 border-viola bg-superficie-alta text-viola-testo active:scale-[0.94]"
        >
          <GameControllerIcon weight="fill" className="size-6" aria-hidden="true" />
        </button>
      )}

      <dialog
        ref={finestra}
        aria-label="La sfida del giorno"
        onClose={avvisa}
        className="m-0 h-dvh max-h-none w-full max-w-none bg-sfondo p-0 text-testo backdrop:bg-notte/80 open:animate-[apri_200ms_var(--ease-uscita)] sm:m-auto sm:h-[min(90dvh,52rem)] sm:max-w-2xl sm:rounded-2xl sm:border sm:border-linea"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-linea bg-sfondo/95 px-4 py-1 backdrop-blur">
          <p className="text-sm font-semibold text-tenue">La sfida del giorno</p>
          <form method="dialog">
            <button type="submit" aria-label="Chiudi la sfida" className="flex size-11 items-center justify-center rounded-full [@media(hover:hover)]:hover:bg-superficie-alta">
              <XIcon weight="bold" className="size-5" aria-hidden="true" />
            </button>
          </form>
        </div>
        <div className="px-4 py-4">
          {dati ? (
            <LaSfida dati={dati} />
          ) : errore ? (
            <p className="text-tenue">La sfida non si è caricata. Riprova tra poco, oppure apri la pagina della sfida.</p>
          ) : (
            <div className="flex flex-col gap-3" aria-label="Caricamento della sfida">
              <span className="block h-6 w-40 animate-pulse rounded bg-superficie-alta" />
              <span className="block aspect-video w-full animate-pulse rounded-xl bg-superficie-alta" />
              <span className="block h-12 w-full animate-pulse rounded-xl bg-superficie-alta" />
            </div>
          )}
        </div>
      </dialog>
    </>
  );
}
