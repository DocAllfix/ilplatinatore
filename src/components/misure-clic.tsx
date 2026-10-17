"use client";

// Un solo ascoltatore per i collegamenti da misurare: basta un attributo `data-misura` sul link
// (anche nei componenti lato server), con dettagli facoltativi in `data-misura-dettaglio`.

import { useEffect } from "react";
import { misura, type NomeMisura } from "@/lib/misure";

export function MisureClic() {
  useEffect(() => {
    function clic(e: MouseEvent) {
      const el = (e.target as Element | null)?.closest<HTMLElement>("[data-misura]");
      if (!el) return;
      const dettaglio = el.dataset.misuraDettaglio;
      misura(el.dataset.misura as NomeMisura, {
        ...(dettaglio ? { dettaglio } : {}),
        ...(el instanceof HTMLAnchorElement ? { verso: el.pathname } : {}),
      });
    }
    // in cattura: la misura parte anche se il link porta via dalla pagina
    document.addEventListener("click", clic, true);
    return () => document.removeEventListener("click", clic, true);
  }, []);
  return null;
}
