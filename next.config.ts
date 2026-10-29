import type { NextConfig } from "next";

// /wp-content/uploads/... resta lo STESSO indirizzo di oggi sul dominio pubblico (Google Immagini non
// perde niente) e viene inoltrato a img.ilplatinatore.it: il Worker di Cloudflare con le immagini su
// R2, che prende dal CMS (e salva) quelle non ancora copiate (infra/cloudflare/immagini-worker.js).
// Cosi' le immagini non dipendono dal server del CMS. IMMAGINI_URL=<indirizzo del CMS> torna indietro.
const CMS = (process.env.CMS_URL ?? "").replace(/\/+$/, "");
const IMMAGINI = (process.env.IMMAGINI_URL || (CMS ? "https://img.ilplatinatore.it" : "")).replace(/\/+$/, "");

// noindex su tutto finche' SITO_NOINDEX non e' esattamente "0" (vedi src/lib/cms/config.ts)
const NOINDEX = process.env.SITO_NOINDEX !== "0";

const nextConfig: NextConfig = {
  // Tutti gli indirizzi di oggi finiscono con la barra. I file con estensione (/feed/ a parte,
  // /sitemap_index.xml, /ads.txt) restano come sono.
  trailingSlash: true,

  // Modello di cache classico, come il riferimento EvalisDeck: pagine generate al build,
  // `revalidate` e `dynamicParams`. Con Cache Components e Partial Prefetching, il primo visitatore
  // di un articolo nuovo (magari Googlebot) potrebbe ricevere uno scheletro senza testo, e un 404
  // o un 301 deciso dopo l'inizio dello streaming uscirebbe con codice 200.
  cacheComponents: false,

  // niente ottimizzazione immagini di Vercel: ha una quota inclusa e oltre si paga; WordPress
  // genera gia' tutte le misure (srcset)
  images: { unoptimized: true },

  poweredByHeader: false,

  // Solo per il server di sviluppo: il banco della pubblicita' (scripts/qa/annunci.py) apre il codice
  // locale col nome del dominio vero, perche' lo script di HB parte solo li'. Sul sito pubblicato non conta.
  allowedDevOrigins: ["www.ilplatinatore.it"],

  // Processi paralleli del build. Su Vercel il valore predefinito; in locale si abbassa con
  // BUILD_CPUS quando la macchina e' carica (sette processi esauriscono la memoria virtuale).
  experimental: {
    // Il build chiede al CMS ogni articolo: senza limiti Vercel ne generava decine in parallelo e il
    // server del CMS (2 processori) andava in coda, fino a fermarsi (17/10/2026). Al massimo 2 processi
    // per 3 pagine ciascuno: il build dura di piu', il CMS resta in piedi per chi scrive.
    cpus: Number(process.env.BUILD_CPUS) || 2,
    staticGenerationMaxConcurrency: 3,
    staticGenerationRetryCount: 2,
    // Cache di Turbopack fra un build e l'altro SPENTA: il 16/10/2026 Vercel ha pubblicato il CSS
    // del build precedente (stesso nome di file, contenuto vecchio) dopo una modifica a
    // globals.css. Un build piu' lento e' meglio di un sito che pubblica stili vecchi in silenzio.
    turbopackFileSystemCacheForBuild: false,
    // Il CSS (11 KB compressi) dentro l'HTML invece di un file a parte: niente richiesta che blocca
    // il primo disegno (130-170 ms nel PageSpeed del 23/10/2026). Quasi tutti arrivano da Google e
    // leggono una pagina sola, quindi la cache del file separato servirebbe poco. Ok del proprietario.
    inlineCss: true,
  },

  // Tailwind v4 passa dal loader di Turbopack (impostazione del modello di create-next-app 16.4)
  turbopack: {
    rules: {
      "*.css": { loaders: ["@tailwindcss/turbopack"], as: "*.css" },
    },
  },

  async rewrites() {
    return IMMAGINI ? [{ source: "/wp-content/uploads/:percorso*", destination: `${IMMAGINI}/wp-content/uploads/:percorso*` }] : [];
  },

  // indirizzi secondari di WordPress che non hanno una pagina propria
  async redirects() {
    return [
      { source: "/wp-sitemap.xml", destination: "/sitemap_index.xml", statusCode: 301 },
      { source: "/comments/feed/", destination: "/feed/", statusCode: 301 },
      { source: "/tag/:slug/feed/", destination: "/feed/", statusCode: 301 },
      { source: "/category/:slug/feed/", destination: "/feed/", statusCode: 301 },
    ];
  },

  async headers() {
    const sicurezza = [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "X-Frame-Options", value: "SAMEORIGIN" },
    ];
    return [
      { source: "/:percorso*", headers: NOINDEX ? [...sicurezza, { key: "X-Robots-Tag", value: "noindex, nofollow" }] : sicurezza },
      // gli indirizzi di Vercel (ilplatinatore.vercel.app e quelli delle singole pubblicazioni) non vanno
      // mai su Google, nemmeno dopo il passaggio: sarebbero un doppione di www.ilplatinatore.it
      {
        source: "/:percorso*",
        has: [{ type: "host", value: ".*\\.vercel\\.app" }],
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
    ];
  },
};

export default nextConfig;
