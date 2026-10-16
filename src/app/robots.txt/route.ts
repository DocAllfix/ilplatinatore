// robots.txt. Sul sito di prova la scansione resta PERMESSA: un motore che non puo' leggere la pagina
// non vede nemmeno il noindex, e potrebbe indicizzare l'indirizzo nudo se lo trova linkato. Il
// blocco vero e' il noindex su ogni risposta.
// Sul sito vero: le regole di oggi, piu' la riga Sitemap che oggi manca, e senza i Disallow su
// pagine che non esistono (/cookie-policy/, /Redazione-e-contatti/) ne' sulla privacy, che e' in
// sitemap e indicizzabile.

import { noindex, sitoPubblico } from "@/lib/cms/config";

export const revalidate = 3600;

export function GET() {
  const righe = noindex()
    ? ["User-agent: *", "Allow: /"]
    : [
        "User-agent: *",
        "Disallow: /wp-admin/",
        "Allow: /wp-admin/admin-ajax.php",
        "",
        `Sitemap: ${sitoPubblico()}/sitemap_index.xml`,
      ];
  return new Response(righe.join("\n") + "\n", { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
