// Le parole di oggi in JSON, per la scheda «La parola di oggi» in fondo a ogni articolo (variante A
// scelta dal proprietario, 21/10/2026). Statica e rigenerata ogni 5 minuti come /sfida/parola/:
// le pagine degli articoli restano statiche e la parola e' sempre quella del giorno. Mai `no-store`.

import { datiParola } from "@/lib/parola-dati";
import { giornoRoma } from "@/lib/sfida";

export const revalidate = 300;

export async function GET() {
  return Response.json(await datiParola(giornoRoma(new Date())));
}
