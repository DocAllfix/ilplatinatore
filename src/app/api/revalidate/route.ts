// Webhook del CMS: a ogni pubblicazione, modifica o cestino il mu-plugin chiama questa rotta e il
// sito si aggiorna in pochi secondi. Adattato da EvalisDeck.
//
// - token nell'header, confronto in tempo costante; senza token valido si risponde 404, non 401,
//   cosi' a chi bussa non si dice nemmeno che la rotta esiste;
// - si invalida l'etichetta "cms" (tutti i dati) e i percorsi toccati.

import { timingSafeEqual } from "node:crypto";
import { revalidatePath, revalidateTag } from "next/cache";
import { ETICHETTA } from "@/lib/cms/wp";

function tokenValido(dato: string | null): boolean {
  const atteso = process.env.CMS_WEBHOOK_TOKEN ?? "";
  if (!atteso || !dato) return false;
  const a = Buffer.from(dato);
  const b = Buffer.from(atteso);
  return a.length === b.length && timingSafeEqual(a, b);
}

const PERCORSO = /^\/\d{4}\/\d{2}\/\d{2}\/[a-z0-9%-]+\/$/;
const SLUG = /^[a-z0-9%-]{1,200}$/;

export async function POST(req: Request) {
  if (!tokenValido(req.headers.get("x-cms-token"))) return new Response("Not found", { status: 404 });

  const corpo = (await req.json().catch(() => ({}))) as {
    percorso?: string;
    tag?: string[];
    categorie?: string[];
  };

  revalidateTag(ETICHETTA, { expire: 0 });
  const percorsi = ["/", "/feed", "/sitemap_index.xml", "/post-sitemap.xml", "/post-sitemap2.xml", "/post-sitemap3.xml"];
  if (corpo.percorso && PERCORSO.test(corpo.percorso)) percorsi.push(corpo.percorso);
  for (const t of corpo.tag ?? []) if (SLUG.test(t)) percorsi.push(`/tag/${t}/`);
  for (const c of corpo.categorie ?? []) if (SLUG.test(c)) percorsi.push(`/category/${c}/`);
  for (const p of percorsi) revalidatePath(p);

  return Response.json({ ok: true, percorsi });
}
