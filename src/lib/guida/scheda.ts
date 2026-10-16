// Scheda riassuntiva della guida (PDF, sezione 03), ricavata dalla tabella che le guide al platino
// hanno gia' in testa («Requisito | Dettaglio»: trofei, difficolta', ore, partite, mancabili…).
//
// E' un ponte: quando il formato sara' approvato, gli stessi dati arriveranno da campi strutturati
// in WordPress (ACF, leggibili e scrivibili dalla REST per wpvibe). Finche' non ci sono, la scheda si
// legge dall'HTML vero dell'articolo, GIA' SANIFICATO (quello che arriva davvero alla pagina).
//
// Funzioni pure: si provano con un frammento di HTML.

export type VoceScheda = { etichetta: string; valore: string };

export type Scheda = {
  difficolta?: { voto: number; massimo: number };
  tempo?: string;
  partite?: string;
  mancabili?: { numero: number; nomi?: string };
  online?: string;
  trofei?: { totale?: number; platino?: number; oro?: number; argento?: number; bronzo?: number };
  /** Le voci che non hanno un posto fisso, nell'ordine della redazione. */
  altre: VoceScheda[];
};

const testo = (s: string) =>
  s
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#8217;|&rsquo;/g, "’")
    .replace(/\s+/g, " ")
    .trim();

const numero = (s: string) => {
  const m = s.match(/\d+/);
  return m ? Number(m[0]) : undefined;
};

/** Righe di una tabella HTML come coppie di testo (solo le righe con esattamente due celle). */
function righe(tabella: string): VoceScheda[] {
  const out: VoceScheda[] = [];
  for (const r of tabella.match(/<tr[\s\S]*?<\/tr>/gi) ?? []) {
    const celle = (r.match(/<t[hd][^>]*>[\s\S]*?<\/t[hd]>/gi) ?? []).map(testo);
    if (celle.length === 2 && celle[0] && celle[1]) out.push({ etichetta: celle[0], valore: celle[1] });
  }
  return out;
}

/** E' la tabella riassuntiva? Deve parlare almeno di difficolta' e di tempo, oppure dei trofei totali. */
function eRiassuntiva(voci: VoceScheda[]): boolean {
  const e = voci.map((v) => v.etichetta.toLowerCase());
  const difficolta = e.some((x) => x.startsWith("difficolt"));
  const tempo = e.some((x) => /tempo|durata|ore/.test(x));
  const trofei = e.some((x) => x.includes("trofei totali"));
  return (difficolta && tempo) || (trofei && (difficolta || tempo));
}

export function schedaDaVoci(voci: VoceScheda[]): Scheda {
  const s: Scheda = { altre: [] };
  const trofei: NonNullable<Scheda["trofei"]> = {};
  for (const v of voci) {
    const e = v.etichetta.toLowerCase();
    if (e === "requisito" || e === "dettaglio") continue; // intestazione
    if (e.startsWith("difficoltà stimata") || e === "difficoltà") {
      const m = v.valore.match(/(\d+(?:[.,]\d+)?)\s*\/\s*(\d+)/);
      if (m) s.difficolta = { voto: Number(m[1].replace(",", ".")), massimo: Number(m[2]) };
      else s.altre.push(v);
    } else if (/^(tempo|durata)/.test(e)) s.tempo = v.valore;
    else if (e.startsWith("partite")) s.partite = v.valore;
    else if (e.includes("mancabil")) {
      const n = numero(v.valore) ?? 0;
      const nomi = v.valore.replace(/^\s*\d+\s*[,:–-]?\s*/, "").trim();
      s.mancabili = { numero: n, nomi: nomi || undefined };
    } else if (e.includes("online")) s.online = v.valore;
    else if (e === "trofei totali") trofei.totale = numero(v.valore);
    else if (e === "platino") trofei.platino = numero(v.valore);
    else if (e === "oro") trofei.oro = numero(v.valore);
    else if (e === "argento") trofei.argento = numero(v.valore);
    else if (e === "bronzo") trofei.bronzo = numero(v.valore);
    else s.altre.push(v);
  }
  if (Object.keys(trofei).length) s.trofei = trofei;
  return s;
}

/**
 * Cerca la tabella riassuntiva nel corpo. Se c'e', la toglie dal corpo (per non mostrarla due
 * volte) insieme al titolo che la introduce, se la precede direttamente.
 */
export function estraiScheda(html: string): { scheda: Scheda | null; corpo: string } {
  const tabelle = html.match(/(?:<figure[^>]*>\s*)?<table[\s\S]*?<\/table>(?:[\s\S]*?<\/figure>)?/gi) ?? [];
  for (const blocco of tabelle) {
    const voci = righe(blocco);
    if (!eRiassuntiva(voci)) continue;
    const scheda = schedaDaVoci(voci);
    const i = html.indexOf(blocco);
    let inizio = i;
    // il titolo subito prima («… informazioni sul Platino») resterebbe vuoto: si toglie con la tabella
    const prima = html.slice(0, i);
    const h = prima.match(/<h[23][^>]*>[\s\S]*?<\/h[23]>\s*$/i);
    if (h) inizio = i - h[0].length;
    return { scheda, corpo: html.slice(0, inizio) + html.slice(i + blocco.length) };
  }
  return { scheda: null, corpo: html };
}
