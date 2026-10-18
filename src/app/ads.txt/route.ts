// ads.txt (Fase 5): lo stesso file di oggi, byte per byte (Advanced Ads aggiunge l'intestazione e
// l'a-capo finale). Il testo sta nel CMS (mu-plugin, sezione 9): si aggiorna senza pubblicare.

import { testoAdsTxt } from "@/lib/cms/wp";

export const revalidate = 3600;

export async function GET() {
  const testo = await testoAdsTxt();
  return new Response(`# Advanced Ads ads.txt\n${testo}\n`, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
