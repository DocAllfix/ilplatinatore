import type { Metadata } from "next";
import { ArchivioTermine, metadatiTermine } from "@/components/archivio-termine";
import { tuttiGliAutori } from "@/lib/cms/wp";

export const revalidate = 3600;
export const dynamicParams = true;

export async function generateStaticParams() {
  return (await tuttiGliAutori()).map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: PageProps<"/author/[slug]">): Promise<Metadata> {
  return metadatiTermine("author", (await params).slug);
}

export default async function Pagina({ params }: PageProps<"/author/[slug]">) {
  return <ArchivioTermine tipo="author" slug={(await params).slug} />;
}
