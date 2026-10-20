// Misure d'uso degli strumenti (PDF 10: «misurare uso degli strumenti, ritorno alle checklist,
// passaggi verso guide pertinenti e completamento della sfida: non soltanto permanenza sul sito»).
//
// Oggi gli eventi restano NELLA PAGINA: un CustomEvent «platinatore:misura» e una voce in
// `window.dataLayer`, senza nessuna richiesta verso terzi. Il trasporto (contatore aggregato e GA4,
// solo dopo il consenso) arriva in Fase 5 e ascolta questi stessi eventi: i punti di misura non
// cambieranno.

export type NomeMisura =
  | "spunta" // una spunta messa o tolta (trofeo o oggetto)
  | "azzera" // spunte azzerate
  | "filtro_mancanti" // «Solo mancanti» / «Da completare»
  | "riprendi" // «Riprendi» della pillola
  | "come_prenderlo" // dalla tabella dei collezionabili alla soluzione
  | "correlato" // un correlato contestuale aperto
  | "hub_riprendi" // «Riprendi da dove eri» nell'hub
  | "sfida_apertura" // la sfida aperta dal controller luminoso, da qualunque pagina
  | "sfida_inizio" // primo tentativo della sfida del giorno
  | "sfida_fine" // sfida finita, vinta o persa
  | "sfida_rimando" // dalla fine della sfida verso una guida o un hub
  | "home_sezione" // una scheda aperta da una sezione della home
  | "verdetto_hub" // dalla scheda del verdetto di una recensione all'hub del gioco
  | "recensione_hub" // dall'hub alla recensione del gioco
  | "lettura_completa"; // arrivati in fondo a un articolo

export type Misura = { nome: NomeMisura; dati?: Record<string, string | number | boolean> };

declare global {
  interface Window {
    dataLayer?: unknown[];
  }
}

export function misura(nome: NomeMisura, dati?: Misura["dati"]): void {
  if (typeof window === "undefined") return;
  const m: Misura = { nome, ...(dati ? { dati } : {}) };
  window.dispatchEvent(new CustomEvent<Misura>("platinatore:misura", { detail: m }));
  (window.dataLayer ??= []).push({ event: `platinatore_${nome}`, ...dati });
}
