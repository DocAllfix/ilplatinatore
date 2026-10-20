import type { Metadata } from "next";
import { ArchivioTermine, metadatiTermine } from "@/components/archivio-termine";
import { Hub } from "@/components/hub/hub";
import { sitoPubblico } from "@/lib/cms/config";
import { metadatiDaSeo } from "@/lib/cms/metadati";
import { jsonLd } from "@/lib/cms/seo";
import { seoTermine, tuttiITermini } from "@/lib/cms/wp";
import { descrizioneHub } from "@/lib/hub";
import { titoloHub } from "@/lib/registro-hub";
import { datiHub, type DatiHub } from "@/lib/hub-dati";

export const revalidate = 3600;
export const dynamicParams = true;

export async function generateStaticParams() {
  return (await tuttiITermini("tags")).filter((t) => t.count > 0).map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: PageProps<"/tag/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const d = await datiHub(slug);
  if (!d) return metadatiTermine("tag", slug);
  // Hub (piano 04): titolo e descrizione nuovi al posto di «<Gioco> Archivi» senza descrizione
  // (Fase 0, punto 5), fatti con le sezioni che l'hub ha davvero (registro, 20/10/2026): niente
  // «trofei e Platino» per un gioco che non li ha. Canonical, robots e il resto restano di Yoast.
  const seo = await seoTermine("tag", slug);
  if (!seo) return {};
  const i = seo.title?.lastIndexOf(" -") ?? -1;
  const coda = seo.title && i > -1 ? seo.title.slice(i) : "";
  const titolo = `${titoloHub(d.nome, d.argomenti)}${coda}`;
  const descrizione = descrizioneHub(d.gioco, d.nome, d.argomenti);
  return metadatiDaSeo({ ...seo, title: titolo, ogTitle: titolo, description: descrizione, ogDescription: descrizione });
}

/** CollectionPage con l'elenco delle guide e il gioco come argomento (Fase 0, punto 9). */
function schemaHub(d: DatiHub) {
  const base = sitoPubblico().replace(/\/$/, "");
  const guide = [...(d.platino ? [d.platino] : []), ...d.gruppi.flatMap((g) => g.guide)];
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: titoloHub(d.nome, d.argomenti),
    url: `${base}/tag/${d.slug}/`,
    inLanguage: "it-IT",
    about: {
      "@type": "VideoGame",
      name: d.nome,
      ...(d.gioco.piattaforme.length ? { gamePlatform: d.gioco.piattaforme } : {}),
      ...(d.gioco.uscita ? { datePublished: d.gioco.uscita } : {}),
      ...(d.gioco.sviluppatore ? { author: { "@type": "Organization", name: d.gioco.sviluppatore } } : {}),
      ...(d.gioco.editore ? { publisher: { "@type": "Organization", name: d.gioco.editore } } : {}),
    },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: guide.length,
      itemListElement: guide.map((a, i) => ({ "@type": "ListItem", position: i + 1, url: `${base}${a.percorso}`, name: a.titolo })),
    },
  };
}

export default async function Pagina({ params }: PageProps<"/tag/[slug]">) {
  const { slug } = await params;
  const d = await datiHub(slug);
  if (!d) return <ArchivioTermine tipo="tag" slug={slug} />;
  return (
    // Piano 04 chiuso: variante A «Percorso»
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(schemaHub(d)) }} />
      <Hub d={d} />
    </>
  );
}
