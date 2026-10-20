// I dati strutturati di Yoast (gia' riportati sul dominio pubblico da seoDaYoast), come oggi su
// ogni pagina: home, archivi, autori, pagine, archivi per data. Gli articoli li scrivono da se'.

import { jsonLd } from "@/lib/cms/seo";

export function SchemaYoast({ schema }: { schema: unknown }) {
  if (!schema) return null;
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(schema) }} />;
}
