import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { PaginaArchivio } from "@/components/archivio";
import { SchemaYoast } from "@/components/schema-yoast";
import { metadatiDaSeo, seoPaginata } from "@/lib/cms/metadati";
import { numeroPagina } from "@/lib/cms/pagina";
import { paginaArticoli, seoHome } from "@/lib/cms/wp";

export const revalidate = 3600;
export const dynamicParams = true;

// le pagine successive alla prima si generano alla prima visita e restano in cache
export function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: PageProps<"/page/[n]">): Promise<Metadata> {
  const pagina = numeroPagina((await params).n) ?? 1;
  const r = await paginaArticoli({ pagina });
  return metadatiDaSeo(seoPaginata(await seoHome(), pagina, r?.pagine ?? 1, { ogTitoloFisso: true }));
}

export default async function PaginaHome({ params }: PageProps<"/page/[n]">) {
  const { n } = await params;
  const pagina = numeroPagina(n);
  if (!pagina) notFound();
  if (pagina === 1) permanentRedirect("/");
  const r = await paginaArticoli({ pagina });
  if (!r) notFound();
  const seo = seoPaginata(await seoHome(), pagina, r.pagine, { ogTitoloFisso: true });
  return (
    <>
      <SchemaYoast schema={seo.schema} />
      <PaginaArchivio titolo="Ultimi articoli" articoli={r.articoli} base="/" pagina={pagina} pagine={r.pagine} />
    </>
  );
}
