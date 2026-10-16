// Gli indirizzi di WordPress che non sono percorsi ma parametri, e i suffissi che non hanno una
// pagina propria. Il proxy li porta dove devono andare senza rendere dinamiche le pagine statiche.

import { NextResponse, type NextRequest } from "next/server";

export function proxy(req: NextRequest) {
  const url = req.nextUrl;

  if (url.pathname === "/") {
    // /?s=termine: la ricerca, con l'indirizzo che il visitatore vede invariato
    if (url.searchParams.has("s")) {
      const dest = url.clone();
      dest.pathname = "/ricerca/";
      return NextResponse.rewrite(dest);
    }
    // /?p=123: link breve di WordPress
    const p = url.searchParams.get("p");
    if (p && /^\d{1,9}$/.test(p)) {
      const dest = url.clone();
      dest.pathname = `/vai/${p}/`;
      dest.search = "";
      return NextResponse.rewrite(dest);
    }
  }

  // /AAAA/MM/GG/slug/embed/: la versione incorporabile di WordPress. Si rimanda all'articolo.
  const embed = url.pathname.match(/^(\/\d{4}\/\d{2}\/\d{2}\/[^/]+\/)embed\/?$/);
  if (embed) {
    const dest = url.clone();
    dest.pathname = embed[1];
    dest.search = "";
    return NextResponse.redirect(dest, 301);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/:anno(\\d{4})/:mese/:giorno/:slug/embed/:resto*", "/:anno(\\d{4})/:mese/:giorno/:slug/embed"],
};
