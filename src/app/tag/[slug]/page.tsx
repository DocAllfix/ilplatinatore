import type { Metadata } from "next";
import { ArchivioTermine, metadatiTermine } from "@/components/archivio-termine";
import { Hub } from "@/components/hub/hub";
import { SelettoreVarianti } from "@/components/lab/selettore-varianti";
import { sitoPubblico } from "@/lib/cms/config";
import { metadatiDaSeo } from "@/lib/cms/metadati";
import { jsonLd } from "@/lib/cms/seo";
import { seoTermine, tuttiITermini } from "@/lib/cms/wp";
import { descrizioneHub } from "@/lib/hub";
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
  // (Fase 0, punto 5). Canonical, robots e il resto restano quelli di Yoast.
  const seo = await seoTermine("tag", slug);
  if (!seo) return {};
  const i = seo.title?.lastIndexOf(" -") ?? -1;
  const coda = seo.title && i > -1 ? seo.title.slice(i) : "";
  const titolo = `${d.nome}: guide, trofei e Platino${coda}`;
  const descrizione = descrizioneHub(d.gioco, d.nome);
  return metadatiDaSeo({ ...seo, title: titolo, ogTitle: titolo, description: descrizione, ogDescription: descrizione });
}

/** CollectionPage con l'elenco delle guide e il gioco come argomento (Fase 0, punto 9). */
function schemaHub(d: DatiHub) {
  const base = sitoPubblico().replace(/\/$/, "");
  const guide = [...(d.platino ? [d.platino] : []), ...d.gruppi.flatMap((g) => g.guide)];
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${d.nome}: guide, trofei e Platino`,
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
    // Prova del piano 04 (docs/brief/04-hub-gioco.md): tre varianti, ?v=a|b|c
    <div id="lab" data-v="a">
      <style>{`#lab[data-v="a"] [data-variant]:not([data-variant="a"]),#lab[data-v="b"] [data-variant]:not([data-variant="b"]),#lab[data-v="c"] [data-variant]:not([data-variant="c"]){display:none}`}</style>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(schemaHub(d)) }} />
      <Hub d={d} />
      <SelettoreVarianti
        sezione="Hub"
        varianti={[
          { id: "a", nome: "Percorso" },
          { id: "b", nome: "Indice" },
          { id: "c", nome: "Pannello" },
        ]}
      />
    </div>
  );
}
