// La ricerca. Il visitatore vede /?s=termine come oggi: il proxy riscrive la richiesta qui, cosi'
// la home resta statica (leggere `searchParams` in home la renderebbe dinamica per tutti).
// Sempre noindex, come oggi.

import type { Metadata } from "next";
import { PaginaArchivio } from "@/components/archivio";
import { robotsConDopo } from "@/lib/cms/metadati";
import { paginaArticoli } from "@/lib/cms/wp";

function termineDa(q: string | string[] | undefined): string {
  return (Array.isArray(q) ? q[0] : q)?.trim().slice(0, 100) ?? "";
}

// il titolo di Yoast di oggi: «Hai cercato <termine> - 🎮 Il Platinatore»
export async function generateMetadata({ searchParams }: PageProps<"/ricerca">): Promise<Metadata> {
  const termine = termineDa((await searchParams).s);
  return { title: { absolute: `Hai cercato ${termine} - 🎮 Il Platinatore` }, ...robotsConDopo(false) };
}

export default async function Ricerca({ searchParams }: PageProps<"/ricerca">) {
  const termine = termineDa((await searchParams).s);
  const r = termine ? await paginaArticoli({ pagina: 1, ricerca: termine }) : null;
  return (
    <PaginaArchivio
      titolo={termine ? `Hai cercato ${termine}` : "Ricerca"}
      articoli={r?.articoli ?? []}
      base={`/?s=${encodeURIComponent(termine)}&`}
      pagina={1}
      pagine={1}
    />
  );
}
