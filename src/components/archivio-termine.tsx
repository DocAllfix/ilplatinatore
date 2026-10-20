// Archivi di categoria, tag e autore, con la paginazione di oggi: /category/<slug>/page/N/.
// Una logica sola per i tre, cosi' un correttivo vale ovunque.

import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { GrigliaArticoli, PaginaArchivio, Paginazione } from "./archivio";
import { SchedaGioco } from "./gioco/scheda-gioco";
import { SchemaYoast } from "./schema-yoast";
import { descrizioneTag, schedaDaDescrizione } from "@/lib/scheda-gioco";
import { immagineSchema, metadatiDaSeo, seoPaginata } from "@/lib/cms/metadati";
import { conImmaginePrincipale } from "@/lib/cms/seo";
import { numeroPagina } from "@/lib/cms/pagina";
import { paginaArticoli, registroHub, seoTermine, terminePerSlug, tuttiGliAutori } from "@/lib/cms/wp";
import { eHub } from "@/lib/registro-hub";
import type { Seo } from "@/lib/cms/tipi";

export type Tipo = "category" | "tag" | "author";

type Termine = { id: number; nome: string; descrizione?: string; gioco?: boolean };

async function termine(tipo: Tipo, slug: string): Promise<Termine | null> {
  if (tipo === "author") {
    const a = (await tuttiGliAutori()).find((x) => x.slug === slug);
    return a ? { id: a.id, nome: a.name } : null;
  }
  const t = await terminePerSlug(tipo === "category" ? "categories" : "tags", slug);
  if (!t) return null;
  // ogni tag e' un gioco, tranne gli esclusi del registro (scelta del proprietario, 20/10/2026)
  const gioco = tipo === "tag" && eHub(slug, await registroHub());
  return { id: t.id, nome: t.name, descrizione: t.description || undefined, gioco };
}

function base(tipo: Tipo, slug: string) {
  return `/${tipo}/${slug}/`;
}

function filtroDi(tipo: Tipo, id?: number) {
  return tipo === "category" ? { categoria: id } : tipo === "tag" ? { tag: id } : { autore: id };
}

/**
 * Yoast della pagina 1 (allegato alla REST del termine), ricalcolato per la pagina N come fa Yoast;
 * nello schema l'immagine principale e' quella del primo articolo della pagina.
 */
async function seoArchivio(tipo: Tipo, slug: string, pagina: number): Promise<Seo | null> {
  const seo1 = await seoTermine(tipo, slug);
  if (!seo1) return null;
  const t = await termine(tipo, slug);
  const r = await paginaArticoli({ pagina, ...filtroDi(tipo, t?.id) });
  const seo = seoPaginata(seo1, pagina, r?.pagine ?? 1);
  return { ...seo, schema: conImmaginePrincipale(seo.schema, seo.canonical ?? "", immagineSchema(r?.articoli[0])) };
}

export async function metadatiTermine(tipo: Tipo, slug: string, n?: string): Promise<Metadata> {
  const pagina = n === undefined ? 1 : (numeroPagina(n) ?? 1);
  const seo = await seoArchivio(tipo, slug, pagina);
  if (!seo) return {};
  const t = await termine(tipo, slug);
  // tag: la descrizione contiene le righe della scheda del gioco, non un testo per Google (piano 07)
  if (tipo === "tag" && t) {
    const d = descrizioneTag(t.nome, schedaDaDescrizione(t.descrizione));
    Object.assign(seo, { description: d, ogDescription: d });
  }
  return metadatiDaSeo(seo);
}

export async function ArchivioTermine({ tipo, slug, n }: { tipo: Tipo; slug: string; n?: string }) {
  const pagina = n === undefined ? 1 : numeroPagina(n);
  if (!pagina) notFound();
  if (n !== undefined && pagina === 1) permanentRedirect(base(tipo, slug));

  const t = await termine(tipo, slug);
  if (!t) notFound();
  const filtro = filtroDi(tipo, t.id);
  const [r, seo] = await Promise.all([paginaArticoli({ pagina, ...filtro }), seoArchivio(tipo, slug, pagina)]);
  const schema = <SchemaYoast schema={seo?.schema} />;
  // un tag senza articoli esiste (oggi risponde 200 con l'archivio vuoto): si mostra vuoto
  if (!r && pagina > 1) notFound();
  const scheda = tipo === "tag" ? schedaDaDescrizione(t.descrizione) : null;
  if (tipo === "tag" && (scheda || t.gioco)) {
    // la pagina di un gioco (piano 07): prima la scheda, poi tutti gli articoli a schede
    return (
      <>
        {schema}
        <SchedaGioco nome={t.nome} slug={slug} dati={scheda} grande />
        <h2 className="mt-10 text-[1.375rem] font-bold leading-tight">Tutti gli articoli su {t.nome}</h2>
        <div className="mt-4">
          <GrigliaArticoli articoli={r?.articoli ?? []} />
        </div>
        <Paginazione base={base(tipo, slug)} pagina={pagina} pagine={r?.pagine ?? 1} />
      </>
    );
  }
  return (
    <>
      {schema}
      <PaginaArchivio
        titolo={t.nome}
        // la descrizione dei tag diventa la scheda del gioco (piano 07): mai mostrata cosi' com'e'
        descrizione={tipo === "category" ? t.descrizione : undefined}
        articoli={r?.articoli ?? []}
        base={base(tipo, slug)}
        pagina={pagina}
        pagine={r?.pagine ?? 1}
      />
    </>
  );
}
