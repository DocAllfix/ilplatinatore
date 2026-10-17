"use client";

// Memoria delle spunte nel browser (PDF 05: «salvataggio locale, spiegandone limiti e assenza di
// sincronizzazione»). Un archivio per articolo, condiviso fra i gruppi nel testo e la barra con
// useSyncExternalStore. Se il browser non lascia scrivere (navigazione privata, spazio pieno), le
// spunte funzionano lo stesso per la visita e `persistente` lo dice.

import { useSyncExternalStore } from "react";
import { misura } from "@/lib/misure";

type Stato = { fatti: ReadonlySet<string>; soloMancanti: boolean; persistente: boolean };

const archivi = new Map<string, ReturnType<typeof crea>>();
const VUOTO: Stato = { fatti: new Set(), soloMancanti: false, persistente: true };

function crea(chiave: string) {
  let stato: Stato = VUOTO;
  let caricato = false;
  const ascoltatori = new Set<() => void>();

  function carica() {
    if (caricato || typeof window === "undefined") return;
    caricato = true;
    try {
      const v = JSON.parse(window.localStorage.getItem(chiave) ?? "[]");
      stato = { ...stato, fatti: new Set(Array.isArray(v) ? v.filter((x) => typeof x === "string") : []) };
    } catch {
      stato = { ...stato, persistente: false };
    }
  }

  function salva(fatti: Set<string>) {
    try {
      if (fatti.size) window.localStorage.setItem(chiave, JSON.stringify([...fatti]));
      else window.localStorage.removeItem(chiave);
      return true;
    } catch {
      return false;
    }
  }

  function emetti(nuovo: Stato) {
    stato = nuovo;
    ascoltatori.forEach((f) => f());
  }

  return {
    leggi: () => (carica(), stato),
    iscrivi(f: () => void) {
      ascoltatori.add(f);
      // un'altra scheda dello stesso sito ha cambiato le spunte: si riallinea
      const daAltraScheda = (e: StorageEvent) => {
        if (e.key === chiave) {
          caricato = false;
          carica();
          f();
        }
      };
      window.addEventListener("storage", daAltraScheda);
      return () => {
        ascoltatori.delete(f);
        window.removeEventListener("storage", daAltraScheda);
      };
    },
    cambia(id: string) {
      carica();
      const fatti = new Set(stato.fatti);
      if (fatti.has(id)) fatti.delete(id);
      else fatti.add(id);
      emetti({ ...stato, fatti, persistente: salva(fatti) });
      misura("spunta", { chiave, fatto: fatti.has(id) });
    },
    soloMancanti(v: boolean) {
      emetti({ ...stato, soloMancanti: v });
      misura("filtro_mancanti", { attivo: v });
    },
    azzera(ids: string[]) {
      carica();
      const fatti = new Set(stato.fatti);
      ids.forEach((i) => fatti.delete(i));
      emetti({ ...stato, fatti, persistente: salva(fatti) });
      misura("azzera", { chiave });
    },
  };
}

export function archivio(articolo: number) {
  const chiave = `platinatore:spunte:${articolo}`;
  if (!archivi.has(chiave)) archivi.set(chiave, crea(chiave));
  return archivi.get(chiave)!;
}

/** Stato delle spunte di un articolo. Lato server (e prima dell'idratazione): nessuna spunta. */
export function useSpunte(articolo: number) {
  const a = archivio(articolo);
  const stato = useSyncExternalStore(a.iscrivi, a.leggi, () => VUOTO);
  return {
    fatti: stato.fatti,
    persistente: stato.persistente,
    /** «Da completare» attivo: le righe fatte si nascondono */
    filtro: stato.soloMancanti,
    cambia: a.cambia,
    impostaFiltro: a.soloMancanti,
    azzera: a.azzera,
  };
}
