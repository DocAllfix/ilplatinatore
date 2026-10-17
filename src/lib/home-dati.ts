// Le sezioni della home dal CMS, ognuna riempita dalla sua regola (piano 06). Solo lato server.
// Ogni sezione dichiara il suo criterio in pagina, come chiede il PDF (02).

import type { Articolo } from "./cms/tipi";
import { articoliModificati, articoliPerSlug, sezioniHome, tagDegliUltimi, terminePerSlug, tuttiITermini, type SezioneHome } from "./cms/wp";
import { piuCliccati } from "./gsc";
import { giochiDelMomento, paroleDa, perModifica, senzaRipetizioni, titoloContiene } from "./home";
import { giornoRoma, NOMI_FORMATO, numeroSfida } from "./sfida";
import { datiSfida } from "./sfida-dati";

// se ne chiedono 20 per sezione, se ne mostrano 12: tolti i doppioni la fila resta piena
const PER_SEZIONE = 20;
const IN_FILA = 12;

export type SfidaInBreve = { numero: number; giorno: number; formato: keyof typeof NOMI_FORMATO; nome: string; invito: string; immagine?: Articolo["immagine"] };
export type SezioneDati =
  | { tipo: "articoli"; titolo: string; criterio: string; voci: Articolo[]; tutti?: { testo: string; href: string } }
  | { tipo: "sfida"; titolo: string; sfida: SfidaInBreve };

const dataBreve = (iso: string) =>
  new Intl.DateTimeFormat("it-IT", { day: "numeric", month: "long", timeZone: "UTC" }).format(new Date(`${iso}T00:00:00Z`));
const giorniFa = (oggi: Date, n: number) => new Date(oggi.getTime() - n * 86_400_000);

async function sezione(s: SezioneHome, oggi: Date, tag: Awaited<ReturnType<typeof tuttiITermini>>): Promise<SezioneDati | null> {
  const meta = (t: (typeof tag)[number], k: string) => (typeof t.meta?.[k] === "string" ? (t.meta[k] as string) : "");

  if (s.regola === "piu-letti") {
    const gsc = await piuCliccati(oggi);
    if (gsc?.slug.length) {
      const voci = (await articoliPerSlug(gsc.slug.slice(0, 40))).slice(0, PER_SEZIONE);
      if (voci.length)
        return { tipo: "articoli", titolo: s.titolo, voci, criterio: `I più cliccati da Google dal ${dataBreve(gsc.periodo.inizio)} al ${dataBreve(gsc.periodo.fine)}.` };
    }
    // ripiego dichiarato finche' Search Console non e' collegata
    const voci = await articoliModificati(`modified_after=${encodeURIComponent(giorniFa(oggi, 14).toISOString())}`, PER_SEZIONE);
    return voci.length ? { tipo: "articoli", titolo: s.titolo, voci, criterio: "In attesa dei dati di Search Console: per ora gli articoli aggiornati negli ultimi 14 giorni." } : null;
  }

  if (s.regola === "giochi-momento") {
    const giorni = Number(s.parametro) || 30;
    const giochi = new Set(tag.filter((t) => meta(t, "pl_sfida") === "1" || meta(t, "pl_gioco") === "1").map((t) => t.id));
    const scelti = giochiDelMomento(await tagDegliUltimi(giorniFa(oggi, giorni)), giochi, 6);
    if (!scelti.length) return null;
    const nomi = scelti.map((id) => tag.find((t) => t.id === id)?.name).filter(Boolean);
    const voci = await articoliModificati(`tags=${scelti.join(",")}`, PER_SEZIONE);
    return { tipo: "articoli", titolo: s.titolo, voci, criterio: `I giochi con più articoli negli ultimi ${giorni} giorni: ${nomi.join(", ")}.` };
  }

  if (s.regola === "tag-sezione") {
    const chiave = s.parametro.trim().toLowerCase();
    const ids = tag
      .filter((t) => meta(t, "pl_sezioni").toLowerCase().split(",").map((x) => x.trim()).includes(chiave))
      .map((t) => t.id);
    if (!ids.length) return null;
    const voci = await articoliModificati(`tags=${ids.join(",")}`, PER_SEZIONE);
    return voci.length ? { tipo: "articoli", titolo: s.titolo, voci, criterio: "News e guide di questi giochi, dall'ultima aggiornata." } : null;
  }

  if (s.regola === "titolo") {
    const parole = paroleDa(s.parametro);
    if (!parole.length) return null;
    // la ricerca di WordPress guarda anche il testo: se ne chiedono tanti e si tengono quelli col titolo giusto
    const liste = await Promise.all(parole.map((p) => articoliModificati(`search=${encodeURIComponent(p)}`, 100)));
    const voci = perModifica(liste.map((l) => l.filter((a) => titoloContiene(a.titolo, parole))), PER_SEZIONE);
    return voci.length ? { tipo: "articoli", titolo: s.titolo, voci, criterio: "Dall'ultimo aggiornato." } : null;
  }

  if (s.regola === "categoria") {
    const c = await terminePerSlug("categories", s.parametro.trim());
    if (!c) return null;
    const voci = await articoliModificati(`categories=${c.id}`, PER_SEZIONE);
    return voci.length
      ? { tipo: "articoli", titolo: s.titolo, voci, criterio: "Dall'ultimo aggiornato.", tutti: { testo: `Tutte: ${c.name}`, href: `/category/${c.slug}/` } }
      : null;
  }

  if (s.regola === "sfida") {
    const g = giornoRoma(oggi);
    const d = await datiSfida(g);
    const f = d.oggi;
    const sf = f ? d.sfide[f] : undefined;
    if (!f || !sf) return null;
    const invito =
      sf.formato === "gioco"
        ? "Un'immagine a quadretti che si schiarisce a ogni tentativo. Che gioco è?"
        : sf.formato === "trofeo"
          ? `Un trofeo di ${sf.gioco} da indovinare dagli indizi.`
          : "Un classico da riconoscere da anno, console, studio, genere e serie.";
    return {
      tipo: "sfida",
      titolo: s.titolo,
      sfida: { numero: numeroSfida(g), giorno: g, formato: f, nome: NOMI_FORMATO[f], invito, immagine: sf.formato === "gioco" ? sf.immagine : undefined },
    };
  }
  return null;
}

export async function datiHome(oggi: Date): Promise<SezioneDati[]> {
  const [elenco, tag] = await Promise.all([sezioniHome(), tuttiITermini("tags")]);
  const tutte = (await Promise.all(elenco.map((s) => sezione(s, oggi, tag).catch(() => null)))).filter((x): x is SezioneDati => x !== null);
  const voci = senzaRipetizioni(tutte.map((s) => (s.tipo === "articoli" ? s.voci : [])), 4, IN_FILA);
  return tutte.map((s, i) => (s.tipo === "articoli" ? { ...s, voci: voci[i] } : s));
}
