// La home a sezioni (piano 06, modello games.gg chiesto dal proprietario): una decina di file a
// tema che si riempiono da sole con news e guide (regole in Strumenti > Sezioni della home).
// Senza sezioni nel CMS resta l'elenco degli ultimi articoli di oggi. La paginazione /page/N/ non
// cambia: dalla home si continua ad arrivare a tutti gli articoli.

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PaginaArchivio } from "@/components/archivio";
import { Sezioni } from "@/components/home/sezioni";
import { metadatiDaSeo } from "@/lib/cms/metadati";
import { paginaArticoli, seoHome } from "@/lib/cms/wp";
import { datiHome } from "@/lib/home-dati";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  return metadatiDaSeo(await seoHome(), { titoloRiserva: "🎮 Il Platinatore" });
}

export default async function Home() {
  const sezioni = await datiHome(new Date());
  if (!sezioni.length) {
    const r = await paginaArticoli({ pagina: 1 });
    if (!r) notFound();
    return <PaginaArchivio titolo="Ultimi articoli" articoli={r.articoli} base="/" pagina={1} pagine={r.pagine} />;
  }
  return (
    // Piano 06 chiuso: locandine della B con una scheda grande ogni due sezioni (scelta del proprietario)
    <>
      <h1 className="sr-only">Il Platinatore: guide ai trofei, collezionabili e news sui videogiochi</h1>
      <Sezioni sezioni={sezioni} />
      <p className="mt-10 border-t border-linea pt-4">
        <Link prefetch={false} href="/page/2/" className="inline-flex min-h-11 items-center font-semibold text-link underline underline-offset-4">
          Tutti gli articoli, dal più recente
        </Link>
      </p>
    </>
  );
}
