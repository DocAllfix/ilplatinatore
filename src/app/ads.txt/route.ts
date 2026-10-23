// ads.txt (Fase 5): lo stesso file di oggi, byte per byte. Il file intero sta nel CMS (mu-plugin,
// sezione 9; si aggiorna da Strumenti > ads.txt senza pubblicare) e si serve cosi' com'e', senza
// aggiungere niente.

import { fileAdsTxt } from "@/lib/cms/wp";

export const revalidate = 3600;

export async function GET() {
  return new Response(await fileAdsTxt(), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
