// Archivi di categoria, tag e autore, con la paginazione di oggi: /category/<slug>/page/N/.
// Una logica sola per i tre, cosi' un correttivo vale ovunque.

import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { GrigliaArticoli, PaginaArchivio, Paginazione } from "./archivio";
import { SchedaGioco } from "./gioco/scheda-gioco";
import { descrizioneTag, schedaDaDescrizione } from "@/lib/scheda-gioco";
import { metadatiDaSeo, seoPaginata } from "@/lib/cms/metadati";
import { numeroPagina } from "@/lib/cms/pagina";
import { paginaArticoli, seoTermine, terminePerSlug, tuttiGliAutori } from "@/lib/cms/wp";

export type Tipo = "category" | "tag" | "author";

type Termine = { id: number; nome: string; descrizione?: string; gioco?: boolean };

async function termine(tipo: Tipo, slug: string): Promise<Termine | null> {
  if (tipo === "author") {
    const a = (await tuttiGliAutori()).find((x) => x.slug === slug);
    return a ? { id: a.id, nome: a.name } : null;
  }
  const t = await terminePerSlug(tipo === "category" ? "categories" : "tags", slug);
  if (!t) return null;
  const segnato = t.meta?.pl_gioco === "1" || t.meta?.pl_sfida === "1";
  return { id: t.id, nome: t.name, descrizione: t.description || undefined, gioco: segnato };
}

function base(tipo: Tipo, slug: string) {
  return `/${tipo}/${slug}/`;
}

export async function metadatiTermine(tipo: Tipo, slug: string, n?: string): Promise<Metadata> {
  const seo = await seoTermine(tipo, slug);
  if (!seo) return {};
  const pagina = n === undefined ? 1 : (numeroPagina(n) ?? 1);
  const t = await termine(tipo, slug);
  // tag: la descrizione contiene le righe della scheda del gioco, non un testo per Google (piano 07)
  if (tipo === "tag" && t) {
    const d = descrizioneTag(t.nome, schedaDaDescrizione(t.descrizione));
    Object.assign(seo, { description: d, ogDescription: d });
  }
  if (pagina === 1) return metadatiDaSeo(seo);
  const filtro = tipo === "category" ? { categoria: t?.id } : tipo === "tag" ? { tag: t?.id } : { autore: t?.id };
  const r = await paginaArticoli({ pagina, ...filtro });
  return metadatiDaSeo(seoPaginata(seo, pagina, r?.pagine ?? 1));
}

export async function ArchivioTermine({ tipo, slug, n }: { tipo: Tipo; slug: string; n?: string }) {
  const pagina = n === undefined ? 1 : numeroPagina(n);
  if (!pagina) notFound();
  if (n !== undefined && pagina === 1) permanentRedirect(base(tipo, slug));

  const t = await termine(tipo, slug);
  if (!t) notFound();
  const filtro = tipo === "category" ? { categoria: t.id } : tipo === "tag" ? { tag: t.id } : { autore: t.id };
  const r = await paginaArticoli({ pagina, ...filtro });
  // un tag senza articoli esiste (oggi risponde 200 con l'archivio vuoto): si mostra vuoto
  if (!r && pagina > 1) notFound();
  const scheda = tipo === "tag" ? schedaDaDescrizione(t.descrizione) : null;
  if (tipo === "tag" && (scheda || t.gioco)) {
    // la pagina di un gioco (piano 07): prima la scheda, poi tutti gli articoli a schede
    return (
      <>
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
    <PaginaArchivio
      titolo={t.nome}
      // la descrizione dei tag diventa la scheda del gioco (piano 07): mai mostrata cosi' com'e'
      descrizione={tipo === "category" ? t.descrizione : undefined}
      articoli={r?.articoli ?? []}
      base={base(tipo, slug)}
      pagina={pagina}
      pagine={r?.pagine ?? 1}
    />
  );
}
