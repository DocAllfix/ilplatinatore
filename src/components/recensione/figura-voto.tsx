// La figura del voto delle recensioni (richiesta del proprietario, 20/10/2026): come il rombo di IGN,
// ma con una figura e i colori del Platinatore. Tre fasce sul voto riportato a 10 (dall'8 Acido, dal
// 6 Ciano, sotto Viola), sempre piene: sul tema chiaro un anello o un contorno Acido non si vedrebbe.
// Tre forme in prova sull'anteprima (selettore delle varianti): A esagono, B lastra inclinata, C rombo.

import { fascia, votoTesto, type Voto } from "@/lib/recensione";

export type Forma = "a" | "b" | "c";

const FONDO = { alta: "bg-azione", media: "bg-ciano", bassa: "bg-viola" } as const;
const TESTO = { alta: "text-su-azione", media: "text-notte", bassa: "text-su-viola" } as const;

const MISURE = {
  grande: { box: "size-[5.5rem]", numero: "text-[2rem]", rombo: "text-[1.625rem]", scala: "text-[0.6875rem]" },
  piccola: { box: "size-12", numero: "text-[1.0625rem]", rombo: "text-[0.9375rem]", scala: "hidden" },
} as const;

export function FiguraVoto({ voto, forma = "a", misura = "grande" }: { voto: Voto; forma?: Forma; misura?: keyof typeof MISURE }) {
  const m = MISURE[misura];
  const f = fascia(voto);
  const colore = `${FONDO[f]} ${TESTO[f]}`;
  const numero = (
    <span className="flex flex-col items-center leading-none">
      {/* nel rombo lo spazio utile e' piu' stretto: il numero e' un po' piu' piccolo */}
      <span className={`cifre font-bold tracking-[-0.02em] ${forma === "c" ? m.rombo : m.numero}`}>{votoTesto(voto.valore)}</span>
      <span className={`mt-0.5 font-semibold opacity-75 ${m.scala}`}>su {votoTesto(voto.scala)}</span>
    </span>
  );
  const etichetta = `Voto ${votoTesto(voto.valore)} su ${votoTesto(voto.scala)}`;

  if (forma === "b")
    return (
      <span role="img" aria-label={etichetta} className={`inline-flex shrink-0 items-center justify-center ${m.box}`}>
        <span className={`flex h-[82%] w-full -skew-x-6 items-center justify-center ${colore} shadow-[0_0_0_1px_rgb(11_13_18/0.12)]`}>
          <span className="skew-x-6">{numero}</span>
        </span>
      </span>
    );
  if (forma === "c")
    return (
      <span role="img" aria-label={etichetta} className={`relative inline-flex shrink-0 items-center justify-center ${m.box}`}>
        <span className={`absolute inset-[13%] rotate-45 rounded-[18%] ${FONDO[f]} shadow-[0_0_0_1px_rgb(11_13_18/0.12)]`} aria-hidden="true" />
        <span className={`relative ${TESTO[f]}`}>{numero}</span>
      </span>
    );
  return (
    <span role="img" aria-label={etichetta} className={`inline-flex shrink-0 drop-shadow-[0_0_1px_rgb(11_13_18/0.35)] ${m.box}`}>
      <span className={`flex size-full items-center justify-center ${colore} [clip-path:polygon(25%_3%,75%_3%,100%_50%,75%_97%,25%_97%,0_50%)]`}>{numero}</span>
    </span>
  );
}
