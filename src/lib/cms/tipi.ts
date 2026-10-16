// Forme dei dati. Solo i campi che leggiamo davvero dalla REST di WordPress.

export type Termine = { nome: string; slug: string };

export type Autore = { slug: string; nome: string; bio?: string };

/** Articolo pronto per la presentazione. `content` e' HTML gia' sanificato e riscritto. */
export type Articolo = {
  id: number;
  slug: string;
  /** /AAAA/MM/GG/slug/ come oggi: la data e' quella LOCALE di WordPress. */
  percorso: string;
  titolo: string;
  riassunto: string;
  categoria?: Termine;
  categorie: Termine[];
  tag: Termine[];
  autore?: Autore;
  /** ISO 8601 in UTC */
  data: string;
  modificato?: string;
  immagine?: Immagine;
  contenuto: string;
};

export type Immagine = { src: string; srcset?: string; larghezza?: number; altezza?: number; alt: string };

/** Voce leggera per elenchi, sitemap e generateStaticParams. */
export type VoceArticolo = {
  id: number;
  slug: string;
  percorso: string;
  titolo: string;
  data: string;
  modificato?: string;
};

export type Seo = {
  title?: string;
  description?: string;
  canonical: string;
  ogTitle?: string;
  ogDescription?: string;
  ogType?: string;
  ogImage?: { url: string; width?: number; height?: number };
  ogSiteName?: string;
  twitterCard?: string;
  publishedTime?: string;
  modifiedTime?: string;
  /** Schema di Yoast con gli URL gia' riportati sul dominio pubblico. */
  schema?: unknown;
};

// --- risposta REST di WordPress (parziale) ---------------------------------------------------

export type MediaWP = {
  source_url?: string;
  alt_text?: string;
  media_details?: {
    width?: number;
    height?: number;
    sizes?: Record<string, { source_url?: string; width?: number; height?: number }>;
  };
};

export type TermineWP = { id?: number; taxonomy?: string; name?: string; slug?: string };

export type PostWP = {
  id: number;
  slug: string;
  /** data LOCALE, senza fuso: e' quella che finisce nell'indirizzo */
  date: string;
  date_gmt?: string;
  modified_gmt?: string;
  link?: string;
  title?: { rendered?: string };
  excerpt?: { rendered?: string };
  content?: { rendered?: string };
  yoast_head_json?: Record<string, unknown>;
  _embedded?: {
    author?: Array<{ slug?: string; name?: string; description?: string }>;
    "wp:featuredmedia"?: MediaWP[];
    "wp:term"?: TermineWP[][];
  };
};

export type TermineCompletoWP = {
  id: number;
  name: string;
  slug: string;
  count: number;
  description?: string;
  yoast_head_json?: Record<string, unknown>;
};

export type PaginaWP = {
  id: number;
  slug: string;
  date_gmt?: string;
  modified_gmt?: string;
  title?: { rendered?: string };
  content?: { rendered?: string };
  yoast_head_json?: Record<string, unknown>;
};
