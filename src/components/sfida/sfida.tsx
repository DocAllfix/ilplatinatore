"use client";

// La sfida del giorno (PDF 08, piano 05). Tre formati a rotazione e tre varianti in prova:
// A «Scheda» (risposta a scelta), B «Ricerca» (risposta scritta con suggerimenti),
// C «Rivelazione» (immagine e indizi a tutta larghezza, tentativi in una fila di caselle).
// La soluzione si vede sempre a fine partita, senza obbligo di aprire un articolo.

import { ArrowDownIcon, ArrowRightIcon, ArrowUpIcon, CheckIcon, ShareNetworkIcon, XIcon } from "@phosphor-icons/react/ssr";
import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import type { DatiSfida, Sfida, SfidaClassico, SfidaGioco, SfidaTrofeo } from "@/lib/sfida-dati";
import {
  confrontaClassico,
  FORMATI,
  NOMI_FORMATO,
  nomeNascosto,
  normale,
  opzioniDelGiorno,
  quadretti,
  rigaDaCondividere,
  TENTATIVI,
  type Esito,
  type Formato,
} from "@/lib/sfida";
import { ImmagineSgranata } from "./immagine-sgranata";
import { usePartita } from "./partita";
import { Ricerca, Scelte } from "./risposta";

export type VarianteSfida = "a" | "b" | "c";
type Comune = { numero: number; giorno: number; variante: VarianteSfida };

/** Solo per l'anteprima: ?f=gioco|trofeo|classico mostra un formato diverso da quello di oggi. */
function useFormatoScelto(): Formato | null {
  return useSyncExternalStore(
    (f) => {
      window.addEventListener("popstate", f);
      return () => window.removeEventListener("popstate", f);
    },
    () => {
      const f = new URLSearchParams(window.location.search).get("f");
      return (FORMATI as readonly string[]).includes(f ?? "") ? (f as Formato) : null;
    },
    () => null,
  );
}

function Caselle({ tentativi, giusta }: { tentativi: string[]; giusta: (t: string) => boolean }) {
  return (
    <ol className="flex gap-1.5" aria-label={`Tentativi: ${tentativi.length} di ${TENTATIVI}`}>
      {Array.from({ length: TENTATIVI }, (_, i) => {
        const t = tentativi[i];
        const ok = t !== undefined && giusta(t);
        return (
          <li
            key={i}
            className={`flex h-10 flex-1 items-center justify-center rounded-lg border-2 ${
              t === undefined ? "border-linea" : ok ? "border-azione bg-azione text-su-azione" : "border-(--errore)/70 text-(--errore)"
            }`}
          >
            {t === undefined ? <span className="sr-only">vuoto</span> : ok ? <CheckIcon weight="bold" className="size-5" aria-label="giusto" /> : <XIcon weight="bold" className="size-5" aria-label="sbagliato" />}
          </li>
        );
      })}
    </ol>
  );
}

function Contatore({ usati }: { usati: number }) {
  return (
    <p className="cifre text-sm text-tenue" aria-live="polite">
      Tentativi: <span className="font-semibold text-testo">{usati}</span> di {TENTATIVI}
    </p>
  );
}

function Sbagliati({ tentativi, giusta }: { tentativi: string[]; giusta: (t: string) => boolean }) {
  const no = tentativi.filter((t) => !giusta(t));
  if (!no.length) return null;
  return (
    <ul className="flex flex-wrap gap-1.5" aria-label="Risposte sbagliate">
      {no.map((t) => (
        <li key={t} className="inline-flex items-center gap-1 rounded-full border border-linea px-3 py-1 text-sm text-tenue line-through">
          <XIcon weight="bold" className="size-3.5 text-(--errore)" aria-hidden="true" />
          {t}
        </li>
      ))}
    </ul>
  );
}

/** Fine partita: soluzione sempre in chiaro, rimando pertinente, condivisione senza spoiler. */
function Fine({
  vinta,
  soluzione,
  rimando,
  condividi,
  dettaglio,
}: {
  vinta: boolean;
  soluzione: string;
  rimando?: { testo: string; href: string };
  condividi: string;
  dettaglio?: React.ReactNode;
}) {
  const [copiato, setCopiato] = useState(false);
  async function invia() {
    const testo = `${condividi}\n${window.location.origin}/sfida/`;
    try {
      if (navigator.share) await navigator.share({ text: testo });
      else {
        await navigator.clipboard.writeText(testo);
        setCopiato(true);
      }
    } catch {
      /* condivisione annullata */
    }
  }
  return (
    <section aria-live="polite" className="animate-[apri_250ms_var(--ease-uscita)] rounded-xl border-2 border-viola/70 bg-superficie p-4">
      <p className={`text-sm font-semibold uppercase tracking-[0.06em] ${vinta ? "text-riempimento" : "text-tenue"}`}>{vinta ? "Indovinato" : "Sarà per domani"}</p>
      <p className="mt-1 text-[1.5rem] font-bold leading-tight text-balance">
        <span className="text-tenue">Era </span>
        {soluzione}
      </p>
      {dettaglio}
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        {rimando && (
          <Link href={rimando.href} className="inline-flex min-h-12 items-center justify-center gap-1.5 rounded-xl bg-azione px-4 font-semibold text-su-azione active:scale-[0.98]">
            {rimando.testo}
            <ArrowRightIcon weight="bold" className="size-4" aria-hidden="true" />
          </Link>
        )}
        <button type="button" onClick={invia} className="inline-flex min-h-12 items-center justify-center gap-1.5 rounded-xl border-2 border-linea px-4 font-semibold active:scale-[0.98] [@media(hover:hover)]:hover:border-link">
          <ShareNetworkIcon weight="bold" className="size-4" aria-hidden="true" />
          {copiato ? "Copiato" : "Condividi il risultato"}
        </button>
      </div>
      <p className="mt-3 text-sm text-tenue">Una sfida nuova ogni giorno a mezzanotte.</p>
    </section>
  );
}

// --- Riconosci il gioco -----------------------------------------------------------------------

function Gioco({ s, numero, giorno, variante }: Comune & { s: SfidaGioco }) {
  const giusta = (t: string) => normale(t) === normale(s.soluzione);
  const p = usePartita(`platinatore:sfida:${giorno}:gioco`, giusta, TENTATIVI);
  const lato = quadretti(p.errori, p.finita);
  const opzioni = opzioniDelGiorno(s.soluzione, s.risposte, 6, giorno);
  const fine = p.finita && (
    <Fine
      vinta={p.vinta}
      soluzione={s.soluzione}
      rimando={s.rimando}
      condividi={rigaDaCondividere(numero, "gioco", p.tentativi.map(giusta), p.vinta)}
    />
  );
  const risposta = !p.finita && (variante === "a"
    ? <Scelte opzioni={opzioni} provati={p.tentativi} giusta={giusta} prova={p.prova} />
    : <Ricerca elenco={s.risposte} provati={p.tentativi} prova={p.prova} etichetta="Che gioco è?" />);

  if (variante === "c")
    return (
      <div className="flex flex-col gap-4">
        <div className="-mx-4 overflow-hidden">
          <ImmagineSgranata immagine={s.immagine} lato={lato} />
        </div>
        <Caselle tentativi={p.tentativi} giusta={giusta} />
        {fine || risposta}
      </div>
    );
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-linea bg-superficie p-3 sm:p-4">
      <ImmagineSgranata immagine={s.immagine} lato={lato} classe="rounded-lg" />
      <Contatore usati={p.tentativi.length} />
      {variante === "b" && <Sbagliati tentativi={p.tentativi} giusta={giusta} />}
      {fine || risposta}
    </div>
  );
}

// --- Indovina il trofeo -----------------------------------------------------------------------

function Trofeo({ s, numero, giorno, variante }: Comune & { s: SfidaTrofeo }) {
  const giusta = (t: string) => normale(t) === normale(s.soluzione);
  const p = usePartita(`platinatore:sfida:${giorno}:trofeo`, giusta, TENTATIVI);
  const indizi = [
    { etichetta: "Come si ottiene", testo: s.indizi.come },
    { etichetta: "Gruppo della guida", testo: s.indizi.gruppo },
    { etichetta: "Lettere", testo: nomeNascosto(s.soluzione) },
  ];
  const visibili = p.finita ? indizi.length : Math.min(indizi.length, p.errori + 1);
  const opzioni = opzioniDelGiorno(s.soluzione, s.risposte, 6, giorno + 1);
  const elenco = (
    <ol className={`flex flex-col gap-2 ${variante === "c" ? "" : ""}`}>
      {indizi.map((x, i) => (
        <li
          key={x.etichetta}
          className={`rounded-xl border p-3 ${i < visibili ? "animate-[apri_250ms_var(--ease-uscita)] border-linea bg-superficie-alta" : "border-dashed border-linea"}`}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.06em] text-tenue">
            Indizio {i + 1} · {x.etichetta}
          </p>
          {i < visibili ? (
            <p className={`mt-1 ${x.etichetta === "Lettere" ? "cifre font-bold tracking-[0.12em]" : "font-medium"}`}>{x.testo}</p>
          ) : (
            <p className="mt-1 text-sm text-tenue">Si scopre dopo un errore.</p>
          )}
        </li>
      ))}
    </ol>
  );
  const fine = p.finita && (
    <Fine vinta={p.vinta} soluzione={s.soluzione} rimando={s.rimando} condividi={rigaDaCondividere(numero, "trofeo", p.tentativi.map(giusta), p.vinta)} />
  );
  const risposta = !p.finita && (variante === "a"
    ? <Scelte opzioni={opzioni} provati={p.tentativi} giusta={giusta} prova={p.prova} />
    : <Ricerca elenco={s.risposte} provati={p.tentativi} prova={p.prova} etichetta={`Quale trofeo di ${s.gioco}?`} />);

  return (
    <div className={`flex flex-col gap-4 ${variante === "c" ? "" : "rounded-xl border border-linea bg-superficie p-3 sm:p-4"}`}>
      <p className="font-semibold">
        Un trofeo di <span className="text-viola">{s.gioco}</span>. Quale?
      </p>
      {elenco}
      {variante === "c" ? <Caselle tentativi={p.tentativi} giusta={giusta} /> : <Contatore usati={p.tentativi.length} />}
      {variante === "b" && <Sbagliati tentativi={p.tentativi} giusta={giusta} />}
      {fine || risposta}
    </div>
  );
}

// --- Riconosci il classico --------------------------------------------------------------------

const STILE: Record<Esito, string> = {
  giusto: "border-azione bg-azione text-su-azione",
  vicino: "border-avviso text-avviso",
  sbagliato: "border-linea text-tenue",
};
const PAROLA: Record<Esito, string> = { giusto: "giusto", vicino: "vicino", sbagliato: "no" };

function Indizio({ esito, etichetta, valore, verso }: { esito: Esito; etichetta: string; valore: string; verso?: "prima" | "dopo" }) {
  return (
    <div className={`min-w-0 rounded-lg border-2 px-2 py-1.5 ${STILE[esito]}`}>
      <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.04em] opacity-80">
        {etichetta} · {PAROLA[esito]}
      </p>
      <p className="flex items-center gap-1 text-sm font-semibold leading-tight">
        <span className="truncate">{valore}</span>
        {verso === "prima" && <ArrowDownIcon weight="bold" className="size-3.5 shrink-0" aria-label="è uscito prima" />}
        {verso === "dopo" && <ArrowUpIcon weight="bold" className="size-3.5 shrink-0" aria-label="è uscito dopo" />}
      </p>
    </div>
  );
}

function Classico({ s, numero, giorno, variante }: Comune & { s: SfidaClassico }) {
  const giusta = (t: string) => normale(t) === normale(s.soluzione.nome);
  const p = usePartita(`platinatore:sfida:${giorno}:classico`, giusta, TENTATIVI);
  const perNome = new Map(s.elenco.map((c) => [c.nome, c]));
  const nomi = s.elenco.map((c) => c.nome);
  const opzioni = opzioniDelGiorno(s.soluzione.nome, nomi, 6, giorno + 2);
  const righe = p.tentativi.map((t) => perNome.get(t)).filter((c): c is NonNullable<typeof c> => Boolean(c));

  const tabella = (
    <ol className="flex flex-col gap-3" aria-label="I tuoi tentativi">
      {righe.map((c) => {
        const k = confrontaClassico(s.soluzione, c);
        return (
          <li key={c.nome} className="animate-[apri_250ms_var(--ease-uscita)]">
            <p className="mb-1 flex items-center gap-1.5 font-semibold">
              {giusta(c.nome) ? <CheckIcon weight="bold" className="size-4 text-riempimento" aria-hidden="true" /> : <XIcon weight="bold" className="size-4 text-(--errore)" aria-hidden="true" />}
              {c.nome}
            </p>
            <div className="grid grid-cols-2 gap-1.5 min-[480px]:grid-cols-5">
              <Indizio esito={k.anno.esito} etichetta="Anno" valore={String(c.anno)} verso={k.anno.verso} />
              <Indizio esito={k.piattaforme} etichetta="Console" valore={c.piattaforme.join(", ")} />
              <Indizio esito={k.sviluppatore} etichetta="Studio" valore={c.sviluppatore} />
              <Indizio esito={k.genere} etichetta="Genere" valore={c.genere} />
              <Indizio esito={k.serie} etichetta="Serie" valore={c.serie || "nessuna"} />
            </div>
          </li>
        );
      })}
    </ol>
  );
  const sol = s.soluzione;
  const fine = p.finita && (
    <Fine
      vinta={p.vinta}
      soluzione={sol.nome}
      rimando={{ testo: "Le ultime guide del Platinatore", href: "/category/guide/" }}
      condividi={rigaDaCondividere(numero, "classico", p.tentativi.map(giusta), p.vinta)}
      dettaglio={
        <p className="mt-1 text-sm text-tenue">
          {sol.anno} · {sol.piattaforme.join(", ")} · {sol.sviluppatore} · {sol.genere}
        </p>
      }
    />
  );
  const risposta = !p.finita && (variante === "a"
    ? <Scelte opzioni={opzioni} provati={p.tentativi} giusta={giusta} prova={p.prova} />
    : <Ricerca elenco={nomi} provati={p.tentativi} prova={p.prova} etichetta="Prova un classico" />);

  return (
    <div className={`flex flex-col gap-4 ${variante === "c" ? "" : "rounded-xl border border-linea bg-superficie p-3 sm:p-4"}`}>
      <p className="text-[0.9375rem]">
        Un classico dell&apos;era PlayStation e dintorni. A ogni tentativo scopri se <strong>anno, console, studio, genere e serie</strong> sono giusti, vicini o
        sbagliati. La freccia dice se il gioco da indovinare è uscito prima o dopo.
      </p>
      {righe.length > 0 && tabella}
      {variante === "c" ? <Caselle tentativi={p.tentativi} giusta={giusta} /> : <Contatore usati={p.tentativi.length} />}
      {fine || risposta}
    </div>
  );
}

// --- La pagina --------------------------------------------------------------------------------

function Corpo({ s, comune }: { s: Sfida; comune: Comune }) {
  if (s.formato === "gioco") return <Gioco s={s} {...comune} />;
  if (s.formato === "trofeo") return <Trofeo s={s} {...comune} />;
  return <Classico s={s} {...comune} />;
}

export function LaSfida({ dati, variante }: { dati: DatiSfida; variante: VarianteSfida }) {
  const scelto = useFormatoScelto();
  const formato = scelto && dati.sfide[scelto] ? scelto : dati.oggi;
  const s = formato ? dati.sfide[formato] : undefined;
  if (!formato || !s)
    return (
      <p className="rounded-xl border border-dashed border-linea p-4 text-tenue">
        Oggi niente sfida: torna domani. Intanto, <Link href="/category/guide/" className="text-link underline underline-offset-4">le ultime guide</Link>.
      </p>
    );
  return (
    <div className="flex flex-col gap-4">
      <header>
        <p className="cifre text-sm font-semibold text-tenue">
          Sfida n. {dati.numero}
          {formato !== dati.oggi && " · formato di prova"}
        </p>
        <h2 className={`font-bold leading-tight ${variante === "c" ? "text-[clamp(1.75rem,1.4rem+2vw,2.5rem)]" : "text-[1.5rem]"}`}>{NOMI_FORMATO[formato]}</h2>
      </header>
      <Corpo s={s} comune={{ numero: dati.numero, giorno: dati.giorno, variante }} />
    </div>
  );
}
