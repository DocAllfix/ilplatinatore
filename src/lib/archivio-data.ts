// Archivi per data di WordPress (/2026/, /2026/10/, /2026/10/15/, piu' /page/N/), come oggi:
// noindex, follow, 10 articoli per pagina, titoli di Yoast. Funzioni pure: il proxy decide qui se
// riscrivere verso la pagina interna o rimandare come fa WordPress (mese 13 → anno, giorno 32 → mese).

const MESI = ["Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno", "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"];

const RX = /^\/(\d{4})\/(?:(\d{1,2})\/(?:(\d{1,2})\/)?)?(?:page\/(\d{1,4})\/)?$/;

export type Esito = { tipo: "riscrivi"; interno: string } | { tipo: "rimanda"; a: string } | null;

const due = (n: number) => String(n).padStart(2, "0");

/** Che cosa fare di un percorso: null se non e' un archivio per data. */
export function esitoData(percorso: string): Esito {
  const m = percorso.match(RX);
  if (!m) return null;
  const anno = Number(m[1]);
  const mese = m[2] ? Number(m[2]) : 0;
  const giorno = m[3] ? Number(m[3]) : 0;
  const pagina = m[4] ? Number(m[4]) : 1;
  if (anno < 1970) return null;
  if (m[4] && pagina < 2) return { tipo: "rimanda", a: percorso.replace(/page\/\d+\/$/, "") };
  if (mese && (mese < 1 || mese > 12)) return { tipo: "rimanda", a: `/${m[1]}/` };
  if (giorno) {
    const ultimo = new Date(Date.UTC(anno, mese, 0)).getUTCDate();
    if (giorno < 1 || giorno > ultimo) return { tipo: "rimanda", a: `/${m[1]}/${m[2]}/` };
  }
  return { tipo: "riscrivi", interno: `/archivio-data/${anno}/${mese}/${giorno}/${pagina}/` };
}

export type Periodo = { titolo: string; base: string; dopo: string; prima: string };

/** Il periodo di un archivio: titolo di Yoast, indirizzo pubblico e limiti per la REST (ora del sito). */
export function periodo(anno: number, mese: number, giorno: number): Periodo | null {
  if (!Number.isInteger(anno) || anno < 1970 || mese < 0 || mese > 12 || giorno < 0 || giorno > 31 || (giorno && !mese)) return null;
  const iso = (d: Date) => d.toISOString().slice(0, 19);
  if (!mese)
    return { titolo: `${anno}`, base: `/${anno}/`, dopo: iso(new Date(Date.UTC(anno, 0, 1) - 1000)), prima: iso(new Date(Date.UTC(anno + 1, 0, 1))) };
  if (!giorno)
    return {
      titolo: `${MESI[mese - 1]} ${anno}`,
      base: `/${anno}/${due(mese)}/`,
      dopo: iso(new Date(Date.UTC(anno, mese - 1, 1) - 1000)),
      prima: iso(new Date(Date.UTC(anno, mese, 1))),
    };
  return {
    titolo: `${MESI[mese - 1]} ${giorno}, ${anno}`,
    base: `/${anno}/${due(mese)}/${due(giorno)}/`,
    dopo: iso(new Date(Date.UTC(anno, mese - 1, giorno) - 1000)),
    prima: iso(new Date(Date.UTC(anno, mese - 1, giorno + 1))),
  };
}
