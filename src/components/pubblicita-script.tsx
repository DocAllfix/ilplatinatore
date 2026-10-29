"use client";

// Il regista della pubblicita' di HB Agency e GA4 (riconfigurazione del 29/10/2026). Unico punto che decide
// i formati fissi della pagina (Floor, Magic Left, Interstitial), li crea una volta sola e poi carica lo
// script di HB, una volta sola. Gli spazi nel testo degli articoli li mette il server (src/lib/annunci.ts):
// HB li cerca all'asta e non regge spazi creati dopo.
// Tutto si accende SOLO sul dominio vero (www.ilplatinatore.it): sull'anteprima su vercel.app niente richieste
// a HB (che non conosce quel dominio) e niente visite finte nelle statistiche di GA4.
// - HB: lo script porta anche il banner del consenso (CMP certificato IAB TCF) e cerca gli spazi per id a
//   ogni caricamento di pagina (il sito ricarica le pagine a ogni clic: scelta dell'utente).
// - GA4 (GT-NS4PBCN4, lo stesso di oggi): parte solo DOPO il consenso dato nel banner di HB (API TCF,
//   finalita' 1, archiviazione sul dispositivo). Riceve anche le misure d'uso (src/lib/misure.ts).

import { useEffect, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { SpazioHB } from "@/components/annunci";
import { COMPUTER } from "@/components/annunci-condizionali";
import {
  CAPPING_INTERSTITIAL_MINUTI,
  DOMINI_VERI,
  FLOOR_AD,
  formatiFissi,
  GA4,
  INTERSTITIAL,
  OUTSTREAM,
  SCRIPT_HB,
  tipoPagina,
  type Annuncio,
} from "@/lib/annunci";
import type { Misura } from "@/lib/misure";
import { svuotaVitali } from "@/lib/vitali";

type DatiTcf = { gdprApplies?: boolean; eventStatus?: string; purpose?: { consents?: Record<string, boolean> } };
type Tcf = (comando: string, versione: number, cb: (d: DatiTcf, ok: boolean) => void) => void;

declare global {
  interface Window {
    __tcfapi?: Tcf;
    gtag?: (...a: unknown[]) => void;
    hbagency_cba?: Record<string, number>;
  }
}

function aggiungiScript(src: string) {
  if (document.querySelector(`script[src="${src}"]`)) return;
  const s = document.createElement("script");
  s.src = src;
  s.async = true;
  document.head.appendChild(s);
}

// Acceso o no si decide con questo segno, MAI guardando se `window.gtag` esiste: il banner del
// consenso di HB crea una sua `gtag` prima della scelta, e dal passaggio del 23/10/2026 alle ~15
// GA4 non e' mai partito (nessuna visita registrata) perche' qui si vedeva quella e ci si fermava.
let ga4Acceso = false;

function accendiGa4() {
  if (ga4Acceso) return;
  ga4Acceso = true;
  window.dataLayer ??= [];
  // se c'e' gia' (quella di HB) fa la stessa cosa: mette i comandi nel dataLayer
  window.gtag ??= function gtag() {
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

const spazio = (a: Annuncio) => `hbagency_space_${a.id}`;
// il Magic Left (300 px) sta nel margine sinistro senza toccare la colonna di 768 px; il modello laterale di HB
// per computer lo nasconde sotto i 1500 px (showTemplateLeft, letto il 29/10/2026): sotto, resta il Floor
const MARGINE_MAGIC = "(min-width: 1500px)";

/**
 * Capping nativo dell'interstitial, presente PRIMA che HB decida qualunque cosa. HB legge `hbagency_cba`
 * quando prepara l'asta (toglie l'unita' se c'e' il suo cookie) e quando l'annuncio si apre (scrive il cookie
 * con quei minuti). Il suo script pero' dichiara da se' `var hbagency_cba=[]` e cancellerebbe una chiave messa
 * prima (letto il 29/10/2026). Con una proprieta' a setter la sua assegnazione passa da qui: la lista resta la
 * sua, con la nostra chiave dentro dal primo istante. Non dipende dall'ordine degli eventi ne' da ritardi.
 * Si usa SOLO nelle pagine con lo spazio dell'interstitial: quando un Magic si apre (e da telefono si rinnova
 * ogni 31 s) HB scrive il cookie per TUTTE le chiavi della lista, e altrove allungherebbe il capping all'infinito.
 */
function preparaCapping() {
  if (Object.getOwnPropertyDescriptor(window, "hbagency_cba")?.set) return;
  const conCapping = (v: Record<string, number>) => {
    v[spazio(INTERSTITIAL)] = CAPPING_INTERSTITIAL_MINUTI;
    return v;
  };
  let lista = conCapping({});
  Object.defineProperty(window, "hbagency_cba", {
    configurable: true,
    get: () => lista,
    set: (v: Record<string, number>) => {
      lista = conCapping(v && typeof v === "object" ? v : {});
    },
  });
}

// Decisi una volta per pagina (ogni clic ricarica la pagina intera): niente cambi a meta' visita, niente
// spazi creati due volte.
let decisi: { percorso: string; formati: Annuncio[] } | null = null;
function formatiDellaPagina(percorso: string): Annuncio[] {
  if (decisi?.percorso === percorso) return decisi.formati;
  let formati: Annuncio[] = [];
  if (DOMINI_VERI.includes(window.location.hostname) && tipoPagina(percorso)) {
    formati = formatiFissi({
      computer: window.matchMedia(COMPUTER).matches,
      margineMagic: window.matchMedia(MARGINE_MAGIC).matches,
      // la scelta nel banner (accetto o rifiuto) sta nel cookie standard IAB TCF, scritto dal banner di HB
      consenso: document.cookie.includes("euconsent-v2="),
      // il capping e' quello di HB: il suo cookie, scritto quando l'interstitial si apre
      capping: document.cookie.includes(`capping_hba_${spazio(INTERSTITIAL)}=`),
    });
  }
  decisi = { percorso, formati };
  return formati;
}
const nessunAscolto = () => () => {};
const nessuno: Annuncio[] = [];

/**
 * I nostri comandi fissi in basso (torna su, sfida, pillola) salgono sopra il Floor e, a destra, sopra il
 * video che HB fa flottare: due variabili CSS, a 0 quando l'annuncio non c'e' o e' stato chiuso.
 */
function seguiIngombri() {
  const radice = document.documentElement.style;
  const ingombro = (el: Element | null, lato: (b: DOMRect) => boolean) => {
    if (!el || getComputedStyle(el).position !== "fixed" || getComputedStyle(el).display === "none") return 0;
    const b = el.getBoundingClientRect();
    if (b.height < 10 || b.width < 10 || b.top >= window.innerHeight || !lato(b)) return 0;
    return Math.round(window.innerHeight - b.top);
  };
  let prima = "";
  const misura = () => {
    const basso = ingombro(document.getElementById(`HB_Footer_Close_${spazio(FLOOR_AD)}`), (b) => b.bottom >= window.innerHeight - 4);
    const video = ingombro(document.getElementById(spazio(OUTSTREAM)), (b) => b.right >= window.innerWidth - 40);
    const ora = `${basso}/${video}`;
    if (ora === prima) return;
    prima = ora;
    radice.setProperty("--annunci-basso", `${basso}px`);
    radice.setProperty("--annunci-destra", `${Math.max(basso, video)}px`);
  };
  const t = window.setInterval(misura, 500);
  return () => window.clearInterval(t);
}

export function PubblicitaScript() {
  const percorso = usePathname();
  const formati = useSyncExternalStore(nessunAscolto, () => formatiDellaPagina(percorso), () => nessuno);
  const conPubblicita = formati.length > 0;
  const conInterstitial = formati.includes(INTERSTITIAL);

  useEffect(() => {
    if (!conPubblicita) return;
    // gli spazi fissi sono gia' nella pagina (questo effetto parte dopo che sono stati disegnati)
    if (conInterstitial) preparaCapping();
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
    const smetti = seguiIngombri();
    return () => {
      window.clearInterval(attesa);
      smetti();
    };
  }, [conPubblicita, conInterstitial]);

  return formati.map((a) => <SpazioHB key={a.id} id={a.id} nome={a.nome} />);
}

