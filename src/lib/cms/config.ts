// Configurazione del sito. TUTTO da variabili d'ambiente, nessun dominio scritto nel codice: e' cio'
// che permette di riusare questo stesso codice per Quart4 Parete cambiando solo la configurazione.
//
// CMS_URL        dove vive WordPress (https://cms.ilplatinatore.it). Mai mostrato ai visitatori.
// SITO_PUBBLICO  il dominio che il pubblico vede. Oggi il sito di prova su vercel.app.
// SITO_NOINDEX   noindex su tutto il sito. Acceso per difetto: si spegne SOLO scrivendo "0", al
//                passaggio di dominio. Un valore dimenticato o sbagliato lascia il sito fuori da
//                Google, che e' l'errore riparabile; il contrario (una copia indicizzata accanto al
//                sito vero) non lo e'.

function senzaBarra(u: string): string {
  return u.replace(/\/+$/, "");
}

function obbligatoria(nome: string): string {
  const v = process.env[nome];
  if (!v) {
    // Un build senza CMS non deve pubblicare un sito vuoto: si ferma qui, con il nome che manca.
    throw new Error(`Variabile d'ambiente ${nome} mancante.`);
  }
  return v;
}

export function cmsUrl(): string {
  return senzaBarra(obbligatoria("CMS_URL"));
}

/**
 * L'indirizzo del CMS come compare DENTRO i contenuti (link, immagini, schema). Di norma coincide
 * con CMS_URL. Serve diverso solo per le prove in locale attraverso un tunnel SSH, quando si legge
 * da http://localhost:xxxx ma i contenuti parlano di https://cms.ilplatinatore.it.
 */
export function cmsUrlContenuti(): string {
  return senzaBarra(process.env.CMS_URL_CONTENUTI || cmsUrl());
}

export function sitoPubblico(): string {
  return senzaBarra(obbligatoria("SITO_PUBBLICO"));
}

export function noindex(): boolean {
  return process.env.SITO_NOINDEX !== "0";
}

/** Credenziali per leggere le bozze (Application Password). Solo lato server. */
export function credenzialiCms(): string | null {
  const u = process.env.CMS_USER;
  const p = process.env.CMS_APP_PASSWORD;
  if (!u || !p) return null;
  return "Basic " + Buffer.from(`${u}:${p}`).toString("base64");
}

/** Articoli per pagina negli archivi: lo stesso numero di oggi (`posts_per_page` = 10). */
export const PER_PAGINA = 10;
