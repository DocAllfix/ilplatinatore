// Le immagini del sito da Cloudflare R2 (bucket platinatore-media), su img.ilplatinatore.it.
//
// Il sito pubblico NON mette mai questo indirizzo nelle pagine: le immagini restano
// www.ilplatinatore.it/wp-content/uploads/... (gli stessi indirizzi di oggi, Google Immagini non
// perde niente) e Vercel le prende da qui invece che dal CMS. Cosi' non dipendono dal server Hetzner.
//
// - Chiave su R2 = il percorso senza la prima barra: wp-content/uploads/2026/10/foto.jpg
// - Immagine che su R2 non c'e' ancora (caricata dopo la copia): si prende dal CMS, si serve e si
//   salva su R2. Nessuna copia da ricordare a mano.
// - Niente noindex qui: passerebbe alle immagini sul dominio pubblico e le toglierebbe da Google
//   Immagini (stessa scelta del Caddyfile del CMS).
// - Si conserva a lungo solo un'immagine trovata; un 404 o un errore mai (regola del 17/10/2026).
// - WebP (23/10/2026): per ogni JPG e PNG il server del CMS prepara foto.jpg.webp accanto
//   all'originale (infra/cms/webp/). A chi dichiara di leggere il WebP (Accept: image/webp) si da'
//   quella, ALLO STESSO INDIRIZZO, se pesa meno; agli altri l'originale. `Vary: Accept` dice alle
//   cache che le versioni sono due. La versione WebP non ancora su R2 si prende dal CMS e si salva.

const CONSERVA = "public, max-age=2592000, stale-while-revalidate=86400";
// originale dato a chi legge il WebP perche' il WebP non e' ancora pronto: si riprova presto
const BREVE = "public, max-age=600";
const MAI = "no-store";
const CONVERTIBILE = /\.(jpe?g|png)$/i;

/** La versione WebP: da R2, oppure dal CMS (e allora si salva su R2). Null se non c'e'. */
async function versioneWebp(env, ctx, chiave, percorso, req) {
  const su = await env.BUCKET.get(`${chiave}.webp`, { onlyIf: req.headers });
  if (su) return { oggetto: su, size: su.size, origine: "r2-webp" };
  const daCms = await fetch(`${env.CMS}${percorso}.webp`, { headers: { "User-Agent": "platinatore-immagini" } });
  if (!daCms.ok || !(daCms.headers.get("Content-Type") || "").startsWith("image/webp")) return null;
  const corpo = await daCms.arrayBuffer();
  ctx.waitUntil(env.BUCKET.put(`${chiave}.webp`, corpo, { httpMetadata: { contentType: "image/webp" } }));
  return { corpo, size: corpo.byteLength, origine: "cms-webp" };
}

export default {
  async fetch(req, env, ctx) {
    if (req.method !== "GET" && req.method !== "HEAD") {
      return new Response("Metodo non ammesso", { status: 405, headers: { Allow: "GET, HEAD", "Cache-Control": MAI } });
    }
    const url = new URL(req.url);
    if (!url.pathname.startsWith("/wp-content/uploads/") || url.pathname.endsWith("/")) {
      return new Response("Non trovato", { status: 404, headers: { "Cache-Control": MAI } });
    }
    let chiave;
    try {
      chiave = decodeURIComponent(url.pathname.slice(1));
    } catch {
      return new Response("Indirizzo non valido", { status: 400, headers: { "Cache-Control": MAI } });
    }
    if (chiave.includes("..")) {
      return new Response("Non trovato", { status: 404, headers: { "Cache-Control": MAI } });
    }

    const convertibile = CONVERTIBILE.test(chiave);
    const vuoleWebp = convertibile && (req.headers.get("Accept") || "").includes("image/webp");
    let cacheOriginale = CONSERVA;
    if (vuoleWebp) {
      const [originale, webp] = await Promise.all([env.BUCKET.head(chiave), versioneWebp(env, ctx, chiave, url.pathname, req)]);
      if (webp && (!originale || webp.size < originale.size)) {
        const h = new Headers({ "Content-Type": "image/webp", "Cache-Control": CONSERVA, Vary: "Accept", "X-Origine": webp.origine });
        if (webp.oggetto) {
          h.set("ETag", webp.oggetto.httpEtag);
          if (!("body" in webp.oggetto) || !webp.oggetto.body) return new Response(null, { status: 304, headers: h });
        }
        return new Response(req.method === "HEAD" ? null : (webp.oggetto ? webp.oggetto.body : webp.corpo), { headers: h });
      }
      if (!webp) cacheOriginale = BREVE;
    }

    const oggetto = await env.BUCKET.get(chiave, { onlyIf: req.headers });
    if (oggetto) {
      const h = new Headers();
      oggetto.writeHttpMetadata(h);
      h.set("ETag", oggetto.httpEtag);
      h.set("Cache-Control", cacheOriginale);
      if (convertibile) h.set("Vary", "Accept");
      h.set("X-Origine", "r2");
      // onlyIf non soddisfatto (If-None-Match uguale): l'oggetto arriva senza corpo
      if (!("body" in oggetto) || !oggetto.body) return new Response(null, { status: 304, headers: h });
      return new Response(req.method === "HEAD" ? null : oggetto.body, { headers: h });
    }

    // non c'e' ancora: dal CMS
    const daCms = await fetch(env.CMS + url.pathname, { headers: { "User-Agent": "platinatore-immagini" } });
    const tipo = daCms.headers.get("Content-Type") || "";
    if (!daCms.ok || !/^(image|video|application\/pdf)/.test(tipo)) {
      return new Response("Non trovato", { status: daCms.status === 200 ? 404 : daCms.status, headers: { "Cache-Control": MAI } });
    }
    const corpo = await daCms.arrayBuffer();
    ctx.waitUntil(env.BUCKET.put(chiave, corpo, { httpMetadata: { contentType: tipo } }));
    const h = new Headers({ "Content-Type": tipo, "Cache-Control": cacheOriginale, "X-Origine": "cms" });
    if (convertibile) h.set("Vary", "Accept");
    return new Response(req.method === "HEAD" ? null : corpo, { headers: h });
  },
};
