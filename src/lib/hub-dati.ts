// Raccoglie dal CMS tutto quello che serve all'hub di un gioco (piano 04). Solo lato server.
// Se il tag non e' segnato come gioco restituisce null e la pagina resta l'archivio di oggi.

import { PER_PAGINA } from "./cms/config";
import { articoliDelTag, articoloPerSlug, terminePerSlug } from "./cms/wp";
import type { Articolo, Immagine } from "./cms/tipi";
import { collezionabiliDaCampi } from "./guida/collezionabili";
import { schedaDaCampi, trofeiDaCampi } from "./guida/campi";
import { estraiChecklist } from "./guida/checklist";
import { estraiScheda, type Scheda } from "./guida/scheda";
import { copertinaHub, giocoDaMeta, guidaPlatinoDalTitolo, perAiuto, type Gioco } from "./hub";
import { schedaDaDescrizione, type SchedaGioco } from "./scheda-gioco";

/** Un articolo con spunte: l'hub legge dal browser quante ne ha fatte il lettore. */
export type Tracciabile = { id: number; titolo: string; percorso: string; ids: string[]; unita: string };

export type DatiHub = {
  nome: string;
  slug: string;
  gioco: Gioco;
  /** genere, voto e durate dalla descrizione del tag (piano 07) */
  schedaGioco: SchedaGioco | null;
  platino: Articolo | null;
  /** dalla guida al Platino, altrimenti dalla guida piu' recente con un'immagine */
  copertina?: Immagine;
  scheda: Scheda | null;
  iniziaQui: Articolo[];
  gruppi: ReturnType<typeof perAiuto<Articolo>>;
  notizie: Articolo[];
  tracciabili: Tracciabile[];
  aggiornato?: string;
  /** l'archivio in ordine di data ha una pagina 2 (la 1 e' l'hub) */
  archivio: boolean;
};

const NOTIZIE = /^news$|notizi/i;

export async function datiHub(slug: string): Promise<DatiHub | null> {
  const t = await terminePerSlug("tags", slug);
  const gioco = giocoDaMeta(t?.meta);
  if (!t || !gioco) return null;

  const articoli = await articoliDelTag(t.id);
  // la guida al Platino: quella del campo; se manca, quella trovata dal titolo (scelta dell'utente,
  // 18/10/2026: con 56 hub nessuno compilerebbe il campo a mano)
  const slugPlatino = gioco.guidaPlatino ?? guidaPlatinoDalTitolo(articoli)?.slug;
  const completa = slugPlatino ? await articoloPerSlug(slugPlatino) : null;
  const platino = completa?.articolo ?? null;

  // stessa precedenza della pagina dell'articolo: prima i campi, poi le tabelle del testo
  let scheda: Scheda | null = null;
  let idsTrofei: string[] = [];
  if (platino) {
    const { scheda: daTabella, corpo } = estraiScheda(platino.contenuto);
    scheda = schedaDaCampi(platino.meta) ?? daTabella;
    const daCampi = trofeiDaCampi(platino.meta);
    idsTrofei = (daCampi.length ? daCampi : estraiChecklist(corpo).gruppi).flatMap((g) => g.voci.map((v) => v.id));
  }

  const notizie = articoli.filter((a) => a.categorie.some((c) => NOTIZIE.test(c.slug)));
  const guide = articoli.filter((a) => !notizie.includes(a) && a.id !== platino?.id);

  const tracciabili: Tracciabile[] = [];
  if (platino && idsTrofei.length)
    tracciabili.push({ id: platino.id, titolo: platino.titolo, percorso: platino.percorso, ids: idsTrofei, unita: "trofei" });
  for (const a of guide) {
    const oggetti = collezionabiliDaCampi(a.meta, []).map((o) => o.id);
    const trofei = trofeiDaCampi(a.meta).flatMap((g) => g.voci.map((v) => v.id));
    if (oggetti.length) tracciabili.push({ id: a.id, titolo: a.titolo, percorso: a.percorso, ids: oggetti, unita: "oggetti" });
    else if (trofei.length) tracciabili.push({ id: a.id, titolo: a.titolo, percorso: a.percorso, ids: trofei, unita: "trofei" });
  }

  const perSlug = new Map(articoli.map((a) => [a.slug, a]));
  const aggiornato = articoli.map((a) => a.modificato ?? a.data).sort().at(-1);
  return {
    nome: t.name,
    slug,
    gioco,
    schedaGioco: schedaDaDescrizione(t.description),
    platino,
    copertina: copertinaHub(platino, guide),
    scheda,
    iniziaQui: gioco.iniziaQui.map((s) => perSlug.get(s)).filter((a): a is Articolo => Boolean(a)),
    gruppi: perAiuto(guide),
    notizie,
    tracciabili,
    aggiornato,
    archivio: articoli.length > PER_PAGINA,
  };
}
