"use client";

// Selettore delle varianti sull'anteprima (metodo della landing di Axialoop): tutte le varianti
// stanno nell'HTML con data-variant, questo componente sceglie quale mostrare leggendo ?v= e
// aggiorna l'indirizzo, cosi' il link si puo' mandare a chi decide. Si toglie dopo la scelta.

import { useEffect, useState } from "react";

type Variante = { id: string; nome: string };

export function SelettoreVarianti({ varianti, sezione }: { varianti: Variante[]; sezione: string }) {
  const [attiva, setAttiva] = useState(varianti[0].id);
  const [aperto, setAperto] = useState(false);

  useEffect(() => {
    const v = new URLSearchParams(window.location.search).get("v");
    if (v && varianti.some((x) => x.id === v)) applica(v, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function applica(id: string, aggiornaUrl = true) {
    setAttiva(id);
    document.getElementById("lab")?.setAttribute("data-v", id);
    if (aggiornaUrl) {
      const u = new URL(window.location.href);
      u.searchParams.set("v", id);
      window.history.replaceState(null, "", u);
    }
  }

  return (
    <div className="fixed bottom-3 left-1/2 z-50 -translate-x-1/2">
      <div className="flex items-center gap-1 rounded-full border border-linea bg-superficie-alta p-1 shadow-[0_8px_24px_rgb(0_0_0/0.45)]">
        <button
          type="button"
          onClick={() => setAperto((x) => !x)}
          aria-expanded={aperto}
          className="min-h-11 rounded-full px-3 text-xs font-semibold uppercase tracking-[0.04em] text-tenue"
        >
          {sezione}
        </button>
        {varianti.map((x) => (
          <button
            key={x.id}
            type="button"
            onClick={() => applica(x.id)}
            aria-pressed={attiva === x.id}
            className={`min-h-11 min-w-11 rounded-full px-3 text-sm font-semibold transition-[background-color,color,transform] duration-150 active:scale-[0.97] ${
              attiva === x.id ? "bg-azione text-su-azione" : "text-testo"
            }`}
          >
            {x.id.toUpperCase()}
            {aperto && <span className="ml-1.5 font-medium">{x.nome}</span>}
          </button>
        ))}
      </div>
    </div>
  );
}
