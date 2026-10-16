import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { PaginaArchivio } from "@/components/archivio";
import { metadatiDaSeo } from "@/lib/cms/metadati";
import { numeroPagina } from "@/lib/cms/pagina";
import { paginaArticoli, seoPerIndirizzo } from "@/lib/cms/wp";

export const revalidate = 3600;
export const dynamicParams = true;

// le pagine successive alla prima si generano alla prima visita e restano in cache
export function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: PageProps<"/page/[n]">): Promise<Metadata> {
  const { n } = await params;
  return metadatiDaSeo(await seoPerIndirizzo(`/page/${n}/`));
}

export default async function PaginaHome({ params }: PageProps<"/page/[n]">) {
  const { n } = await params;
  const pagina = numeroPagina(n);
  if (!pagina) notFound();
  if (pagina === 1) permanentRedirect("/");
  const r = await paginaArticoli({ pagina });
  if (!r) notFound();
  return <PaginaArchivio titolo="Ultimi articoli" articoli={r.articoli} base="/" pagina={pagina} pagine={r.pagine} />;
}
