// Gli spazi pubblicitari di HB Agency, con lo STESSO markup del sito di prima: lo script di HB li cerca per
// id e classe (letti dal sito vero il 18/10/2026, in sola lettura). Gli stili delle classi hb-ad-* li porta
// lo script stesso. Sull'anteprima lo script non parte: gli spazi restano vuoti.

import { HEADER_BANNER } from "@/lib/annunci";
import { SoloDaComputer } from "@/components/annunci-condizionali";

/** Floor Ad, Magic Left e Header Banner hanno i contenitori per il pulsante di chiusura di HB. */
const CON_CHIUSURA = new Set(["304962", "304792", "304793"]);

function Markup({ id }: { id: string }) {
  if (CON_CHIUSURA.has(id))
    return (
      <div id={`HB_Footer_Close_hbagency_space_${id}`}>
        <div id={`HB_CLOSE_hbagency_space_${id}`} />
        <div id={`HB_OUTER_hbagency_space_${id}`}>
          <div id={`hbagency_space_${id}`} />
        </div>
      </div>
    );
  if (id === "304796")
    return (
      <div className="hb-ad-inpage">
        <div className="hb-ad-inner">
          <div className={`hbagency_cls hbagency_space_${id}`} />
        </div>
      </div>
    );
  if (id === "304968")
    return (
      <div className="hb-ad-inarticle">
        <div className="hb-ad-inner">
          <div className="hbagency_cls" id={`hbagency_space_${id}`} />
        </div>
      </div>
    );
  return <div id={`hbagency_space_${id}`} />;
}

/** Uno spazio di HB. Nessuna altezza imposta: se HB non riempie lo spazio, non resta un buco. */
export function SpazioHB({ id, nome }: { id: string; nome: string }) {
  return (
    <div className="annuncio" data-annuncio={nome}>
      <Markup id={id} />
    </div>
  );
}

/**
 * L'Header Banner, SOLO da computer (specifiche del 29/10/2026), dopo l'introduzione dell'articolo. Si usa
 * quando HB lo avra' abilitato da computer (HEADER_DA_COMPUTER): oggi HB lo configura solo da telefono.
 * Il riquadro riserva 250 px gia' nella prima risposta, cosi' l'annuncio non spinge giu' il testo; da
 * telefono il riquadro non si vede e lo spazio con l'id non esiste.
 */
export function HeaderBanner() {
  return (
    <aside aria-label="Pubblicità" className="relative my-6 hidden min-h-[250px] place-items-center overflow-hidden rounded-lg border border-dashed border-linea lg:grid">
      <span className="absolute text-xs uppercase tracking-[0.04em] text-tenue" aria-hidden="true">
        Pubblicità
      </span>
      <div className="relative w-full" data-annuncio={HEADER_BANNER.nome}>
        <SoloDaComputer>
          <Markup id={HEADER_BANNER.id} />
        </SoloDaComputer>
      </div>
    </aside>
  );
}
