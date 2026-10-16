import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PaginaArchivio } from "@/components/archivio";
import { metadatiDaSeo } from "@/lib/cms/metadati";
import { paginaArticoli, seoHome } from "@/lib/cms/wp";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  return metadatiDaSeo(await seoHome(), { titoloRiserva: "🎮 Il Platinatore" });
}

export default async function Home() {
  const r = await paginaArticoli({ pagina: 1 });
  if (!r) notFound();
  return <PaginaArchivio titolo="Ultimi articoli" articoli={r.articoli} base="/" pagina={1} pagine={r.pagine} />;
}
