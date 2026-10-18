// Hub del gioco (PDF 04, piano 04): dati del gioco dai campi del tag (mu-plugin, sezione 6) e tipo
// di aiuto di ogni guida dedotto dal titolo (scelta dell'utente, 17/10/2026). Funzioni pure.

type Meta = Record<string, unknown> | undefined;

export const AIUTI = [
  "Platino e trofei",
  "Collezionabili",
  "Missioni",
  "Boss",
  "Armi e potenziamenti",
  "Meccaniche e consigli",
] as const;
export type Aiuto = (typeof AIUTI)[number];

const normale = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");

// L'ordine conta: vince la prima regola che combacia. Una guida ai collezionabili che cita un trofeo
// («17 disegni e il trofeo Il Bestiario») e' una guida ai collezionabili.
const REGOLE: Array<[Aiuto, RegExp]> = [
  ["Collezionabili", /collezionabil|\bambre\b|\bamber\b|\bdisegni\b|\bcollectible/],
  ["Missioni", /\bmission[ei]\b|\bquest\b|\bcompletare\b/],
  ["Boss", /\bboss\b|sconfiggere/],
  ["Platino e trofei", /platino|\btrofe|mancabil|dopo il finale|\b100%/],
  ["Armi e potenziamenti", /\barmi\b|potenzia|abilita|\bcure\b|\bfiale\b|\bbuild\b|equipaggiament/],
];

/** Il tipo di aiuto dal titolo; quello che non combacia con niente e' «Meccaniche e consigli». */
export function tipoAiuto(titolo: string): Aiuto {
  const t = normale(titolo);
  return REGOLE.find(([, rx]) => rx.test(t))?.[0] ?? "Meccaniche e consigli";
}

export type Gioco = {
  presentazione: string;
  piattaforme: string[];
  /** AAAA-MM-GG */
  uscita?: string;
  sviluppatore?: string;
  editore?: string;
  guidaPlatino?: string;
  iniziaQui: string[];
};

const str = (v: unknown) => (typeof v === "string" ? v.replace(/\s*[–—]\s*/g, "-").trim() : "");

/** I dati del gioco, o null se il tag non e' segnato come gioco: allora resta l'archivio di oggi. */
export function giocoDaMeta(meta: Meta): Gioco | null {
  if (!meta || str(meta.pl_gioco) !== "1") return null;
  const uscita = str(meta.pl_uscita);
  const slug = (s: string) => s.replace(/\/+$/, "").split("/").pop()!.toLowerCase();
  return {
    presentazione: str(meta.pl_presentazione),
    piattaforme: str(meta.pl_piattaforme)
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean),
    uscita: /^\d{4}-\d{2}-\d{2}$/.test(uscita) ? uscita : undefined,
    sviluppatore: str(meta.pl_sviluppatore) || undefined,
    editore: str(meta.pl_editore) || undefined,
    guidaPlatino: str(meta.pl_guida_platino) ? slug(str(meta.pl_guida_platino)) : undefined,
    iniziaQui: str(meta.pl_inizia_qui)
      .split("\n")
      .map((x) => x.trim())
      .filter(Boolean)
      .map(slug),
  };
}

/** Le guide divise per tipo di aiuto, nell'ordine di AIUTI; i tipi vuoti non compaiono. */
export function perAiuto<T extends { titolo: string }>(guide: T[]): Array<{ aiuto: Aiuto; guide: T[] }> {
  const gruppi = new Map<Aiuto, T[]>();
  for (const g of guide) {
    const a = tipoAiuto(g.titolo);
    gruppi.set(a, [...(gruppi.get(a) ?? []), g]);
  }
  return AIUTI.filter((a) => gruppi.has(a)).map((aiuto) => ({ aiuto, guide: gruppi.get(aiuto)! }));
}

/** Descrizione per i motori: la presentazione tagliata su una parola, sotto i 160 caratteri. */
export function descrizioneHub(g: Gioco, nome: string): string {
  const base = g.presentazione || `Tutte le guide di ${nome}: Platino, trofei, collezionabili e missioni.`;
  if (base.length <= 158) return base;
  return `${base.slice(0, 155).replace(/\s+\S*$/, "")}…`;
}

/** Il nome del gioco davanti ai due punti si ripete in ogni titolo: nell'hub si toglie. */
export function senzaGioco(t: string): string {
  const resto = t.replace(/^[^:]{2,40}:\s*/, "");
  return resto.charAt(0).toLocaleUpperCase("it-IT") + resto.slice(1);
}

/**
 * L'immagine della testata: quella della guida al Platino; se manca, quella della guida piu' recente
 * del gioco che ne ha una (scelta dell'utente, 17/10/2026). Nessuna immagine: undefined.
 */
export function copertinaHub<I, A extends { immagine?: I; data: string }>(platino: A | null, guide: A[]): I | undefined {
  if (platino?.immagine) return platino.immagine;
  return [...guide].filter((g) => g.immagine).sort((x, y) => y.data.localeCompare(x.data))[0]?.immagine;
}

/**
 * La guida al Platino riconosciuta dal titolo («guida al platino», «tutti i trofei», «lista dei
 * trofei»); prima quelle che si dicono «guida al platino», poi la piu' recente; null se non c'e'.
 * Vale solo quando il campo del tag e' vuoto.
 */
export function guidaPlatinoDalTitolo<A extends { titolo: string; data: string }>(articoli: A[]): A | null {
  const rx = /guida al platino|\bplatino\b.*\btrofei\b|\btrofei\b.*\bplatino\b|tutti i (?:\d+ )?trofei|lista (?:di tutti |dei |completa dei )?trofei/i;
  const punti = (a: A) => (/guida al platino/i.test(a.titolo) ? 1 : 0);
  const trovate = articoli.filter((a) => rx.test(a.titolo)).sort((x, y) => punti(y) - punti(x) || y.data.localeCompare(x.data));
  return trovate[0] ?? null;
}
