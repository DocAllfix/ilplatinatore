import type { Metadata } from "next";
import { ArchivioTermine, metadatiTermine } from "@/components/archivio-termine";

export const revalidate = 3600;
export const dynamicParams = true;

// le pagine dopo la prima si generano alla prima visita e restano in cache
export function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: PageProps<"/tag/[slug]/page/[n]">): Promise<Metadata> {
  const { slug, n } = await params;
  return metadatiTermine("tag", slug, n);
}

export default async function Pagina({ params }: PageProps<"/tag/[slug]/page/[n]">) {
  const { slug, n } = await params;
  return <ArchivioTermine tipo="tag" slug={slug} n={n} />;
}
