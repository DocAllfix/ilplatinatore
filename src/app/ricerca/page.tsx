// La ricerca. Il visitatore vede /?s=termine come oggi: il proxy riscrive la richiesta qui, cosi'
// la home resta statica (leggere `searchParams` in home la renderebbe dinamica per tutti).
// Sempre noindex, come oggi.

import type { Metadata } from "next";
import { PaginaArchivio } from "@/components/archivio";
import { paginaArticoli } from "@/lib/cms/wp";

export const metadata: Metadata = { title: "Ricerca", robots: { index: false, follow: true } };

export default async function Ricerca({ searchParams }: PageProps<"/ricerca">) {
  const q = (await searchParams).s;
  const termine = (Array.isArray(q) ? q[0] : q)?.trim().slice(0, 100) ?? "";
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
