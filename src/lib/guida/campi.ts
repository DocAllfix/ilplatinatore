// Campi strutturati della guida (mu-plugin, sezione 5): pl_difficolta, pl_ore_platino, pl_partite,
// pl_mancabili, pl_online, pl_trofei_totali, pl_nota_stime, pl_altri_dati, pl_trofei.
// Li scrive la redazione nell'editor o wpvibe via REST. Il sito li legge PER PRIMI; le tabelle
// nel testo restano il ripiego per gli articoli che non li hanno.
// Funzioni pure.

import type { Gruppo } from "./checklist";
import { slug } from "./checklist";
import { schedaDaVoci, type Scheda } from "./scheda";

type Meta = Record<string, unknown> | undefined;

const str = (v: unknown) => (typeof v === "string" ? v.replace(/\s*[–—]\s*/g, "-").trim() : "");
const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : 0);

/** La scheda dai campi, oppure null se la redazione non li ha compilati. */
export function schedaDaCampi(meta: Meta): (Scheda & { nota?: string }) | null {
  if (!meta) return null;
  const voci = [
    num(meta.pl_difficolta) > 0 && { etichetta: "Difficoltà stimata", valore: `${num(meta.pl_difficolta)}/10` },
    str(meta.pl_ore_platino) && { etichetta: "Tempo per il Platino", valore: str(meta.pl_ore_platino) },
    str(meta.pl_partite) && { etichetta: "Partite minime", valore: str(meta.pl_partite) },
    str(meta.pl_mancabili) && { etichetta: "Trofei mancabili", valore: str(meta.pl_mancabili) },
    str(meta.pl_online) && { etichetta: "Trofei online", valore: str(meta.pl_online) },
    num(meta.pl_trofei_totali) > 0 && { etichetta: "Trofei totali", valore: String(num(meta.pl_trofei_totali)) },
    ...str(meta.pl_altri_dati)
      .split("\n")
      .map((riga) => riga.match(/^\s*([^:]+?)\s*:\s*(.+?)\s*$/))
      .filter((m): m is RegExpMatchArray => Boolean(m))
      .map((m) => ({ etichetta: m[1], valore: m[2] })),
  ].filter(Boolean) as Array<{ etichetta: string; valore: string }>;
  // servono almeno i dati principali: un campo isolato non fa una scheda
  if (!voci.some((v) => /difficolt|tempo/i.test(v.etichetta))) return null;
  const nota = str(meta.pl_nota_stime);
  return { ...schedaDaVoci(voci), ...(nota ? { nota } : {}) };
}

/** I gruppi della checklist dai campi, nell'ordine in cui la redazione li ha scritti. */
export function trofeiDaCampi(meta: Meta): Gruppo[] {
  const righe = Array.isArray(meta?.pl_trofei) ? (meta!.pl_trofei as Array<Record<string, unknown>>) : [];
  const gruppi: Gruppo[] = [];
  const ids = new Set<string>();
  for (const r of righe) {
    const nome = str(r?.nome);
    if (!nome) continue;
    const titolo = str(r?.gruppo) || "Trofei";
    const gid = `checklist-${slug(titolo) || "trofei"}`;
    let g = gruppi.find((x) => x.id === gid);
    if (!g) gruppi.push((g = { id: gid, titolo, voci: [] }));
    let id = slug(nome) || "trofeo";
    for (let n = 2; ids.has(id); n++) id = `${slug(nome)}-${n}`;
    ids.add(id);
    const come = str(r?.come);
    g.voci.push({ id, nome, dettagli: come ? [{ etichetta: "Come ottenerlo", valore: come }] : [] });
  }
  return gruppi;
}

/**
 * I gruppi dai campi prendono il posto delle tabelle di trofei nel testo, nell'ordine: il primo
 * gruppo dove c'era la prima tabella, e cosi' via. Quelli in piu' vanno dopo l'ultimo segnaposto.
 * Restituisce, per ogni segnaposto, i gruppi da mostrare li'.
 */
export function collocaGruppi(segnaposti: string[], gruppi: Gruppo[]): Map<string, Gruppo[]> {
  const out = new Map<string, Gruppo[]>();
  segnaposti.forEach((s, i) => out.set(s, gruppi[i] ? [gruppi[i]] : []));
  if (segnaposti.length && gruppi.length > segnaposti.length) {
    const ultimo = segnaposti[segnaposti.length - 1];
    out.set(ultimo, [...(out.get(ultimo) ?? []), ...gruppi.slice(segnaposti.length)]);
  }
  return out;
}
