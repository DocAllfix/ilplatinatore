// La home a sezioni (piano 06, modello games.gg chiesto dal proprietario): una decina di file a
// tema che si riempiono da sole con news e guide (regole in Strumenti > Sezioni della home).
// Senza sezioni nel CMS resta l'elenco degli ultimi articoli di oggi. La paginazione /page/N/ non
// cambia: dalla home si continua ad arrivare a tutti gli articoli.

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PaginaArchivio } from "@/components/archivio";
import { Sezioni } from "@/components/home/sezioni";
import { SelettoreVarianti } from "@/components/lab/selettore-varianti";
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
    // Prova del piano 06 (docs/brief/06-home.md): tre varianti, ?v=a|b|c
    <div id="lab" data-v="a">
      <style>{`#lab[data-v="a"] [data-variant]:not([data-variant="a"]),#lab[data-v="b"] [data-variant]:not([data-variant="b"]),#lab[data-v="c"] [data-variant]:not([data-variant="c"]){display:none}`}</style>
      <h1 className="sr-only">Il Platinatore: guide ai trofei, collezionabili e news sui videogiochi</h1>
      {(["a", "b", "c"] as const).map((v) => (
        <div key={v} data-variant={v}>
          <Sezioni sezioni={sezioni} variante={v} />
        </div>
      ))}
      <p className="mt-10 border-t border-linea pt-4">
        <Link href="/page/2/" className="inline-flex min-h-11 items-center font-semibold text-link underline underline-offset-4">
          Tutti gli articoli, dal più recente
        </Link>
      </p>
      <SelettoreVarianti
        sezione="Home"
        varianti={[
          { id: "a", nome: "File" },
          { id: "b", nome: "Locandine" },
          { id: "c", nome: "In evidenza" },
        ]}
      />
    </div>
  );
}
