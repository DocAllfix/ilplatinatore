"use client";

// La partita di oggi nel browser, come le spunte: si chiude la pagina e si ritrova com'era. Una
// partita per giorno e formato. Senza memoria disponibile si gioca lo stesso, per la visita.

import { useSyncExternalStore } from "react";
import { misura } from "@/lib/misure";

export type Partita = { tentativi: string[]; finita: boolean; vinta: boolean };
const VUOTA: Partita = { tentativi: [], finita: false, vinta: false };

const archivi = new Map<string, { leggi: () => Partita; iscrivi: (f: () => void) => () => void; scrivi: (p: Partita) => void }>();

function archivio(chiave: string) {
  if (archivi.has(chiave)) return archivi.get(chiave)!;
  let stato: Partita | null = null;
  const ascoltatori = new Set<() => void>();
  const a = {
    leggi() {
      if (stato) return stato;
      try {
        const v = JSON.parse(window.localStorage.getItem(chiave) ?? "null");
        stato = v && Array.isArray(v.tentativi) ? { tentativi: v.tentativi.filter((x: unknown) => typeof x === "string"), finita: !!v.finita, vinta: !!v.vinta } : VUOTA;
      } catch {
        stato = VUOTA;
      }
      return stato;
    },
    iscrivi(f: () => void) {
      ascoltatori.add(f);
      return () => ascoltatori.delete(f);
    },
    scrivi(p: Partita) {
      stato = p;
      try {
        window.localStorage.setItem(chiave, JSON.stringify(p));
      } catch {
        /* navigazione privata: vale per la visita */
      }
      ascoltatori.forEach((f) => f());
    },
  };
  archivi.set(chiave, a);
  return a;
}

/** Stato della partita e la mossa: `prova` registra un tentativo e chiude la partita se serve. */
export function usePartita(chiave: string, giusta: (t: string) => boolean, massimo: number) {
  const a = archivio(chiave);
  const p = useSyncExternalStore(a.iscrivi, a.leggi, () => VUOTA);
  function prova(t: string) {
    const ora = a.leggi();
    if (ora.finita || ora.tentativi.includes(t)) return;
    const tentativi = [...ora.tentativi, t];
    const vinta = giusta(t);
    const finita = vinta || tentativi.length >= massimo;
    a.scrivi({ tentativi, vinta, finita });
    if (tentativi.length === 1) misura("sfida_inizio", { chiave });
    if (finita) misura("sfida_fine", { chiave, vinta, tentativi: tentativi.length });
  }
  return { ...p, prova, errori: p.tentativi.filter((t) => !giusta(t)).length };
}
