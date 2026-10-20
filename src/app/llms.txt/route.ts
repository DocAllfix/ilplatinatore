// llms.txt (Fase 6): oggi lo genera Yoast su Aruba. Stessa struttura, dagli stessi dati del CMS.
// Il CMS che non risponde e' un errore: resta la versione buona.

import { sitoPubblico } from "@/lib/cms/config";
import { vociLlms } from "@/lib/cms/wp";
import { testoLlms } from "@/lib/llms";

export const revalidate = 86400;

export async function GET() {
  return new Response(testoLlms(sitoPubblico(), await vociLlms()), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
