import type { Metadata } from "next";
import { ArchivioTermine, metadatiTermine } from "@/components/archivio-termine";
import { tuttiITermini } from "@/lib/cms/wp";

export const revalidate = 3600;
export const dynamicParams = true;

export async function generateStaticParams() {
  return (await tuttiITermini("tags")).filter((t) => t.count > 0).map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: PageProps<"/tag/[slug]">): Promise<Metadata> {
  return metadatiTermine("tag", (await params).slug);
}

export default async function Pagina({ params }: PageProps<"/tag/[slug]">) {
  return <ArchivioTermine tipo="tag" slug={(await params).slug} />;
}
