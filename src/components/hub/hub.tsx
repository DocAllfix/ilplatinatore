// Hub del gioco (PDF 04, piano 04) su /tag/<gioco>/. Variante scelta: A «Percorso» (17/10/2026).
// Tutti i dati arrivano dal CMS (lib/hub-dati.ts).

import { ArrowRightIcon, NewspaperIcon } from "@phosphor-icons/react/ssr";
import Link from "@/components/collegamento";
import { dataLeggibile } from "@/components/archivio";
import { BloccoAcido, Mancabili, Tacche } from "@/components/guida/scheda";
import type { Articolo } from "@/lib/cms/tipi";
import type { DatiHub } from "@/lib/hub-dati";
import { senzaGioco } from "@/lib/hub";
import { GuidePerTipo, type Gruppo } from "./elenco";
import { IconaAiuto } from "./icone";
import { Riprendi } from "./progresso";

// i titoli arrivano gia' senza il nome del gioco: elenco e progresso li mostrano cosi' come sono
import { FiguraVoto } from "@/components/recensione/figura-voto";
import { fascia } from "@/lib/recensione";

const BARRA_VOTO = { alta: "bg-azione", media: "bg-ciano", bassa: "bg-viola" } as const;

const leggeri = (gruppi: DatiHub["gruppi"], gioco: string): Gruppo[] =>
  gruppi.map((g) => ({ aiuto: g.aiuto, guide: g.guide.map((a) => ({ id: a.id, titolo: senzaGioco(a.titolo, gioco), percorso: a.percorso })) }));

function dataUscita(iso: string) {
  return new Intl.DateTimeFormat("it-IT", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${iso}T00:00:00Z`));
}

function Etichetta({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xs font-semibold uppercase tracking-[0.06em] text-tenue">
      {children}
    </h2>
  );
}

/** Copertina (guida al Platino o, se manca, la guida piu' recente), nome, piattaforme, uscita, chi l'ha fatto. */
function Testata({ d }: { d: DatiHub }) {
  const img = d.copertina;
  const g = d.gioco;
  const chi = [g.sviluppatore, g.editore && g.editore !== g.sviluppatore ? g.editore : null].filter(Boolean).join(" · ");
  return (
    <header className="-mx-4 -mt-5">
      <div className="relative isolate flex min-h-[16rem] flex-col justify-end overflow-hidden px-4 pb-5 pt-20">
        {img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={img.src} srcSet={img.srcset} sizes="(min-width: 768px) 768px, 100vw" alt="" fetchPriority="high" className="absolute inset-0 -z-10 size-full object-cover" />
        ) : (
          <div className="absolute inset-0 -z-10 bg-superficie-alta" aria-hidden="true" />
        )}
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-notte via-notte/75 to-notte/10" aria-hidden="true" />
        <p>
          <span className="rounded bg-viola px-2 py-0.5 text-[0.8125rem] font-semibold text-su-viola">Gioco</span>
        </p>
        <h1 className="mt-3 text-[clamp(2rem,1.5rem+3vw,3.25rem)] font-bold leading-[1.05] tracking-[-0.015em] text-platino text-balance">{d.nome}</h1>
        {g.piattaforme.length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Piattaforme">
            {g.piattaforme.map((p) => (
              <li key={p} className="rounded border border-platino/30 px-2 py-0.5 text-[0.8125rem] font-medium text-platino">
                {p}
              </li>
            ))}
          </ul>
        )}
        {d.schedaGioco && (
          <p className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-sm text-platino/90">
            {[d.schedaGioco.genere, d.schedaGioco.voto && `Voto medio ${d.schedaGioco.voto}`, d.schedaGioco.storia && `Storia ${d.schedaGioco.storia}`, d.schedaGioco.completista && `Completista ${d.schedaGioco.completista}`]
              .filter(Boolean)
              .map((x) => (
                <span key={String(x)}>{x}</span>
              ))}
          </p>
        )}
        {(g.uscita || chi) && (
          <p className="mt-2 text-sm text-platino/80">
            {g.uscita && <>Uscito il <time dateTime={g.uscita}>{dataUscita(g.uscita)}</time></>}
            {g.uscita && chi && " · "}
            {chi}
          </p>
        )}
      </div>
    </header>
  );
}

/**
 * La recensione del gioco in testa all'hub (richiesta del proprietario, 20/10/2026): il voto nella
 * sua figura, il titolo e il riassunto, verso la recensione.
 */
function Recensione({ d }: { d: DatiHub }) {
  const r = d.recensione;
  if (!r) return null;
  return (
    <section aria-label="La nostra recensione" className="mt-6">
      <Link
        prefetch={false}
        href={r.articolo.percorso}
        data-misura="recensione_hub"
        className="group relative flex items-center gap-4 overflow-hidden rounded-xl border border-linea bg-superficie py-4 pl-5 pr-4 transition-[border-color,transform] duration-150 active:scale-[0.99] [@media(hover:hover)]:hover:border-link"
      >
        <span className={`absolute inset-y-0 left-0 w-1.5 ${BARRA_VOTO[fascia(r.voto)]}`} aria-hidden="true" />
        <FiguraVoto voto={r.voto} misura="piccola" />
        <span className="min-w-0 flex-1">
          <span className="block text-xs font-semibold uppercase tracking-[0.06em] text-tenue">La nostra recensione</span>
          <span className="mt-0.5 block font-bold leading-snug text-balance [@media(hover:hover)]:group-hover:text-link">{r.articolo.titolo}</span>
          {r.articolo.riassunto && <span className="mt-1 line-clamp-2 text-sm text-tenue">{r.articolo.riassunto}</span>}
        </span>
        <ArrowRightIcon weight="bold" className="size-4 shrink-0 text-link" aria-hidden="true" />
      </Link>
    </section>
  );
}

function Presentazione({ d }: { d: DatiHub }) {
  if (!d.gioco.presentazione) return null;
  return <p className="mt-5 max-w-[65ch] text-[1.0625rem] leading-relaxed">{d.gioco.presentazione}</p>;
}

/** I dati del completamento, letti dalla scheda della guida al Platino: nessun doppione nel CMS. */
function Completamento({ d }: { d: DatiHub }) {
  const s = d.scheda;
  if (!s || !d.platino) return null;
  return (
    <section
      aria-label="Il Platino in breve"
      className="mt-6 rounded-xl border border-linea bg-superficie p-4"
    >
      <Etichetta>Il Platino in breve</Etichetta>
      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-4">
        {s.tempo && (
          <div>
            <dt className="text-[0.8125rem] font-semibold uppercase tracking-[0.04em] text-tenue">Platino in</dt>
            <dd className="mt-1">
              <BloccoAcido>{s.tempo}</BloccoAcido>
            </dd>
          </div>
        )}
        {s.difficolta && (
          <div>
            <dt className="text-[0.8125rem] font-semibold uppercase tracking-[0.04em] text-tenue">Difficoltà</dt>
            <dd className="mt-1">
              <span className="cifre text-[1.5rem] font-bold leading-none">
                {String(s.difficolta.voto).replace(".", ",")}
                <span className="text-base font-medium text-tenue">/{s.difficolta.massimo}</span>
              </span>
              <span className="mt-1.5 block">
                <Tacche {...s.difficolta} piccole />
              </span>
            </dd>
          </div>
        )}
        {s.partite && (
          <div>
            <dt className="text-[0.8125rem] font-semibold uppercase tracking-[0.04em] text-tenue">Partite</dt>
            <dd className="cifre mt-1 text-[1.5rem] font-bold leading-none">{s.partite}</dd>
          </div>
        )}
        {s.trofei?.totale !== undefined && (
          <div>
            <dt className="text-[0.8125rem] font-semibold uppercase tracking-[0.04em] text-tenue">Trofei</dt>
            <dd className="cifre mt-1 text-[1.5rem] font-bold leading-none">{s.trofei.totale}</dd>
          </div>
        )}
      </dl>
      <div className="mt-3">
        <Mancabili s={s} />
      </div>
      <Link prefetch={false} href={d.platino.percorso} className="mt-2 inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-link [@media(hover:hover)]:hover:underline">
        Guida al Platino e roadmap
        <ArrowRightIcon weight="bold" className="size-3.5" aria-hidden="true" />
      </Link>
    </section>
  );
}

function CartaPlatino({ a, gioco }: { a: Articolo; gioco: string }) {
  return (
    <Link prefetch={false}
      href={a.percorso}
      className="group grid grid-cols-[7rem_1fr] overflow-hidden rounded-xl border-2 border-viola/70 bg-superficie transition-[border-color,transform] duration-150 active:scale-[0.99] sm:grid-cols-[11rem_1fr] [@media(hover:hover)]:hover:border-link"
    >
      {a.immagine ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={a.immagine.src} srcSet={a.immagine.srcset} sizes="176px" alt="" loading="lazy" className="h-full min-h-28 w-full object-cover" />
      ) : (
        <span className="flex items-center justify-center bg-superficie-alta">
          <IconaAiuto aiuto="Trofei" className="size-8 text-viola-testo" />
        </span>
      )}
      <span className="min-w-0 p-3">
        <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.06em] text-viola-testo">
          <IconaAiuto aiuto="Trofei" className="size-4" />
          Guida al Platino
        </span>
        <span className="mt-1 block font-bold leading-snug text-balance [@media(hover:hover)]:group-hover:text-link">{senzaGioco(a.titolo, gioco)}</span>
      </span>
    </Link>
  );
}

function IniziaQui({ d }: { d: DatiHub }) {
  if (!d.iniziaQui.length) return null;
  return (
    <ol className="flex flex-col gap-2">
      {d.iniziaQui.map((a, i) => (
        <li key={a.id}>
          <Link prefetch={false}
            href={a.percorso}
            className="group flex min-h-14 items-center gap-3 rounded-xl border border-linea bg-superficie p-3 transition-[border-color,transform] duration-150 active:scale-[0.99] [@media(hover:hover)]:hover:border-link"
          >
            <span className="cifre flex size-8 shrink-0 items-center justify-center rounded-full bg-viola text-sm font-bold text-su-viola">{i + 1}</span>
            <span className="min-w-0 flex-1 font-semibold leading-snug">{senzaGioco(a.titolo, d.nome)}</span>
            <ArrowRightIcon weight="bold" className="size-4 shrink-0 text-link" aria-hidden="true" />
          </Link>
        </li>
      ))}
    </ol>
  );
}

function Notizie({ d }: { d: DatiHub }) {
  return (
    <section aria-label="Notizie" className="mt-10">
      <h2 className="flex items-center gap-2 text-lg font-bold">
        <NewspaperIcon weight="duotone" className="size-5 text-viola-testo" aria-hidden="true" />
        Notizie
      </h2>
      {d.notizie.length ? (
        <ul className="mt-2 border-t border-linea">
          {d.notizie.slice(0, 8).map((a) => (
            <li key={a.id} className="border-b border-linea py-2.5">
              <Link prefetch={false} href={a.percorso} className="font-medium leading-snug [@media(hover:hover)]:hover:text-link">
                {a.titolo}
              </Link>
              <p className="text-sm text-tenue">{dataLeggibile(a.data)}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 rounded-xl border border-dashed border-linea p-4 text-sm text-tenue">
          Ancora nessuna notizia su {d.nome}. Qui compariranno aggiornamenti, patch e annunci, separati dalle guide.
        </p>
      )}
    </section>
  );
}

function Piede({ d }: { d: DatiHub }) {
  return (
    <p className="mt-10 border-t border-linea pt-4 text-sm text-tenue">
      {d.aggiornato && (
        <>
          Hub aggiornato il <time dateTime={d.aggiornato}>{dataLeggibile(d.aggiornato)}</time> ·{" "}
        </>
      )}
      {d.archivio && (
      <Link prefetch={false} href={`/tag/${d.slug}/page/2/`} className="inline-flex min-h-11 items-center text-link underline underline-offset-4">
        Archivio in ordine di data
      </Link>
      )}
    </p>
  );
}

/** Il percorso a passi numerati, poi tutte le guide con il filtro a pulsanti. */
export function Hub({ d }: { d: DatiHub }) {
  const gruppo = (a: string) => d.gruppi.find((g) => g.aiuto === a)?.guide ?? [];
  const passi = [
    d.iniziaQui.length > 0 && { titolo: "Inizia qui", testo: "Le basi per non farti travolgere nelle prime ore.", corpo: <IniziaQui d={d} /> },
    d.platino && { titolo: "Punta al Platino", testo: "La roadmap completa, con il trofeo da non perdere.", corpo: <CartaPlatino a={d.platino} gioco={d.nome} /> },
    gruppo("Collezionabili").length > 0 && {
      titolo: "Raccogli tutto",
      testo: "Capitolo per capitolo, con le tabelle dei mancanti.",
      corpo: <ElencoBreve guide={gruppo("Collezionabili")} gioco={d.nome} />,
    },
    gruppo("Trofei").length > 0 && {
      titolo: "Pulizia finale",
      testo: "Gli ultimi trofei e cosa fare dopo i titoli di coda.",
      corpo: <ElencoBreve guide={gruppo("Trofei")} gioco={d.nome} />,
    },
  ].filter(Boolean) as Array<{ titolo: string; testo: string; corpo: React.ReactNode }>;

  return (
    <>
      <Testata d={d} />
      <Recensione d={d} />
      <Presentazione d={d} />
      <Completamento d={d} />
      <Riprendi tracciabili={d.tracciabili.map((t) => ({ ...t, titolo: senzaGioco(t.titolo, d.nome) }))} />
      <section aria-label="Il percorso consigliato" className="mt-8">
        <Etichetta>Il percorso consigliato</Etichetta>
        <ol className="mt-4">
          {passi.map((p, i) => (
            <li key={p.titolo} className="relative pb-8 pl-12 last:pb-0">
              {i < passi.length - 1 && <span className="absolute bottom-0 left-[1.0625rem] top-10 w-0.5 bg-linea" aria-hidden="true" />}
              <span className="cifre absolute left-0 top-0 flex size-9 items-center justify-center rounded-full border-2 border-viola text-sm font-bold text-viola-testo">
                {i + 1}
              </span>
              <h3 className="text-lg font-bold leading-9">{p.titolo}</h3>
              <p className="mb-3 text-sm text-tenue">{p.testo}</p>
              {p.corpo}
            </li>
          ))}
        </ol>
      </section>
      <section aria-label="Tutte le guide" className="mt-12">
        <h2 className="mb-4 text-[1.5rem] font-bold">
          Tutte le guide
        </h2>
        <GuidePerTipo gruppi={leggeri(d.gruppi, d.nome)} />
      </section>
      <Notizie d={d} />
      <Piede d={d} />
    </>
  );
}

function ElencoBreve({ guide, gioco }: { guide: Articolo[]; gioco: string }) {
  return (
    <ul className="border-t border-linea">
      {guide.map((a) => (
        <li key={a.id} className="border-b border-linea">
          <Link prefetch={false} href={a.percorso} className="flex min-h-12 items-center py-2 leading-snug [@media(hover:hover)]:hover:text-link">
            {senzaGioco(a.titolo, gioco)}
          </Link>
        </li>
      ))}
    </ul>
  );
}
