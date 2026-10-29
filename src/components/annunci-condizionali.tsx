"use client";

// Formati di HB che esistono solo da computer. Sul server non si sa niente dello schermo, quindi la prima
// risposta non contiene lo spazio: lo crea il browser, prima che parta lo script di HB.

import { useSyncExternalStore, type ReactNode } from "react";

/** «Computer» come lo intende lo script di HB: schermo largo e puntatore fine (un tablet e' un telefono). */
export const COMPUTER = "(min-width: 1024px) and (hover: hover) and (pointer: fine)";

const nessunAscolto = () => () => {};

export function SoloDaComputer({ children }: { children: ReactNode }) {
  const si = useSyncExternalStore(nessunAscolto, () => window.matchMedia(COMPUTER).matches, () => false);
  return si ? children : null;
}
