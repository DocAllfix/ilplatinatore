// La scheda del gioco (piano 07, richiesta del proprietario): i dati stanno nella DESCRIZIONE del
// tag, scritti da wpvibe una riga ciascuno («Anno: 2026», «Genere: Soulslike», «Voto medio: 82»,
// «Storia: 15 ore», «Storia + extra: 25 ore», «Completista: 40 ore»). Il sito non mostra mai la
// descrizione cosi' com'e': la trasforma in scheda. Funzioni pure.

export type SchedaGioco = {
  anno?: string;
  genere?: string;
  voto?: string;
  piattaforme?: string;
  storia?: string;
  extra?: string;
  completista?: string;
};

const normale = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9+%]+/g, " ")
    .trim();

// l'ordine conta: «storia + extra» prima di «storia»
const CHIAVI: Array<[keyof SchedaGioco, RegExp]> = [
  ["extra", /^(storia ?\+ ?extra|storia e extra|extra)$/],
  ["completista", /^(completista|completamento|100%?)$/],
  ["storia", /^(storia|storia principale|durata storia|main story)$/],
  ["anno", /^(anno|anno di uscita|anno di distribuzione|uscita)$/],
  ["genere", /^(genere|generi)$/],
  ["voto", /^(voto|voto medio|recensioni|recensioni medie|media recensioni|metacritic)$/],
  ["piattaforme", /^(piattaforme|piattaforma|console)$/],
];

const testo = (html: string) =>
  html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#8217;|&rsquo;/g, "’")
    .replace(/&#8211;|&#8212;|&ndash;|&mdash;/g, "-")
    .replace(/\s*[–—]\s*/g, "-");

/** I dati della scheda dalla descrizione del tag, o null se non ce n'e' nessuno. */
export function schedaDaDescrizione(descrizione: string | undefined): SchedaGioco | null {
  if (!descrizione) return null;
  const s: SchedaGioco = {};
  for (const riga of testo(descrizione).split(/\n+/)) {
    const m = riga.match(/^\s*([^:]{2,40}):\s*(.+?)\s*$/);
    if (!m) continue;
    const chiave = CHIAVI.find(([, rx]) => rx.test(normale(m[1])))?.[0];
    if (chiave && !s[chiave]) s[chiave] = m[2];
  }
  return Object.keys(s).length ? s : null;
}

/** Descrizione per i motori della pagina del tag, fatta dalla scheda (le righe non finiscono su Google). */
export function descrizioneTag(nome: string, s: SchedaGioco | null): string {
  const dettagli = [s?.genere, s?.anno].filter(Boolean).join(", ");
  return `Guide, trofei e news su ${nome}${dettagli ? ` (${dettagli})` : ""}: tutti gli articoli del Platinatore.`;
}
