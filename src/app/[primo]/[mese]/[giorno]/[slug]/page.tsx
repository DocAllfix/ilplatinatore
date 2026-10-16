// L'articolo, su /AAAA/MM/GG/slug/ come oggi. Il primo segmento si chiama `primo` perche' allo
// stesso livello c'e' /[primo]/ (pagine come /privacy-policy/ e link senza data): Next vuole lo
// stesso nome di parametro.

import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { dataLeggibile } from "@/components/archivio";
import { metadatiDaSeo } from "@/lib/cms/metadati";
import { jsonLd } from "@/lib/cms/seo";
import { articoloPerSlug, indirizzoAttuale, tuttiGliArticoli } from "@/lib/cms/wp";

export const revalidate = 3600;
// un articolo pubblicato dopo il build si genera alla prima visita (completo, senza scheletro)
export const dynamicParams = true;

type Parametri = PageProps<"/[primo]/[mese]/[giorno]/[slug]">;

export async function generateStaticParams() {
  const tutti = await tuttiGliArticoli();
  return tutti.map((a) => {
    const [, primo, mese, giorno, slug] = a.percorso.split("/");
    return { primo, mese, giorno, slug };
  });
}

/** Trova l'articolo; se l'indirizzo e' vecchio o scritto diverso, rimanda con un 301/308. */
async function risolvi(params: Parametri["params"]) {
  const { primo, mese, giorno, slug } = await params;
  const richiesto = `/${primo}/${mese}/${giorno}/${slug}/`;
  if (!/^\d{4}$/.test(primo) || !/^\d{2}$/.test(mese) || !/^\d{2}$/.test(giorno)) notFound();

  const slugNormale = decodeURIComponent(slug).toLowerCase();
  const dati = await articoloPerSlug(slugNormale);
  if (dati) {
    // data o maiuscole diverse dall'indirizzo vero: si porta il lettore (e Google) su quello
    if (dati.articolo.percorso !== richiesto) permanentRedirect(dati.articolo.percorso);
    return dati;
  }
  // slug o data cambiati: WordPress li ricorda, il mu-plugin ce lo dice
  const attuale = await indirizzoAttuale(slugNormale, `${primo}-${mese}-${giorno}`);
  if (attuale && attuale !== richiesto) permanentRedirect(attuale);
  notFound();
}

export async function generateMetadata({ params }: Parametri): Promise<Metadata> {
  const { articolo, seo } = await risolvi(params);
  return metadatiDaSeo(seo, { titoloRiserva: articolo.titolo });
}

export default async function PaginaArticolo({ params }: Parametri) {
  const { articolo: a, seo } = await risolvi(params);
  return (
    <article>
      {seo.schema ? (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(seo.schema) }} />
      ) : null}
      <nav aria-label="Briciole" className="text-sm text-tenue">
        <Link href="/">Home</Link>
        {a.categoria && (
          <>
            {" › "}
            <Link href={`/category/${a.categoria.slug}/`}>{a.categoria.nome}</Link>
          </>
        )}
      </nav>
      <h1 className="mt-3 text-3xl font-bold leading-tight">{a.titolo}</h1>
      <p className="mt-2 text-sm text-tenue">
        {a.autore && (
          <>
            di <Link href={`/author/${a.autore.slug}/`}>{a.autore.nome}</Link> ·{" "}
          </>
        )}
        <time dateTime={a.data}>{dataLeggibile(a.data)}</time>
      </p>
      {a.immagine && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={a.immagine.src}
          srcSet={a.immagine.srcset}
          sizes="(min-width: 768px) 736px, 100vw"
          alt={a.immagine.alt}
          width={a.immagine.larghezza}
          height={a.immagine.altezza}
          fetchPriority="high"
          className="mt-5 h-auto w-full rounded-lg"
        />
      )}
      <div className="contenuto mt-6" dangerouslySetInnerHTML={{ __html: a.contenuto }} />
      {a.tag.length > 0 && (
        <ul className="mt-8 flex flex-wrap gap-2 text-sm">
          {a.tag.map((t) => (
            <li key={t.slug}>
              <Link href={`/tag/${t.slug}/`} className="rounded-full border border-bordo px-3 py-1 hover:border-accento">
                #{t.nome}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}
