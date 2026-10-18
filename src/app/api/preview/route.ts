// Anteprima delle bozze (Fase 4): il pulsante «Anteprima» di WordPress porta qui (mu-plugin, sezione
// 3) con il token e l'id. Token giusto: si accende la modalita' bozza di Next (un cookie solo per chi
// scrive) e si va alla pagina dell'articolo, che legge la versione non pubblicata con le credenziali
// del CMS. Il token resta solo in questo primo indirizzo: il redirect porta su quello pulito.
// Senza token valido: 404, come il webhook (a chi bussa non si dice che la rotta esiste).

import { timingSafeEqual } from "node:crypto";
import { draftMode } from "next/headers";
import { redirect } from "next/navigation";
import { articoloPerId } from "@/lib/cms/wp";

function tokenValido(dato: string | null): boolean {
  const atteso = process.env.CMS_PREVIEW_TOKEN ?? "";
  if (!atteso || !dato) return false;
  const a = Buffer.from(dato);
  const b = Buffer.from(atteso);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function GET(req: Request) {
  const u = new URL(req.url);
  const id = Number(u.searchParams.get("id"));
  if (!tokenValido(u.searchParams.get("token")) || !Number.isInteger(id) || id <= 0) return new Response("Not found", { status: 404 });
  const r = await articoloPerId(id, { bozza: true });
  if (!r) return new Response("Bozza non trovata", { status: 404 });
  (await draftMode()).enable();
  // una bozza senza slug (mai salvata col titolo) si apre col suo id
  const [, anno, mese, giorno, slug] = r.articolo.percorso.split("/");
  redirect(slug ? r.articolo.percorso : `/${anno}/${mese}/${giorno}/anteprima-${id}/`);
}
