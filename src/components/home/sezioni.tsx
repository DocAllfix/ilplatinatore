// Home a sezioni (piano 06, modello games.gg chiesto dal proprietario). Scelta del proprietario
// (17/10/2026): le schede verticali della B «Locandine», e ogni tanto una scheda grande come nella
// C «In evidenza», per dare impatto: una sezione si' e una no apre con una locandina larga il doppio.
// Piano 07: le sezioni hanno solo il titolo (il criterio resta nei dati, non si mostra), e «Tutte»
// e' un bottone Acido.

import { BottoneAcido } from "@/components/bottone-acido";
import { CartaArticolo } from "@/components/carta-articolo";
import type { Articolo } from "@/lib/cms/tipi";
import type { SezioneDati } from "@/lib/home-dati";
import Link from "next/link";
import type { VoceGioco } from "@/lib/home-dati";
import { CartaSfida } from "./carta-sfida";
import { FilaScorrevole } from "./fila-scorrevole";

/** Una fila di locandine; con `apertura` la prima e' larga il doppio, alta come le altre. */
function Fila({ voci, prima, apertura, sezione, riferimento }: { voci: Articolo[]; prima: boolean; apertura: boolean; sezione: string; riferimento: number }) {
  return (
    <FilaScorrevole>
      {voci.map((a, i) => {
        const grande = apertura && i === 0;
        return (
          <li key={a.id} data-scheda className={`shrink-0 snap-start ${grande ? "w-[min(22rem,84vw)]" : "w-[min(11rem,46vw)]"}`}>
            <CartaArticolo
              a={a}
              carico={prima ? (i === 0 ? "subito" : i < 3 ? "pigro" : "dopo") : i < 3 ? "vicino" : "dopo"}
              grande={grande}
              misura={{ nome: "home_sezione", dettaglio: sezione }}
              riferimento={riferimento}
            />
          </li>
        );
      })}
    </FilaScorrevole>
  );
}

/** «Esplora per gioco» (PDF 09): mini-schede dei giochi verso i loro hub. */
function FilaGiochi({ voci }: { voci: VoceGioco[] }) {
  return (
    <FilaScorrevole>
      {voci.map((g, i) => (
        <li key={g.slug} data-scheda className="w-[min(9rem,38vw)] shrink-0 snap-start">
          <Link
            prefetch={false}
            href={`/tag/${g.slug}/`}
            data-misura="home_sezione"
            data-misura-dettaglio="Esplora per gioco"
            className="group relative isolate flex aspect-square flex-col justify-end overflow-hidden rounded-xl border border-linea p-2.5 shadow-[0_6px_18px_oklch(0%_0_0/0.28)] transition-[border-color,transform] duration-150 active:scale-[0.98] [@media(hover:hover)]:hover:-translate-y-0.5 [@media(hover:hover)]:hover:border-viola"
          >
            {g.immagine ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                {...(i < 3 ? { src: g.immagine.src, srcSet: g.immagine.srcset } : { "data-src": g.immagine.src, "data-srcset": g.immagine.srcset, "data-carico": "vicino" })}
                sizes="150px"
                alt=""
                loading="lazy"
                decoding="async"
                className="absolute inset-0 -z-10 size-full bg-superficie-alta object-cover"
              />
            ) : (
              <span className="absolute inset-0 -z-10 bg-superficie-alta" />
            )}
            <span className="absolute inset-0 -z-10 bg-gradient-to-t from-notte via-notte/70 to-transparent" aria-hidden="true" />
            <span className="line-clamp-2 text-sm font-bold leading-tight text-platino">{g.nome}</span>
            <span className="cifre mt-0.5 text-[0.6875rem] text-platino/80">{g.conta === 1 ? "1 articolo" : `${g.conta} articoli`}</span>
          </Link>
        </li>
      ))}
    </FilaScorrevole>
  );
}

export function Sezioni({ sezioni, riferimento }: { sezioni: SezioneDati[]; riferimento: number }) {
  return (
    <div className="flex flex-col gap-10">
      {sezioni.map((s, i) => (
        <section key={s.titolo} aria-label={s.titolo}>
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="min-w-0 text-[1.375rem] font-bold leading-tight">{s.titolo}</h2>
            {s.tipo === "articoli" && s.tutti && (
              <span className="max-w-[50%] shrink-0">
                <BottoneAcido href={s.tutti.href}>{s.tutti.testo}</BottoneAcido>
              </span>
            )}
          </div>
          {s.tipo === "sfida" ? (
            <CartaSfida s={s.sfida} />
          ) : s.tipo === "giochi" ? (
            <FilaGiochi voci={s.voci} />
          ) : (
            // una sezione si' e una no apre con la scheda grande
            <Fila voci={s.voci} prima={i === 0} apertura={i % 2 === 0} sezione={s.titolo} riferimento={riferimento} />
          )}
        </section>
      ))}
    </div>
  );
}
