// Search Console (decisione dell'utente, 17/10/2026): le guide piu' cliccate da Google negli
// ultimi 28 giorni, per «Guide del momento». Non dipende dal consenso ai cookie (00-raccordo, 7).
//
// Accesso in sola lettura con un account di servizio Google: GSC_CREDENZIALI (il JSON della chiave,
// in base64) e GSC_PROPRIETA (es. «sc-domain:ilplatinatore.it»). Senza le due variabili il modulo
// restituisce null e la home usa il ripiego dichiarato. Nessuna libreria: JWT firmato con node:crypto.

import { createSign } from "node:crypto";

/** I 28 giorni da chiedere: Search Console ha circa due giorni di ritardo, quindi si finisce l'altro ieri. */
export function periodo(oggi: Date): { inizio: string; fine: string } {
  const giorno = (d: Date) => d.toISOString().slice(0, 10);
  const fine = new Date(Date.UTC(oggi.getUTCFullYear(), oggi.getUTCMonth(), oggi.getUTCDate() - 2));
  const inizio = new Date(fine.getTime() - 27 * 86_400_000);
  return { inizio: giorno(inizio), fine: giorno(fine) };
}

/** Dalle righe di Search Console agli slug degli articoli (/AAAA/MM/GG/slug/), per clic. */
export function slugDaRighe(righe: Array<{ keys?: string[]; clicks?: number }>): string[] {
  const visti = new Set<string>();
  return [...righe]
    .sort((a, b) => (b.clicks ?? 0) - (a.clicks ?? 0))
    .map((r) => {
      try {
        return new URL(r.keys?.[0] ?? "").pathname.match(/^\/\d{4}\/\d{2}\/\d{2}\/([^/]+)\/?$/)?.[1];
      } catch {
        return undefined;
      }
    })
    .filter((s): s is string => Boolean(s) && !visti.has(s!) && Boolean(visti.add(s!)));
}

const b64url = (s: string | Buffer) => Buffer.from(s).toString("base64url");

async function token(cred: { client_email: string; private_key: string }): Promise<string> {
  const ora = Math.floor(Date.now() / 1000);
  const corpo = `${b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }))}.${b64url(
    JSON.stringify({ iss: cred.client_email, scope: "https://www.googleapis.com/auth/webmasters.readonly", aud: "https://oauth2.googleapis.com/token", iat: ora, exp: ora + 3600 }),
  )}`;
  const firma = createSign("RSA-SHA256").update(corpo).sign(cred.private_key);
  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: `${corpo}.${b64url(firma)}` }),
    cache: "no-store",
  });
  if (!r.ok) throw new Error(`Search Console: token rifiutato (${r.status})`);
  return (await r.json()).access_token;
}

/** Gli slug piu' cliccati nel periodo, o null se Search Console non e' configurata o non risponde. */
export async function piuCliccati(oggi: Date): Promise<{ slug: string[]; periodo: { inizio: string; fine: string } } | null> {
  const grezzo = process.env.GSC_CREDENZIALI;
  const proprieta = process.env.GSC_PROPRIETA;
  if (!grezzo || !proprieta) return null;
  try {
    const cred = JSON.parse(Buffer.from(grezzo, "base64").toString("utf8"));
    const p = periodo(oggi);
    const r = await fetch(`https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(proprieta)}/searchAnalytics/query`, {
      method: "POST",
      headers: { Authorization: `Bearer ${await token(cred)}`, "Content-Type": "application/json" },
      body: JSON.stringify({ startDate: p.inizio, endDate: p.fine, dimensions: ["page"], rowLimit: 100, type: "web" }),
      next: { revalidate: 21600 },
    });
    if (!r.ok) throw new Error(`Search Console: ${r.status}`);
    return { slug: slugDaRighe((await r.json()).rows ?? []), periodo: p };
  } catch (e) {
    // senza dati la home non si rompe: ripiego dichiarato, e l'errore nei registri di Vercel
    console.error(e instanceof Error ? e.message : e);
    return null;
  }
}
