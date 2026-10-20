// La figura del voto delle recensioni (richiesta del proprietario, 20/10/2026): come il rombo di IGN,
// ma con la forma del Platinatore. Scelta del proprietario: B «Lastra inclinata», la stessa del blocco
// giallo del Platino e dei bottoni, «perche' richiama il sito». Piena, sempre: sul tema chiaro un
// contorno Acido non si vedrebbe.
//
// Tre fasce sul voto riportato a 10: dall'8 Acido, dal 6 Ciano, sotto Viola. La barra laterale delle
// schede che mostrano un voto ha SEMPRE il colore della sua fascia (BarraFascia, richiesta del
// proprietario): non si sceglie un colore diverso altrove.

import { fascia, votoTesto, type Fascia, type Voto } from "@/lib/recensione";

/** Il colore di una fascia, per la figura e per le barre laterali delle schede col voto. */
const COLORE_FASCIA: Record<Fascia, string> = { alta: "bg-azione", media: "bg-ciano", bassa: "bg-viola" };
const TESTO: Record<Fascia, string> = { alta: "text-su-azione", media: "text-notte", bassa: "text-su-viola" };

const MISURE = {
  grande: { box: "size-[5.5rem]", numero: "text-[2rem]", scala: "text-[0.6875rem]" },
  piccola: { box: "size-12", numero: "text-[1.0625rem]", scala: "hidden" },
} as const;

export function FiguraVoto({ voto, misura = "grande" }: { voto: Voto; misura?: keyof typeof MISURE }) {
  const m = MISURE[misura];
  const f = fascia(voto);
  return (
    <span role="img" aria-label={`Voto ${votoTesto(voto.valore)} su ${votoTesto(voto.scala)}`} className={`inline-flex shrink-0 items-center justify-center ${m.box}`}>
      <span className={`flex h-[82%] w-full -skew-x-6 items-center justify-center ${COLORE_FASCIA[f]} ${TESTO[f]} shadow-[0_0_0_1px_rgb(11_13_18/0.12)]`}>
        <span className="flex skew-x-6 flex-col items-center leading-none">
          <span className={`cifre font-bold tracking-[-0.02em] ${m.numero}`}>{votoTesto(voto.valore)}</span>
          <span className={`mt-0.5 font-semibold opacity-75 ${m.scala}`}>su {votoTesto(voto.scala)}</span>
        </span>
      </span>
    </span>
  );
}

/** La barra laterale di una scheda col voto: sempre nel colore della sua fascia. */
export function BarraFascia({ voto }: { voto: Voto }) {
  return <span className={`absolute inset-y-0 left-0 z-10 w-1.5 ${COLORE_FASCIA[fascia(voto)]}`} aria-hidden="true" />;
}
