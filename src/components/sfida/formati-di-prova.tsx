"use client";

// Solo per l'anteprima del piano 05: provare tutti e tre i formati senza aspettare la rotazione.
// Cambia ?f= nell'indirizzo, tenendo la variante scelta. Si toglie con le varianti.

import { FORMATI, NOMI_FORMATO, type Formato } from "@/lib/sfida";

export function FormatiDiProva({ presenti }: { presenti: Formato[] }) {
  function vai(f: Formato) {
    const u = new URL(window.location.href);
    u.searchParams.set("f", f);
    window.history.replaceState(null, "", u);
    window.dispatchEvent(new PopStateEvent("popstate"));
  }
  return (
    <nav aria-label="Formati di prova" className="mb-5 rounded-xl border border-dashed border-linea p-3 text-sm">
      <p className="text-tenue">Anteprima: prova gli altri formati</p>
      <ul className="mt-1 flex flex-wrap gap-x-3">
        {FORMATI.filter((f) => presenti.includes(f)).map((f) => (
          <li key={f}>
            <button type="button" onClick={() => vai(f)} className="inline-flex min-h-11 items-center font-semibold text-link underline underline-offset-4">
              {NOMI_FORMATO[f]}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
