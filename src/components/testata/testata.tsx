"use client";

// Testata (piano 07, richieste del proprietario): logo e nome al centro, a sinistra il menu con i
// tasti Select/Start del pad, a destra la ricerca col mirino e il tasto chiaro/scuro. Il menu non
// scende in verticale: apre una barra orizzontale discreta sotto il titolo. La ricerca apre un
// campo sotto la testata. Esc chiude l'uno e l'altra.
// I link del menu restano sempre nell'HTML (barra chiusa = inert): per i motori di ricerca non
// cambia niente rispetto a oggi.

import { CrosshairIcon, MagnifyingGlassIcon, MoonIcon, SunIcon } from "@phosphor-icons/react/ssr";
import Link from "@/components/collegamento";
import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";

const VOCI = [
  { href: "/category/guide/", testo: "Guide" },
  { href: "/category/news/", testo: "News" },
  { href: "/category/approfondimenti/", testo: "Approfondimenti" },
  { href: "/sfida/", testo: "Sfida del giorno" },
];

const ICONA = "flex size-11 shrink-0 items-center justify-center rounded-full transition-[background-color,color,transform] duration-150 active:scale-[0.94] [@media(hover:hover)]:hover:bg-superficie-alta";

/** I tasti Select e Start del pad, due pastiglie inclinate: si accendono quando il menu e' aperto. */
function SelectStart({ aperto }: { aperto: boolean }) {
  const pastiglia = `block h-2 w-4 -rotate-[24deg] rounded-full transition-[background-color,transform] duration-200 ease-(--ease-uscita) ${
    aperto ? "bg-azione" : "bg-testo"
  }`;
  return (
    <span className="flex items-center gap-1.5" aria-hidden="true">
      <span className={`${pastiglia} ${aperto ? "translate-y-0.5" : ""}`} />
      <span className={`${pastiglia} ${aperto ? "translate-y-0.5" : ""}`} />
    </span>
  );
}

// --- tema: il valore vero sta su <html data-theme>, scritto prima del primo disegno ------------

function temaAttuale(): "chiaro" | "scuro" {
  const t = document.documentElement.dataset.theme;
  if (t === "light") return "chiaro";
  if (t === "dark") return "scuro";
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "chiaro" : "scuro";
}

function useTema() {
  return useSyncExternalStore(
    (f) => {
      const mq = window.matchMedia("(prefers-color-scheme: light)");
      const oss = new MutationObserver(f);
      oss.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
      mq.addEventListener("change", f);
      return () => {
        oss.disconnect();
        mq.removeEventListener("change", f);
      };
    },
    temaAttuale,
    () => "scuro" as const,
  );
}

function cambiaTema(nuovo: "chiaro" | "scuro") {
  const valore = nuovo === "chiaro" ? "light" : "dark";
  document.documentElement.dataset.theme = valore;
  document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]').forEach((m) => (m.content = nuovo === "chiaro" ? "#f4f6fa" : "#0b0d12"));
  try {
    window.localStorage.setItem("platinatore:tema", valore);
  } catch {
    /* navigazione privata: vale per la visita */
  }
}

export function Testata() {
  const [menu, setMenu] = useState(false);
  const [cerca, setCerca] = useState(false);
  const tema = useTema();
  const idMenu = useId();
  const idCerca = useId();
  const campo = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!menu && !cerca) return;
    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenu(false);
        setCerca(false);
      }
    };
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [menu, cerca]);

  useEffect(() => {
    if (cerca) campo.current?.focus();
  }, [cerca]);

  return (
    <header className="border-b border-linea">
      <div className="striscia" aria-hidden="true" />
      <div className="mx-auto grid max-w-3xl grid-cols-[5.5rem_1fr_5.5rem] items-center px-2 py-1.5">
        <div className="flex">
          <button
            type="button"
            className={`${ICONA} ${menu ? "bg-superficie-alta" : ""}`}
            aria-expanded={menu}
            aria-controls={idMenu}
            aria-label={menu ? "Chiudi il menu" : "Apri il menu"}
            onClick={() => {
              setMenu((x) => !x);
              setCerca(false);
            }}
          >
            <SelectStart aperto={menu} />
          </button>
        </div>

        <Link prefetch={false} href="/" className="flex min-h-12 items-center justify-center gap-2 justify-self-center" aria-label="Il Platinatore, home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-128.webp" alt="" width={36} height={36} className="size-9 rounded-lg" />
          <span className="whitespace-nowrap text-[1.3125rem] font-bold leading-none tracking-[-0.01em] min-[400px]:text-[1.5rem]">Il Platinatore</span>
        </Link>

        <div className="flex justify-end">
          <button
            type="button"
            className={`${ICONA} ${cerca ? "bg-superficie-alta text-link" : ""}`}
            aria-expanded={cerca}
            aria-controls={idCerca}
            aria-label={cerca ? "Chiudi la ricerca" : "Cerca nel sito"}
            onClick={() => {
              setCerca((x) => !x);
              setMenu(false);
            }}
          >
            <CrosshairIcon weight="bold" className={`size-6 transition-transform duration-300 ease-(--ease-uscita) ${cerca ? "rotate-45 scale-90" : ""}`} aria-hidden="true" />
          </button>
          <button
            type="button"
            className={ICONA}
            aria-label={tema === "chiaro" ? "Passa al tema scuro" : "Passa al tema chiaro"}
            onClick={() => cambiaTema(tema === "chiaro" ? "scuro" : "chiaro")}
          >
            {tema === "chiaro" ? <MoonIcon weight="bold" className="size-5" aria-hidden="true" /> : <SunIcon weight="bold" className="size-5" aria-hidden="true" />}
          </button>
        </div>
      </div>

      {/* la barra orizzontale del menu: sempre nell'HTML, chiusa = altezza zero e inert */}
      <div className={`grid transition-[grid-template-rows] duration-[var(--durata-media)] ease-(--ease-uscita) ${menu ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
        <nav id={idMenu} aria-label="Sezioni" className="overflow-hidden" inert={!menu}>
          <ul className="senza-barra mx-auto flex max-w-3xl justify-start gap-1 overflow-x-auto px-3 pb-2 min-[480px]:justify-center">
            {VOCI.map((v) => (
              <li key={v.href} className="shrink-0">
                <Link
                  prefetch={false}
                  href={v.href}
                  onClick={() => setMenu(false)}
                  className="flex min-h-11 items-center whitespace-nowrap rounded-full px-3 text-sm font-medium text-tenue transition-colors [@media(hover:hover)]:hover:bg-superficie-alta [@media(hover:hover)]:hover:text-testo"
                >
                  {v.testo}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {/* il campo di ricerca: /?s= come oggi, il proxy lo porta alla pagina della ricerca */}
      {cerca && (
        <form id={idCerca} action="/" method="get" role="search" className="mx-auto max-w-3xl animate-[apri_200ms_var(--ease-uscita)] px-4 pb-3">
          <label htmlFor={`${idCerca}-campo`} className="sr-only">
            Cerca una guida o un gioco
          </label>
          <div className="relative">
            <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-tenue" aria-hidden="true" />
            <input
              ref={campo}
              id={`${idCerca}-campo`}
              name="s"
              type="search"
              enterKeyHint="search"
              placeholder="Cerca una guida o un gioco"
              className="min-h-12 w-full rounded-xl border-2 border-linea bg-superficie pl-10 pr-24 text-base outline-none focus-visible:border-link"
            />
            <button type="submit" className="absolute right-1.5 top-1/2 inline-flex min-h-9 -translate-y-1/2 items-center rounded-lg bg-azione px-3 text-sm font-bold text-su-azione">
              Cerca
            </button>
          </div>
        </form>
      )}
    </header>
  );
}
