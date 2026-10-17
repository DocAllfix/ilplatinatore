// Webhook del CMS: a ogni pubblicazione, modifica o cestino il mu-plugin chiama questa rotta e il
// sito si aggiorna in pochi secondi. Adattato da EvalisDeck.
//
// - token nell'header, confronto in tempo costante; senza token valido si risponde 404, non 401,
//   cosi' a chi bussa non si dice nemmeno che la rotta esiste;
// - si segna come vecchia l'etichetta "cms" (tutti i dati), con il profilo "max": il visitatore riceve
//   SUBITO l'ultima versione pronta e la pagina si rifa' in sottofondo. Con `expire: 0` (prima) ogni
//   modifica nel CMS buttava via tutto e il primo visitatore aspettava la rigenerazione da zero: con
//   il CMS lento la home e' rimasta senza risposta (17/10/2026). Mai piu' scadenza immediata.

import { timingSafeEqual } from "node:crypto";
import { revalidateTag } from "next/cache";
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

  revalidateTag(ETICHETTA, "max");
  // i percorsi si restituiscono solo per il registro: l'etichetta copre gia' tutte le pagine
  const percorsi = ["/", "/feed", "/sitemap_index.xml", "/post-sitemap.xml", "/post-sitemap2.xml", "/post-sitemap3.xml"];
  if (corpo.percorso && PERCORSO.test(corpo.percorso)) percorsi.push(corpo.percorso);
  for (const t of corpo.tag ?? []) if (SLUG.test(t)) percorsi.push(`/tag/${t}/`);
  for (const c of corpo.categorie ?? []) if (SLUG.test(c)) percorsi.push(`/category/${c}/`);

  return Response.json({ ok: true, percorsi });
}
