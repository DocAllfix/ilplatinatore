// Archivi per data (/2026/, /2026/10/, /2026/10/15/ e le loro /page/N/), come oggi su Aruba:
// noindex, follow (scelta di Yoast), 10 articoli per pagina, 404 se il periodo e' vuoto.
// Si arriva qui solo dal proxy, che riscrive gli indirizzi pubblici (src/lib/archivio-data.ts):
// questo percorso interno, chiamato direttamente, risponde 404.

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PaginaArchivio } from "@/components/archivio";
import { periodo } from "@/lib/archivio-data";
import { robots, titoloPaginato } from "@/lib/cms/metadati";
import { sitoPubblico } from "@/lib/cms/config";
import { paginaArticoli } from "@/lib/cms/wp";

export const revalidate = 3600;
export const dynamicParams = true;

export function generateStaticParams() {
  return [];
}

type Parametri = { params: Promise<{ anno: string; mese: string; giorno: string; n: string }> };

async function dati(params: Parametri["params"]) {
  const p = await params;
  const per = periodo(Number(p.anno), Number(p.mese), Number(p.giorno));
  const pagina = Number(p.n);
  if (!per || !Number.isInteger(pagina) || pagina < 1) notFound();
  const r = await paginaArticoli({ pagina, dopo: per.dopo, prima: per.prima });
  if (!r || !r.articoli.length) notFound();
  return { per, pagina, r };
}

export async function generateMetadata({ params }: Parametri): Promise<Metadata> {
  const { per, pagina, r } = await dati(params);
  const base = `${per.titolo} - 🎮 Il Platinatore`;
  const titolo = pagina > 1 ? titoloPaginato(base, pagina, r.pagine) : base;
  const url = `${sitoPubblico()}${per.base}${pagina > 1 ? `page/${pagina}/` : ""}`;
  return {
    title: { absolute: titolo },
    robots: robots(false),
    openGraph: { title: titolo, url, siteName: "🎮 Il Platinatore", locale: "it_IT", type: "website" },
  };
}

export default async function ArchivioData({ params }: Parametri) {
  const { per, pagina, r } = await dati(params);
  return <PaginaArchivio titolo={per.titolo} articoli={r.articoli} base={per.base} pagina={pagina} pagine={r.pagine} />;
}
