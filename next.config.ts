import type { NextConfig } from "next";

// Il CMS e' l'origine delle immagini: /wp-content/uploads/... resta lo STESSO indirizzo di oggi sul
// dominio pubblico (Google Immagini non perde niente) e viene inoltrato al CMS.
const CMS = (process.env.CMS_URL ?? "").replace(/\/+$/, "");

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

  // Processi paralleli del build. Su Vercel il valore predefinito; in locale si abbassa con
  // BUILD_CPUS quando la macchina e' carica (sette processi esauriscono la memoria virtuale).
  experimental: {
    ...(process.env.BUILD_CPUS ? { cpus: Number(process.env.BUILD_CPUS) } : {}),
    // Cache di Turbopack fra un build e l'altro SPENTA: il 16/10/2026 Vercel ha pubblicato il CSS
    // del build precedente (stesso nome di file, contenuto vecchio) dopo una modifica a
    // globals.css. Un build piu' lento e' meglio di un sito che pubblica stili vecchi in silenzio.
    turbopackFileSystemCacheForBuild: false,
  },

  // Tailwind v4 passa dal loader di Turbopack (impostazione del modello di create-next-app 16.4)
  turbopack: {
    rules: {
      "*.css": { loaders: ["@tailwindcss/turbopack"], as: "*.css" },
    },
  },

  async rewrites() {
    return CMS ? [{ source: "/wp-content/uploads/:percorso*", destination: `${CMS}/wp-content/uploads/:percorso*` }] : [];
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
    ];
  },
};

export default nextConfig;
