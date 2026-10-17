// Home a sezioni (piano 06, modello games.gg chiesto dal proprietario). Scelta del proprietario
// (17/10/2026): le schede verticali della B «Locandine», e ogni tanto una scheda grande come nella
// C «In evidenza», per dare impatto: una sezione si' e una no apre con una locandina larga il doppio.
// Piano 07: le sezioni hanno solo il titolo (il criterio resta nei dati, non si mostra), e «Tutte»
// e' un bottone Acido.

import { BottoneAcido } from "@/components/bottone-acido";
import { CartaArticolo } from "@/components/carta-articolo";
import type { Articolo } from "@/lib/cms/tipi";
import type { SezioneDati } from "@/lib/home-dati";
import { CartaSfida } from "./carta-sfida";
import { FilaScorrevole } from "./fila-scorrevole";

/** Una fila di locandine; con `apertura` la prima e' larga il doppio, alta come le altre. */
function Fila({ voci, prima, apertura, sezione }: { voci: Articolo[]; prima: boolean; apertura: boolean; sezione: string }) {
  return (
    <FilaScorrevole quante={voci.length}>
      {voci.map((a, i) => {
        const grande = apertura && i === 0;
        return (
          <li key={a.id} data-scheda className={`shrink-0 snap-start ${grande ? "w-[min(22rem,84vw)]" : "w-[min(11rem,46vw)]"}`}>
            <CartaArticolo
              a={a}
              carico={prima ? (i === 0 ? "subito" : i < 3 ? "pigro" : "dopo") : i < 3 ? "vicino" : "dopo"}
              grande={grande}
              misura={{ nome: "home_sezione", dettaglio: sezione }}
            />
          </li>
        );
      })}
    </FilaScorrevole>
  );
}

export function Sezioni({ sezioni }: { sezioni: SezioneDati[] }) {
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
          ) : (
            // una sezione si' e una no apre con la scheda grande
            <Fila voci={s.voci} prima={i === 0} apertura={i % 2 === 0} sezione={s.titolo} />
          )}
        </section>
      ))}
    </div>
  );
}
