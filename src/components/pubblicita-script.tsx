"use client";

// Lo script di HB Agency e GA4 (Fase 5). Si accendono SOLO sul dominio vero (www.ilplatinatore.it):
// sull'anteprima su vercel.app niente richieste a HB (che non conosce quel dominio) e niente visite
// finte nelle statistiche di GA4.
// - HB: lo script porta anche il banner del consenso (CMP certificato IAB TCF) e cerca gli spazi
//   per id a ogni caricamento di pagina (il sito ricarica le pagine a ogni clic: scelta dell'utente).
// - GA4 (GT-NS4PBCN4, lo stesso di oggi): parte solo DOPO il consenso dato nel banner di HB (API
//   TCF, finalita' 1, archiviazione sul dispositivo). Riceve anche le misure d'uso degli strumenti
//   (src/lib/misure.ts).

import { useEffect } from "react";
import { DOMINI_VERI, GA4, SCRIPT_HB } from "@/lib/annunci";
import type { Misura } from "@/lib/misure";
import { svuotaVitali } from "@/lib/vitali";

type DatiTcf = { gdprApplies?: boolean; eventStatus?: string; purpose?: { consents?: Record<string, boolean> } };
type Tcf = (comando: string, versione: number, cb: (d: DatiTcf, ok: boolean) => void) => void;

declare global {
  interface Window {
    __tcfapi?: Tcf;
    gtag?: (...a: unknown[]) => void;
  }
}

function aggiungiScript(src: string) {
  if (document.querySelector(`script[src="${src}"]`)) return;
  const s = document.createElement("script");
  s.src = src;
  s.async = true;
  document.head.appendChild(s);
}

function accendiGa4() {
  if (window.gtag) return;
  window.dataLayer ??= [];
  window.gtag = function gtag() {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer!.push(arguments);
  };
  window.gtag("js", new Date());
  window.gtag("config", GA4);
  aggiungiScript(`https://www.googletagmanager.com/gtag/js?id=${GA4}`);
  // le misure di velocita' raccolte prima del consenso (src/lib/vitali.ts)
  svuotaVitali();
  // le misure d'uso, da qui in poi, vanno anche a GA4
  window.addEventListener("platinatore:misura", (e) => {
    const m = (e as CustomEvent<Misura>).detail;
    window.gtag?.("event", `platinatore_${m.nome}`, m.dati ?? {});
  });
}

export function PubblicitaScript() {
  useEffect(() => {
    if (!DOMINI_VERI.includes(window.location.hostname)) return;
    aggiungiScript(SCRIPT_HB);
    // il banner del consenso arriva con lo script di HB: si aspetta la sua API, poi la scelta
    let tentativi = 0;
    const attesa = window.setInterval(() => {
      if (!window.__tcfapi) {
        if (++tentativi > 40) window.clearInterval(attesa); // 20 s senza CMP: GA4 resta spento
        return;
      }
      window.clearInterval(attesa);
      window.__tcfapi("addEventListener", 2, (d, ok) => {
        if (!ok) return;
        const deciso = d.eventStatus === "useractioncomplete" || d.eventStatus === "tcloaded";
        if (deciso && (d.gdprApplies === false || d.purpose?.consents?.["1"])) accendiGa4();
      });
    }, 500);
    return () => window.clearInterval(attesa);
  }, []);
  return null;
}
