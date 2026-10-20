// Gli indirizzi di WordPress che non sono percorsi ma parametri, e i suffissi che non hanno una
// pagina propria. Il proxy li porta dove devono andare senza rendere dinamiche le pagine statiche.

import { NextResponse, type NextRequest } from "next/server";
import { esitoData } from "@/lib/archivio-data";

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

  // archivi per data (/2026/10/ ...): riscritti verso la pagina interna, o rimandati come WordPress
  const data = esitoData(url.pathname);
  if (data) {
    const dest = url.clone();
    dest.search = "";
    if (data.tipo === "rimanda") {
      dest.pathname = data.a;
      return NextResponse.redirect(dest, 301);
    }
    dest.pathname = data.interno;
    return NextResponse.rewrite(dest);
  }
  // la pagina interna non ha un indirizzo pubblico
  if (url.pathname.startsWith("/archivio-data/")) {
    const dest = url.clone();
    dest.pathname = "/archivio-data-non-esiste/";
    return NextResponse.rewrite(dest);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/:anno(\\d{4})/:mese/:giorno/:slug/embed/:resto*",
    "/:anno(\\d{4})/:mese/:giorno/:slug/embed",
    // archivi per data, con e senza /page/N/
    "/:anno(\\d{4})",
    "/:anno(\\d{4})/page/:n",
    "/:anno(\\d{4})/:mese(\\d{1,2})",
    "/:anno(\\d{4})/:mese(\\d{1,2})/page/:n",
    "/:anno(\\d{4})/:mese(\\d{1,2})/:giorno(\\d{1,2})",
    "/:anno(\\d{4})/:mese(\\d{1,2})/:giorno(\\d{1,2})/page/:n",
    "/archivio-data/:resto*",
  ],
};
