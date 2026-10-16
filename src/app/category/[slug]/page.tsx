import type { Metadata } from "next";
import { ArchivioTermine, metadatiTermine } from "@/components/archivio-termine";
import { tuttiITermini } from "@/lib/cms/wp";

export const revalidate = 3600;
export const dynamicParams = true;

export async function generateStaticParams() {
  return (await tuttiITermini("categories")).map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: PageProps<"/category/[slug]">): Promise<Metadata> {
  return metadatiTermine("category", (await params).slug);
}

export default async function Pagina({ params }: PageProps<"/category/[slug]">) {
  return <ArchivioTermine tipo="category" slug={(await params).slug} />;
}
