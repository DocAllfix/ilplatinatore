// La sfida di oggi in JSON, per la finestra che si apre da ogni pagina (piano 07). Statica e
// rigenerata ogni 5 minuti come la pagina /sfida/: mai `no-store` (incidente del 17/10/2026).

import { giornoRoma } from "@/lib/sfida";
import { datiSfida } from "@/lib/sfida-dati";

export const revalidate = 300;

export async function GET() {
  return Response.json(await datiSfida(giornoRoma(new Date())));
}
