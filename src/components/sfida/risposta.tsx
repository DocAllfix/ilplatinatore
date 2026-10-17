"use client";

// Due modi di rispondere, da provare sull'anteprima: a scelta (opzioni grandi da toccare) o a
// ricerca (si scrive e compaiono i suggerimenti dall'elenco dei giochi del sito).

import { MagnifyingGlassIcon } from "@phosphor-icons/react/ssr";
import { useId, useState } from "react";
import { suggerimenti } from "@/lib/sfida";

export function Scelte({ opzioni, provati, giusta, prova }: { opzioni: string[]; provati: string[]; giusta: (t: string) => boolean; prova: (t: string) => void }) {
  return (
    <ul className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-2">
      {opzioni.map((o) => {
        const fatto = provati.includes(o);
        const ok = fatto && giusta(o);
        return (
          <li key={o}>
            <button
              type="button"
              disabled={fatto}
              onClick={() => prova(o)}
              className={`flex min-h-14 w-full items-center rounded-xl border-2 px-4 text-left font-semibold leading-snug transition-[background-color,border-color,opacity,transform] duration-150 active:scale-[0.98] ${
                ok
                  ? "border-azione bg-azione text-su-azione"
                  : fatto
                    ? "border-linea text-tenue line-through opacity-60"
                    : "border-linea bg-superficie [@media(hover:hover)]:hover:border-link"
              }`}
            >
              {o}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

export function Ricerca({ elenco, provati, prova, etichetta }: { elenco: string[]; provati: string[]; prova: (t: string) => void; etichetta: string }) {
  const [testo, setTesto] = useState("");
  const id = useId();
  const proposte = suggerimenti(testo, elenco).filter((x) => !provati.includes(x));
  function scegli(x: string) {
    prova(x);
    setTesto("");
  }
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold">
        {etichetta}
      </label>
      <div className="relative">
        <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-tenue" aria-hidden="true" />
        <input
          id={id}
          type="text"
          autoComplete="off"
          enterKeyHint="go"
          value={testo}
          onChange={(e) => setTesto(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && proposte[0]) {
              e.preventDefault();
              scegli(proposte[0]);
            }
          }}
          placeholder="Scrivi almeno due lettere"
          aria-describedby={`${id}-aiuto`}
          className="min-h-12 w-full rounded-xl border-2 border-linea bg-superficie pl-10 pr-3 text-base outline-none focus-visible:border-link"
        />
      </div>
      <p id={`${id}-aiuto`} className="sr-only">
        Scegli un suggerimento dall&apos;elenco che compare sotto.
      </p>
      {testo.length > 0 && (
        <ul className="mt-2 overflow-hidden rounded-xl border border-linea" aria-label="Suggerimenti">
          {proposte.length ? (
            proposte.map((x) => (
              <li key={x} className="border-b border-linea last:border-b-0">
                <button type="button" onClick={() => scegli(x)} className="flex min-h-12 w-full items-center px-4 text-left font-medium [@media(hover:hover)]:hover:bg-superficie">
                  {x}
                </button>
              </li>
            ))
          ) : (
            <li className="px-4 py-3 text-sm text-tenue">Nessun gioco con questo nome nell&apos;elenco.</li>
          )}
        </ul>
      )}
    </div>
  );
}
