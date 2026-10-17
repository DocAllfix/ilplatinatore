// La sfida di oggi, dai dati che il sito ha gia' (scelta dell'utente, 17/10/2026): giochi segnati
// per la sfida o con l'hub, trofei dei campi delle guide al Platino, classici dell'elenco curato.
// Solo lato server.

import type { Articolo, Immagine } from "./cms/tipi";
import { articoloPerSlug, classiciSfida, paginaArticoli, tuttiITermini } from "./cms/wp";
import { trofeiDaCampi } from "./guida/campi";
import { estraiChecklist } from "./guida/checklist";
import { estraiScheda } from "./guida/scheda";
import { copertinaHub, giocoDaMeta } from "./hub";
import { elementoDelTurno, formatoDelGiorno, numeroSfida, uscitaDelFormato, type Classico, type Formato } from "./sfida";

export type SfidaGioco = { formato: "gioco"; soluzione: string; immagine: Immagine; risposte: string[]; rimando: { testo: string; href: string } };
export type SfidaTrofeo = {
  formato: "trofeo";
  gioco: string;
  soluzione: string;
  indizi: { come: string; gruppo: string };
  risposte: string[];
  rimando: { testo: string; href: string };
};
export type SfidaClassico = { formato: "classico"; soluzione: Classico; elenco: Classico[] };
export type Sfida = SfidaGioco | SfidaTrofeo | SfidaClassico;

export type DatiSfida = {
  numero: number;
  giorno: number;
  /** il formato di oggi; le altre sfide servono solo all'anteprima delle varianti */
  oggi: Formato | null;
  sfide: Partial<Record<Formato, Sfida>>;
};

const meta1 = (m: Record<string, unknown> | undefined, k: string) => typeof m?.[k] === "string" && m[k] === "1";

export async function datiSfida(giorno: number): Promise<DatiSfida> {
  const [tag, classici] = await Promise.all([tuttiITermini("tags"), classiciSfida()]);
  const giochi = tag
    .filter((t) => t.count > 0 && (meta1(t.meta, "pl_sfida") || meta1(t.meta, "pl_gioco")))
    .sort((a, b) => a.slug.localeCompare(b.slug));
  const conPlatino = giochi
    .map((t) => ({ t, g: giocoDaMeta(t.meta) }))
    .filter((x) => x.g?.guidaPlatino);

  const disponibili: Formato[] = [
    ...(giochi.length ? (["gioco"] as const) : []),
    ...(conPlatino.length ? (["trofeo"] as const) : []),
    ...(classici.length ? (["classico"] as const) : []),
  ];
  const k = uscitaDelFormato(giorno, disponibili);
  const sfide: DatiSfida["sfide"] = {};
  const nomi = giochi.map((t) => t.name);

  // Riconosci il gioco: l'immagine della guida piu' recente; se un gioco non ne ha, si passa al seguente
  for (let tentativo = 0; tentativo < Math.min(5, giochi.length); tentativo++) {
    const t = giochi[elementoDelTurno(k + tentativo, giochi.length, 11)];
    const r = await paginaArticoli({ tag: t.id, pagina: 1 });
    const immagine = copertinaHub<Immagine, Articolo>(null, r?.articoli ?? []);
    if (!immagine) continue;
    sfide.gioco = {
      formato: "gioco",
      soluzione: t.name,
      immagine,
      risposte: nomi,
      rimando: meta1(t.meta, "pl_gioco")
        ? { testo: `Apri l'hub di ${t.name}`, href: `/tag/${t.slug}/` }
        : { testo: `Tutte le guide di ${t.name}`, href: `/tag/${t.slug}/` },
    };
    break;
  }

  // Indovina il trofeo: dai trofei della guida al Platino (campi, o tabelle del testo come ripiego)
  if (conPlatino.length) {
    const { t, g } = conPlatino[elementoDelTurno(k, conPlatino.length, 23)];
    const guida = (await articoloPerSlug(g!.guidaPlatino!))?.articolo;
    if (guida) {
      const daCampi = trofeiDaCampi(guida.meta);
      const gruppi = daCampi.length ? daCampi : estraiChecklist(estraiScheda(guida.contenuto).corpo).gruppi;
      const voci = gruppi.flatMap((gr) =>
        gr.voci.map((v) => ({ v, gruppo: gr, come: v.dettagli.find((d) => /come|requisit|descri/i.test(d.etichetta))?.valore ?? v.dettagli[0]?.valore ?? "" })),
      ).filter((x) => x.come);
      if (voci.length >= 4) {
        const scelto = voci[elementoDelTurno(k, voci.length, 37)];
        sfide.trofeo = {
          formato: "trofeo",
          gioco: t.name,
          soluzione: scelto.v.nome,
          indizi: { come: scelto.come, gruppo: scelto.gruppo.titolo },
          risposte: voci.map((x) => x.v.nome),
          rimando: { testo: "Come ottenerlo, nella guida al Platino", href: `${guida.percorso}#${scelto.gruppo.id}` },
        };
      }
    }
  }

  if (classici.length >= 4) {
    sfide.classico = { formato: "classico", soluzione: classici[elementoDelTurno(k, classici.length, 53)], elenco: classici };
  }

  const presenti = (Object.keys(sfide) as Formato[]).filter((f) => sfide[f]);
  return { numero: numeroSfida(giorno), giorno, oggi: formatoDelGiorno(giorno, presenti), sfide };
}
