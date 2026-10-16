// Un solo segmento: /privacy-policy/ (pagine WordPress) oppure /slug-di-un-articolo/ senza data.
// Oggi WordPress rimanda il secondo all'articolo con un 301: link incollati a mano, condivisioni e
// citazioni lo usano, quindi si conserva.

import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { metadatiDaSeo } from "@/lib/cms/metadati";
import { decodificaEntita } from "@/lib/cms/mappa";
import { riportaSuPubblico } from "@/lib/cms/seo";
import { sanificaHtml } from "@/lib/cms/sanitize";
import { cmsUrlContenuti, sitoPubblico } from "@/lib/cms/config";
import { articoloPerSlug, paginaPerSlug, tutteLePagine } from "@/lib/cms/wp";

export const revalidate = 3600;
export const dynamicParams = true;

export async function generateStaticParams() {
  return (await tutteLePagine()).map((p) => ({ primo: p.slug }));
}

async function risolvi(primo: string) {
  const slug = decodeURIComponent(primo).toLowerCase();
  const pagina = await paginaPerSlug(slug);
  if (pagina) {
    if (slug !== primo) permanentRedirect(`/${slug}/`);
    return pagina;
  }
  const articolo = await articoloPerSlug(slug);
  if (articolo) permanentRedirect(articolo.articolo.percorso);
  notFound();
}

export async function generateMetadata({ params }: PageProps<"/[primo]">): Promise<Metadata> {
  const { pagina, seo } = await risolvi((await params).primo);
  return metadatiDaSeo(seo, { titoloRiserva: decodificaEntita(pagina.title?.rendered) });
}

export default async function PaginaStatica({ params }: PageProps<"/[primo]">) {
  const { pagina } = await risolvi((await params).primo);
  const html = sanificaHtml(riportaSuPubblico(pagina.content?.rendered ?? "", cmsUrlContenuti(), sitoPubblico()));
  return (
    <article>
      <h1 className="text-3xl font-bold">{decodificaEntita(pagina.title?.rendered)}</h1>
      <div className="contenuto mt-6" dangerouslySetInnerHTML={{ __html: html }} />
    </article>
  );
}
