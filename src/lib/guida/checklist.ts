// Checklist dei trofei (PDF 05 e 06) ricavata dalle tabelle della guida che iniziano con la colonna
// «Trofeo». Le tabelle restano al loro posto: nel corpo vengono sostituite da un segnaposto che la
// pagina rimpiazza con il componente interattivo.
//
// Funzioni pure, sull'HTML GIA' SANIFICATO. Le ancore dei titoli nascono qui, nello stesso passaggio
// dell'indice (regola del riferimento: due elenchi calcolati in due posti divergono).

export type VoceTrofeo = { id: string; nome: string; dettagli: Array<{ etichetta: string; valore: string }> };
export type Gruppo = { id: string; titolo: string; voci: VoceTrofeo[] };
export type VoceIndice = { id: string; testo: string };

const testo = (s: string) =>
  s
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#8217;|&rsquo;/g, "’")
    .replace(/&#8220;|&#8221;|&ldquo;|&rdquo;/g, '"')
    .replace(/\s*[–—]\s*/g, "-")
    .replace(/\s+/g, " ")
    .trim();

export function slug(s: string): string {
  return testo(s)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export const SEGNAPOSTO = (id: string) => `<!--checklist:${id}-->`;
export const RX_SEGNAPOSTO = /<!--checklist:([a-z0-9-]+)-->/g;

/**
 * Da' un id a ogni h2 e h3 del corpo (per le ancore e per l'indice) e restituisce l'indice degli h2.
 * Id unici anche se due titoli si somigliano.
 */
export function aggiungiAncore(html: string): { html: string; indice: VoceIndice[] } {
  const usati = new Set<string>();
  const indice: VoceIndice[] = [];
  const out = html.replace(/<(h[23])(\s[^>]*)?>([\s\S]*?)<\/\1>/gi, (_m, tag: string, attr = "", dentro: string) => {
    const t = testo(dentro);
    let id = slug(t) || "sezione";
    for (let n = 2; usati.has(id); n++) id = `${slug(t)}-${n}`;
    usati.add(id);
    if (tag.toLowerCase() === "h2") indice.push({ id, testo: t });
    const senzaId = attr.replace(/\sid="[^"]*"/i, "");
    return `<${tag}${senzaId} id="${id}">${dentro}</${tag}>`;
  });
  return { html: out, indice };
}

function celle(riga: string): string[] {
  return (riga.match(/<t[hd][^>]*>[\s\S]*?<\/t[hd]>/gi) ?? []).map(testo);
}

/**
 * Trova le tabelle di trofei (prima intestazione «Trofeo»), le toglie dal corpo lasciando un
 * segnaposto, e le restituisce come gruppi intitolati con il titolo h2 che le precede.
 */
export function estraiChecklist(html: string): { gruppi: Gruppo[]; corpo: string } {
  const gruppi: Gruppo[] = [];
  const idsVoci = new Set<string>();
  const rx = /(?:<figure[^>]*>\s*)?<table[\s\S]*?<\/table>(?:\s*(?:<figcaption[\s\S]*?<\/figcaption>\s*)?<\/figure>)?/gi;

  const corpo = html.replace(rx, (blocco: string, posizione: number) => {
    const righe = blocco.match(/<tr[\s\S]*?<\/tr>/gi) ?? [];
    if (righe.length < 2) return blocco;
    const intestazioni = celle(righe[0] ?? "");
    if (!/^trofe/i.test(intestazioni[0] ?? "")) return blocco;

    const prima = html.slice(0, posizione);
    const titoli = [...prima.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/gi)];
    const titolo = titoli.length ? testo(titoli[titoli.length - 1][1] ?? "") : "Trofei";
    let id = slug(titolo) || "trofei";
    for (let n = 2; gruppi.some((g) => g.id === id); n++) id = `${slug(titolo)}-${n}`;

    const voci: VoceTrofeo[] = [];
    for (const r of righe.slice(1)) {
      const c = celle(r);
      if (!c[0]) continue;
      let vid = slug(c[0]) || "trofeo";
      for (let n = 2; idsVoci.has(vid); n++) vid = `${slug(c[0])}-${n}`;
      idsVoci.add(vid);
      voci.push({
        id: vid,
        nome: c[0],
        dettagli: c.slice(1).map((valore, i) => ({ etichetta: intestazioni[i + 1] ?? "", valore })).filter((d) => d.valore),
      });
    }
    if (!voci.length) return blocco;
    gruppi.push({ id: `checklist-${id}`, titolo, voci });
    return SEGNAPOSTO(`checklist-${id}`);
  });
  return { gruppi, corpo };
}

export type PezzoCorpo = { html: string } | { gruppo: string } | { correlato: string } | { annuncio: string };

/** Divide il corpo nei pezzi di HTML e nei segnaposto (checklist, correlati, annunci), nell'ordine in cui compaiono. */
export function dividiCorpo(corpo: string): PezzoCorpo[] {
  const out: PezzoCorpo[] = [];
  let ultimo = 0;
  for (const m of corpo.matchAll(/<!--(checklist|correlato|annuncio):([a-z0-9-]+)-->/g)) {
    if (m.index! > ultimo) out.push({ html: corpo.slice(ultimo, m.index) });
    out.push(m[1] === "checklist" ? { gruppo: m[2] } : m[1] === "correlato" ? { correlato: m[2] } : { annuncio: m[2] });
    ultimo = m.index! + m[0].length;
  }
  if (ultimo < corpo.length) out.push({ html: corpo.slice(ultimo) });
  return out;
}
