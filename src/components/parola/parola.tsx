"use client";

// «La parola» (gioco 4, richiesta del proprietario, 21/10/2026): Wordle sui videogiochi. Tre livelli
// con la loro parola del giorno; 6 tentativi; tastiera in basso con le lettere gia' provate. Colori
// della palette al posto di verde, giallo e grigio (scelta dell'utente): posto giusto Acido, lettera
// presente altrove Ciano, lettera assente Viola scuro con testo Bianco (DESIGN.md: il Bianco solo sul
// Viola). Alla fine, vinta o persa, la soluzione e il rimando all'hub del gioco.

import { ArrowRightIcon, BackspaceIcon, CheckCircleIcon, ShareNetworkIcon } from "@phosphor-icons/react/ssr";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "@/components/collegamento";
import { usePartita } from "@/components/sfida/partita";
import { misura } from "@/lib/misure";
import {
  LIVELLI,
  NOMI_LIVELLO,
  TENTATIVI_PAROLA,
  condivisione,
  confronta,
  lettere,
  schema,
  tastiera,
  type Livello,
  type Parola,
  type Stato,
} from "@/lib/parola";
import type { DatiParola } from "@/lib/parola-dati";

const COLORE: Record<Stato, string> = {
  giusta: "border-azione bg-azione text-su-azione",
  presente: "border-ciano bg-ciano text-notte",
  assente: "border-[#3d2d80] bg-[#3d2d80] text-white",
};
const PAROLA_STATO: Record<Stato, string> = { giusta: "al posto giusto", presente: "presente, in un altro posto", assente: "assente" };
const LEGENDA: Record<Stato, string> = { giusta: "Posto giusto", presente: "C’è, ma altrove", assente: "Non c’è" };
const RIGHE_TASTI = ["QWERTYUIOP", "ASDFGHJKL", "+ZXCVBNM-"];

const chiave = (livello: Livello, giorno: number) => `platinatore:parola:${livello}:${giorno}`;

/** Una riga della griglia: i pezzi del nome separati da uno spazio, le lettere nelle caselle. */
function Riga({ pezzi, testo, esiti, etichetta, scuoti }: { pezzi: number[]; testo: string; esiti?: Stato[]; etichetta: string; scuoti?: boolean }) {
  let i = 0;
  return (
    <div role="group" aria-label={etichetta} className={`flex justify-center gap-2.5 ${scuoti ? "animate-[scuoti_300ms_ease-in-out]" : ""}`}>
      {pezzi.map((n, k) => (
        <div key={k} className="flex min-w-0 gap-1">
          {Array.from({ length: n }, () => {
            const j = i++;
            const c = testo[j];
            const e = esiti?.[j];
            return (
              <span
                key={j}
                className={`cifre flex aspect-square w-[min(2.75rem,calc((min(100vw,36rem)_-_2rem_-_var(--spazi))_/_var(--lettere)))] items-center justify-center rounded-md border-2 text-[clamp(0.9rem,4.5vw,1.375rem)] font-bold uppercase transition-colors duration-200 motion-reduce:transition-none ${
                  e ? COLORE[e] : c ? "border-testo/50 text-testo" : "border-linea text-testo"
                }`}
                aria-hidden="true"
              >
                {c ?? ""}
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function Gioco({
  parola,
  livello,
  giorno,
  numero,
  prossimo,
}: {
  parola: Parola;
  livello: Livello;
  giorno: number;
  numero: number;
  /** il livello successivo ancora da giocare oggi, per proporlo a fine partita */
  prossimo?: { livello: Livello; vai: () => void };
}) {
  const segreto = lettere(parola.nome);
  const pezzi = useMemo(() => schema(parola.nome) ?? [segreto.length], [parola.nome, segreto.length]);
  const p = usePartita(chiave(livello, giorno), (t) => t === segreto, TENTATIVI_PAROLA);
  const [scritto, setScritto] = useState("");
  const [avviso, setAvviso] = useState("");
  const [scuoti, setScuoti] = useState(false);
  const [copiato, setCopiato] = useState(false);
  const tasti = useMemo(() => tastiera(segreto, p.tentativi), [segreto, p.tentativi]);

  const premi = useCallback(
    (t: string) => {
      if (p.finita) return;
      setAvviso("");
      if (t === "-") return setScritto((s) => s.slice(0, -1));
      if (t === "+") {
        if (scritto.length < segreto.length) {
          setAvviso(`Servono ${segreto.length} lettere.`);
          setScuoti(true);
          window.setTimeout(() => setScuoti(false), 320);
          return;
        }
        if (p.tentativi.includes(scritto)) return setAvviso("L’hai già provata.");
        p.prova(scritto);
        setScritto("");
        return;
      }
      if (/^[A-Z]$/.test(t)) setScritto((s) => (s.length < segreto.length ? s + t : s));
    },
    [p, scritto, segreto.length],
  );

  // anche dalla tastiera del computer
  useEffect(() => {
    const giu = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      // chi scrive in un campo (la ricerca della testata) non sta giocando
      const el = e.target as HTMLElement | null;
      if (el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))) return;
      const k = e.key;
      if (k === "Enter") premi("+");
      else if (k === "Backspace") premi("-");
      else if (/^[a-zA-Z]$/.test(k)) premi(k.toUpperCase());
      else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", giu);
    return () => window.removeEventListener("keydown", giu);
  }, [premi]);

  const ultimo = p.tentativi.at(-1);
  const esitiUltimo = ultimo ? confronta(segreto, ultimo) : null;
  // spazio fra le caselle: 0,25rem dentro una parola, 0,625rem fra una parola e l'altra
  const stile = { "--lettere": String(segreto.length), "--spazi": `${(segreto.length - pezzi.length) * 0.25 + (pezzi.length - 1) * 0.625}rem` } as React.CSSProperties;

  async function condividi() {
    const testo = `${condivisione(numero, livello, segreto, p.tentativi, p.vinta)}\n${window.location.origin}/sfida/parola/`;
    try {
      await navigator.clipboard.writeText(testo);
      setCopiato(true);
      misura("sfida_rimando", { chiave: chiave(livello, giorno), verso: "condividi" });
    } catch {
      setAvviso("Copia non riuscita: tieni premuto sul risultato per selezionarlo.");
    }
  }

  return (
    <div className="flex flex-col gap-5" style={stile}>
      <p className="text-balance text-center text-[0.9375rem] text-tenue">
        Indovina <strong className="text-testo">{NOMI_LIVELLO[livello].cosa}</strong> in {TENTATIVI_PAROLA} tentativi: {segreto.length} lettere
        {pezzi.length > 1 ? `, ${pezzi.length} parole` : ""}.
      </p>

      {/* legenda dei colori (richiesta del proprietario): gli stessi colori delle caselle */}
      <ul aria-label="Legenda dei colori" className="flex flex-wrap justify-center gap-x-3 gap-y-1.5 text-[0.8125rem]">
        {(["giusta", "presente", "assente"] as const).map((s) => (
          <li key={s} className="flex items-center gap-1 whitespace-nowrap">
            <span className={`cifre flex size-5 items-center justify-center rounded border-2 text-[0.6875rem] font-bold ${COLORE[s]}`} aria-hidden="true">
              A
            </span>
            {LEGENDA[s]}
          </li>
        ))}
      </ul>

      <div className="flex flex-col gap-1.5">
        {Array.from({ length: TENTATIVI_PAROLA }, (_, r) => {
          const t = p.tentativi[r];
          const esiti = t ? confronta(segreto, t) : undefined;
          const corrente = !p.finita && r === p.tentativi.length;
          const testo = t ?? (corrente ? scritto : "");
          const etichetta = t
            ? `Tentativo ${r + 1}: ${[...t].map((c, j) => `${c} ${PAROLA_STATO[esiti![j]]}`).join(", ")}`
            : corrente
              ? `Tentativo ${r + 1}, in corso: ${scritto || "vuoto"}`
              : `Tentativo ${r + 1}, vuoto`;
          return <Riga key={r} pezzi={pezzi} testo={testo} esiti={esiti} etichetta={etichetta} scuoti={corrente && scuoti} />;
        })}
      </div>

      {/* esito dell'ultimo tentativo, per chi usa un lettore di schermo */}
      <p className="sr-only" aria-live="polite">
        {esitiUltimo && !p.finita ? `${ultimo}: ${esitiUltimo.filter((e) => e === "giusta").length} lettere al posto giusto, ${esitiUltimo.filter((e) => e === "presente").length} presenti altrove.` : ""}
      </p>
      <p className="min-h-6 text-center text-sm font-semibold text-avviso" aria-live="assertive">
        {avviso}
      </p>

      {p.finita ? (
        <section aria-label="Risultato" className="flex flex-col gap-3 rounded-xl border border-linea bg-superficie p-5 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.06em] text-tenue">{p.vinta ? `Indovinata in ${p.tentativi.length} su ${TENTATIVI_PAROLA}` : "Tentativi finiti"}</p>
          <p className="text-[1.75rem] font-bold leading-tight text-balance">{parola.nome}</p>
          <p className="text-tenue">
            {livello === "facile" ? "Il gioco di oggi." : livello === "medio" ? `La software house di ${parola.gioco.nome}.` : `Un boss di ${parola.gioco.nome}.`}
          </p>
          <Link
            prefetch={false}
            href={`/tag/${parola.gioco.slug}/`}
            data-misura="sfida_rimando"
            data-misura-dettaglio={`parola-${livello}`}
            className="mx-auto inline-flex min-h-11 -skew-x-6 items-center gap-1.5 bg-azione px-4 font-bold text-su-azione transition-transform duration-150 active:scale-[0.97]"
          >
            <span>Tutte le guide di {parola.gioco.nome}</span>
            <ArrowRightIcon weight="bold" className="size-4" aria-hidden="true" />
          </Link>
          <button
            type="button"
            onClick={condividi}
            className="mx-auto inline-flex min-h-11 items-center gap-2 rounded-full border border-linea px-4 font-semibold transition-colors [@media(hover:hover)]:hover:border-link"
          >
            <ShareNetworkIcon weight="bold" className="size-4" aria-hidden="true" />
            {copiato ? "Risultato copiato" : "Copia il risultato"}
          </button>
          {prossimo && (
            <button
              type="button"
              onClick={prossimo.vai}
              className="mx-auto inline-flex min-h-11 items-center gap-1.5 rounded-full bg-viola px-4 font-semibold text-su-viola transition-transform duration-150 active:scale-[0.97]"
            >
              Prova il livello {NOMI_LIVELLO[prossimo.livello].nome}
              <ArrowRightIcon weight="bold" className="size-4" aria-hidden="true" />
            </button>
          )}
          <p className="text-sm text-tenue">Nuove parole a mezzanotte.</p>
        </section>
      ) : (
        <div className="flex flex-col gap-1.5" role="group" aria-label="Tastiera">
          {RIGHE_TASTI.map((riga) => (
            <div key={riga} className="flex justify-center gap-1">
              {[...riga].map((t) => {
                const speciale = t === "+" || t === "-";
                const s = tasti[t];
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => premi(t)}
                    aria-label={t === "+" ? "Invio" : t === "-" ? "Cancella" : s ? `${t}, ${PAROLA_STATO[s]}` : t}
                    className={`flex h-12 min-w-0 items-center justify-center rounded-md text-sm font-bold transition-[transform,background-color] duration-100 active:scale-[0.94] ${
                      speciale ? "flex-[1.6] bg-superficie-alta px-1 text-[0.75rem] uppercase tracking-[0.04em]" : "flex-1"
                    } ${!speciale ? (s ? COLORE[s] : "bg-superficie-alta text-testo") : ""}`}
                  >
                    {t === "+" ? "Invio" : t === "-" ? <BackspaceIcon weight="bold" className="size-5" aria-hidden="true" /> : t}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function LaParola({ dati }: { dati: DatiParola }) {
  const disponibili = LIVELLI.filter((l) => dati.parole[l]);
  const [livello, setLivello] = useState<Livello>(disponibili[0] ?? "facile");
  const [fatti, setFatti] = useState<Set<Livello>>(new Set());

  // quali livelli di oggi sono gia' finiti (spunta sulla scheda): letto dal browser
  useEffect(() => {
    const leggi = () =>
      setFatti(
        new Set(
          LIVELLI.filter((l) => {
            try {
              return JSON.parse(window.localStorage.getItem(chiave(l, dati.giorno)) ?? "null")?.finita === true;
            } catch {
              return false;
            }
          }),
        ),
      );
    leggi();
    const t = window.setInterval(leggi, 1500);
    return () => window.clearInterval(t);
  }, [dati.giorno]);

  if (!disponibili.length)
    return (
      <p className="rounded-xl border border-linea bg-superficie p-5 text-center text-tenue">
        Oggi non ci sono parole: torna domani, o intanto prova{" "}
        <Link prefetch={false} href="/sfida/" className="font-semibold text-link underline underline-offset-4">
          la sfida del giorno
        </Link>
        .
      </p>
    );

  const parola = dati.parole[livello]!;
  const dopo = disponibili.slice(disponibili.indexOf(livello) + 1).concat(disponibili.slice(0, disponibili.indexOf(livello)));
  const prossimoLivello = dopo.find((l) => !fatti.has(l));
  return (
    <div className="mx-auto flex max-w-xl flex-col gap-5">
      <header className="flex flex-col items-center gap-1 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.06em] text-tenue">Gioco del giorno · #{dati.numero}</p>
        <h1 className="text-[2rem] font-bold leading-tight">La parola</h1>
      </header>
      <div role="tablist" aria-label="Livello" className="grid grid-cols-3 gap-1 rounded-full border border-linea bg-superficie p-1">
        {disponibili.map((l) => (
          <button
            key={l}
            type="button"
            role="tab"
            aria-selected={l === livello}
            onClick={() => {
              setLivello(l);
              misura("sfida_apertura", { gioco: "parola", livello: l });
            }}
            className={`flex min-h-11 items-center justify-center gap-1.5 rounded-full text-sm font-semibold transition-colors ${
              l === livello ? "bg-viola text-su-viola" : "text-tenue [@media(hover:hover)]:hover:text-testo"
            }`}
          >
            {NOMI_LIVELLO[l].nome}
            {fatti.has(l) && <CheckCircleIcon weight="fill" className="size-4" aria-label="già giocato oggi" />}
          </button>
        ))}
      </div>
      <Gioco
        key={livello}
        parola={parola}
        livello={livello}
        giorno={dati.giorno}
        numero={dati.numero}
        prossimo={prossimoLivello ? { livello: prossimoLivello, vai: () => setLivello(prossimoLivello) } : undefined}
      />
    </div>
  );
}
