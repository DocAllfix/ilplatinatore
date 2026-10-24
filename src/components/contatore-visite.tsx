"use client";

// Il contatore delle visite (Umami sul nostro server, infra/umami/, 24/10/2026). Senza cookie e senza
// salvare l'IP: conta tutti i visitatori, anche dove non c'e' il banner del consenso (home e sezioni).
// Solo sul dominio vero, mai sull'anteprima; misura anche la velocita' vista dai visitatori (data-performance).

import { useEffect } from "react";
import { DOMINI_VERI } from "@/lib/annunci";

const SCRIPT = "https://visite.ilplatinatore.it/pl.js";
const SITO_UMAMI = "666b9589-8d79-425c-86b2-23d671076067";

export function ContatoreVisite() {
  useEffect(() => {
    if (!DOMINI_VERI.includes(window.location.hostname)) return;
    if (document.querySelector(`script[src="${SCRIPT}"]`)) return;
    const s = document.createElement("script");
    s.src = SCRIPT;
    s.defer = true;
    s.dataset.websiteId = SITO_UMAMI;
    s.dataset.domains = "www.ilplatinatore.it";
    s.dataset.performance = "true";
    document.head.appendChild(s);
  }, []);
  return null;
}
