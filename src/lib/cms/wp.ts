// Unico punto che tocca la rete: lettura della REST API di WordPress. Adattato da EvalisDeck.
//
// - Un errore si PROPAGA: se il CMS non risponde durante il build, il build fallisce e resta online
//   il sito precedente. Pubblicare un sito vuoto e' molto peggio che non pubblicare.
//   (Il riferimento ha un «ammortizzatore» che degrada: qui il sito e' tutto il blog, non serve.)
// - Ritentativi per l'inciampo di rete, tre e poi basta.
// - Cache di Next con l'etichetta "cms": il webhook la invalida a ogni pubblicazione.

import { cmsUrl, credenzialiCms, sitoPubblico, PER_PAGINA } from "./config";
import { mappaPost, mappaVoce, decodificaEntita } from "./mappa";
import { seoDaYoast } from "./seo";
import type { Articolo, PaginaWP, PostWP, Seo, TermineCompletoWP, VoceArticolo } from "./tipi";

const TIMEOUT_MS = 20_000;
const TENTATIVI = 3;
const RIVALIDA_SECONDI = 3600;
export const ETICHETTA = "cms";

type Risposta<T> = { dati: T; totale: number; pagine: number };

async function chiamata<T>(percorso: string, opts: { bozza?: boolean } = {}): Promise<Risposta<T> | null> {
  const url = `${cmsUrl()}/wp-json${percorso}`;
  const intestazioni: Record<string, string> = { Accept: "application/json" };
  if (opts.bozza) {
    const cred = credenzialiCms();
    if (!cred) throw new Error("Anteprima richiesta ma CMS_USER/CMS_APP_PASSWORD mancano.");
    intestazioni.Authorization = cred;
  }

  let ultimo: unknown;
  for (let t = 1; t <= TENTATIVI; t++) {
    try {
      const r = await fetch(url, {
        headers: intestazioni,
        signal: AbortSignal.timeout(TIMEOUT_MS),
        ...(opts.bozza
          ? { cache: "no-store" as const }
          : { next: { revalidate: RIVALIDA_SECONDI, tags: [ETICHETTA] } }),
      });
      if (r.status === 404) return null; // risorsa singola inesistente: non e' un guasto
      if (r.status === 400) {
        // WordPress risponde 400 a una pagina oltre l'ultima (rest_post_invalid_page_number)
        const corpo = (await r.json().catch(() => ({}))) as { code?: string };
        if (corpo.code === "rest_post_invalid_page_number") return null;
        throw new Error(`CMS 400 su ${percorso}`);
      }
      if (!r.ok) throw new Error(`CMS ${r.status} su ${percorso}`);
      return {
        dati: (await r.json()) as T,
        totale: Number(r.headers.get("x-wp-total") ?? 0),
        pagine: Number(r.headers.get("x-wp-totalpages") ?? 0),
      };
    } catch (e) {
      ultimo = e;
      if (t < TENTATIVI) await new Promise((res) => setTimeout(res, 500 * t));
    }
  }
  throw new Error(`CMS irraggiungibile su ${percorso} dopo ${TENTATIVI} tentativi: ${String(ultimo)}`);
}

const ctx = () => ({ cms: cmsUrl(), pubblico: sitoPubblico() });
const EMBED = "_embed=author,wp:featuredmedia,wp:term";

// --- articoli -------------------------------------------------------------------------------

/** Tutti gli articoli pubblicati in forma leggera: per generateStaticParams, sitemap, feed. */
export async function tuttiGliArticoli(): Promise<VoceArticolo[]> {
  const campi = "_fields=id,slug,date,date_gmt,modified_gmt,title";
  const prima = await chiamata<PostWP[]>(`/wp/v2/posts?status=publish&per_page=100&page=1&${campi}`);
  if (!prima) throw new Error("Il CMS non restituisce l'elenco degli articoli.");
  const tutti = [...prima.dati];
  for (let p = 2; p <= prima.pagine; p++) {
    const r = await chiamata<PostWP[]>(`/wp/v2/posts?status=publish&per_page=100&page=${p}&${campi}`);
    tutti.push(...(r?.dati ?? []));
  }
  // Zero articoli e' il modo silenzioso di pubblicare un sito vuoto: ci si ferma.
  if (tutti.length === 0) throw new Error("Il CMS non riporta nessun articolo pubblicato.");
  return tutti.map(mappaVoce);
}

export async function articoloPerSlug(
  slug: string,
  opts: { bozza?: boolean } = {},
): Promise<{ articolo: Articolo; seo: Seo } | null> {
  const stato = opts.bozza ? "publish,draft,pending,future,private" : "publish";
  const r = await chiamata<PostWP[]>(`/wp/v2/posts?${EMBED}&status=${stato}&slug=${encodeURIComponent(slug)}`, opts);
  const p = r?.dati?.[0];
  if (!p) return null;
  const articolo = mappaPost(p, ctx());
  return { articolo, seo: seoDaYoast(p.yoast_head_json, { percorso: articolo.percorso, ...ctx() }) };
}

export async function articoloPerId(id: number, opts: { bozza?: boolean } = {}) {
  const r = await chiamata<PostWP>(`/wp/v2/posts/${id}?${EMBED}`, opts);
  if (!r?.dati) return null;
  const articolo = mappaPost(r.dati, ctx());
  return { articolo, seo: seoDaYoast(r.dati.yoast_head_json, { percorso: articolo.percorso, ...ctx() }) };
}

/** Una pagina d'archivio: 10 articoli, come oggi. `null` se la pagina e' oltre l'ultima. */
export async function paginaArticoli(filtro: {
  pagina: number;
  categoria?: number;
  tag?: number;
  autore?: number;
  ricerca?: string;
}): Promise<{ articoli: Articolo[]; totale: number; pagine: number } | null> {
  const q = new URLSearchParams({ status: "publish", per_page: String(PER_PAGINA), page: String(filtro.pagina) });
  if (filtro.categoria) q.set("categories", String(filtro.categoria));
  if (filtro.tag) q.set("tags", String(filtro.tag));
  if (filtro.autore) q.set("author", String(filtro.autore));
  if (filtro.ricerca) q.set("search", filtro.ricerca);
  const r = await chiamata<PostWP[]>(`/wp/v2/posts?${EMBED}&${q}`);
  if (!r) return null;
  return { articoli: r.dati.map((p) => mappaPost(p, ctx())), totale: r.totale, pagine: r.pagine };
}

/**
 * Se un indirizzo non esiste, dove sta adesso l'articolo (slug o data cambiati).
 * Rotta del mu-plugin. Se il CMS non risponde, meglio un 404 che un errore in faccia.
 */
export async function indirizzoAttuale(slug: string, data: string): Promise<string | null> {
  try {
    const q = new URLSearchParams({ slug, data });
    const r = await chiamata<{ percorso?: string } | null>(`/platinatore/v1/indirizzo-precedente?${q}`);
    return r?.dati?.percorso ?? null;
  } catch {
    return null;
  }
}

// --- tassonomie, autori, pagine ------------------------------------------------------------

export async function tuttiITermini(tassonomia: "categories" | "tags"): Promise<TermineCompletoWP[]> {
  const out: TermineCompletoWP[] = [];
  for (let p = 1; ; p++) {
    const r = await chiamata<TermineCompletoWP[]>(`/wp/v2/${tassonomia}?per_page=100&page=${p}&hide_empty=false`);
    out.push(...(r?.dati ?? []));
    if (!r || p >= r.pagine) break;
  }
  return out.map((t) => ({ ...t, name: decodificaEntita(t.name) }));
}

export async function terminePerSlug(tassonomia: "categories" | "tags", slug: string) {
  const r = await chiamata<TermineCompletoWP[]>(`/wp/v2/${tassonomia}?slug=${encodeURIComponent(slug)}`);
  const t = r?.dati?.[0];
  return t ? { ...t, name: decodificaEntita(t.name) } : null;
}

export async function tuttiGliAutori(): Promise<Array<{ id: number; slug: string; name: string }>> {
  // `has_published_posts`, non `who=authors`: quest'ultimo pretende l'autenticazione (riferimento)
  const r = await chiamata<Array<{ id: number; slug: string; name: string }>>(
    "/wp/v2/users?per_page=100&has_published_posts=true&_fields=id,slug,name",
  );
  return r?.dati ?? [];
}

export async function paginaPerSlug(slug: string): Promise<{ pagina: PaginaWP; seo: Seo } | null> {
  const r = await chiamata<PaginaWP[]>(`/wp/v2/pages?slug=${encodeURIComponent(slug)}&status=publish`);
  const p = r?.dati?.[0];
  if (!p) return null;
  return { pagina: p, seo: seoDaYoast(p.yoast_head_json, { percorso: `/${p.slug}/`, ...ctx() }) };
}

export async function tutteLePagine(): Promise<PaginaWP[]> {
  const r = await chiamata<PaginaWP[]>("/wp/v2/pages?per_page=100&status=publish&_fields=id,slug,modified_gmt");
  return r?.dati ?? [];
}

/**
 * I metadati che Yoast calcolerebbe per un indirizzo qualsiasi (home, archivi, paginazione).
 * Rotta `yoast/v1/get_head`: da' titoli come «Crimson Desert Archivi - Pagina 2 di 31 - …»
 * identici a quelli di oggi.
 */
export async function seoPerIndirizzo(percorso: string): Promise<Seo> {
  const r = await chiamata<{ json?: Record<string, unknown> }>(
    `/yoast/v1/get_head?url=${encodeURIComponent(`${cmsUrl()}${percorso}`)}`,
  );
  return seoDaYoast(r?.dati?.json, { percorso, ...ctx() });
}
