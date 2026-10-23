"use client";

// Formati di HB che esistono solo in certe condizioni (decisioni del proprietario, ok di HB, 23/10/2026).
// Lo spazio si crea nel browser, prima che lo script di HB parta (che parte dopo, da PubblicitaScript):
// senza spazio HB non ha dove disegnare quel formato. Sul server non si sa niente di schermo e visita,
// quindi la prima risposta non contiene lo spazio.

import { useSyncExternalStore, type ReactNode } from "react";

const nessunAscolto = () => () => {};
const mai = () => false;

const COMPUTER = "(min-width: 1024px)";
function ascoltaSchermo(avvisa: () => void) {
  const m = window.matchMedia(COMPUTER);
  m.addEventListener("change", avvisa);
  return () => m.removeEventListener("change", avvisa);
}

/** Riquadro fisso a lato (Magic Left): da computer sta nel margine; da telefono copriva il testo. */
export function SoloDaComputer({ children }: { children: ReactNode }) {
  const si = useSyncExternalStore(ascoltaSchermo, () => window.matchMedia(COMPUTER).matches, mai);
  return si ? children : null;
}

const PAGINE = "platinatore_pagine_visita"; // articoli aperti in questa scheda del browser
const ULTIMO = "platinatore_interstitial_ultimo"; // quando e' stato preparato l'ultimo interstitial
const PAUSA_MS = 5 * 60 * 1000; // al massimo uno ogni 5 minuti

// deciso una volta per pagina: ogni clic ricarica la pagina intera, quindi questo modulo riparte
let interstitialDeciso: boolean | null = null;
function interstitialQui(): boolean {
  if (interstitialDeciso !== null) return interstitialDeciso;
  interstitialDeciso = false;
  try {
    const n = Number(sessionStorage.getItem(PAGINE) ?? "0");
    sessionStorage.setItem(PAGINE, String(n + 1));
    const ultimo = Number(localStorage.getItem(ULTIMO) ?? "0");
    if (n >= 1 && Date.now() - ultimo > PAUSA_MS) {
      localStorage.setItem(ULTIMO, String(Date.now()));
      interstitialDeciso = true;
    }
  } catch {
    // archiviazione non disponibile (navigazione privata bloccata): niente interstitial
  }
  return interstitialDeciso;
}

/**
 * Interstitial «tra una pagina e l'altra»: mai sul primo articolo della visita (chi arriva da Google
 * lo trovava sopra l'articolo appena aperto), poi al massimo uno ogni 5 minuti.
 */
export function TraUnaPaginaELAltra({ children }: { children: ReactNode }) {
  const si = useSyncExternalStore(nessunAscolto, interstitialQui, mai);
  return si ? children : null;
}
