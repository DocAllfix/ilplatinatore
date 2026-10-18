// La home a sezioni (piano 06, modello games.gg chiesto dal proprietario): una decina di file a
// tema che si riempiono da sole con news e guide (regole in Strumenti > Sezioni della home).
// Senza sezioni nel CMS resta l'elenco degli ultimi articoli di oggi. La paginazione /page/N/ non
// cambia: dalla home si continua ad arrivare a tutti gli articoli.

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PaginaArchivio } from "@/components/archivio";
import { BottoneAcido } from "@/components/bottone-acido";
import { Sezioni } from "@/components/home/sezioni";
import { Hero, type VoceHero } from "@/components/home/hero";
import { eNews } from "@/components/carta-articolo";
import { metadatiDaSeo } from "@/lib/cms/metadati";
import { paginaArticoli, seoHome } from "@/lib/cms/wp";
import { datiHome } from "@/lib/home-dati";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  return metadatiDaSeo(await seoHome(), { titoloRiserva: "🎮 Il Platinatore" });
}

export default async function Home() {
  const { hero, sezioni } = await datiHome(new Date());
  const voci: VoceHero[] = hero.map((a) => ({
    id: a.id,
    titolo: a.titolo,
    percorso: a.percorso,
    immagine: a.immagine ? { src: a.immagine.src, srcset: a.immagine.srcset } : undefined,
    gioco: a.tag[0]?.nome,
    news: eNews(a),
  }));
  if (!sezioni.length) {
    const r = await paginaArticoli({ pagina: 1 });
    if (!r) notFound();
    return <PaginaArchivio titolo="Ultimi articoli" articoli={r.articoli} base="/" pagina={1} pagine={r.pagine} />;
  }
  return (
    // Piano 06 chiuso: locandine della B con una scheda grande ogni due sezioni; piano 07 chiuso:
    // indicatore delle file sfumato (scelte del proprietario)
    <>
      <h1 className="sr-only">Il Platinatore: guide ai trofei, collezionabili e news sui videogiochi</h1>
      <Hero voci={voci} />
      <Sezioni sezioni={sezioni} riferimento={hero[0] ? new Date(hero[0].data).getTime() : 0} />
      <p className="mt-10 flex justify-center border-t border-linea pt-6">
        <BottoneAcido href="/page/2/">Tutti gli articoli, dal più recente</BottoneAcido>
      </p>
    </>
  );
}
