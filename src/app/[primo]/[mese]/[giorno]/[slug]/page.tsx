// L'articolo, su /AAAA/MM/GG/slug/ come oggi. Il primo segmento si chiama `primo` perche' allo
// stesso livello c'e' /[primo]/ (pagine come /privacy-policy/ e link senza data): Next vuole lo
// stesso nome di parametro.

import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { SchedaCopertina, SchedaPannello, SchedaStriscia } from "@/components/guida/scheda";
import { TestataCopertina, TestataGuida } from "@/components/guida/testata";
import { SelettoreVarianti } from "@/components/lab/selettore-varianti";
import { SpazioPubblicitario } from "@/components/pubblicita";
import { estraiScheda } from "@/lib/guida/scheda";
import { metadatiDaSeo } from "@/lib/cms/metadati";
import { jsonLd } from "@/lib/cms/seo";
import { articoloPerSlug, indirizzoAttuale, tuttiGliArticoli } from "@/lib/cms/wp";

export const revalidate = 3600;
// un articolo pubblicato dopo il build si genera alla prima visita (completo, senza scheletro)
export const dynamicParams = true;

type Parametri = PageProps<"/[primo]/[mese]/[giorno]/[slug]">;

export async function generateStaticParams() {
  const tutti = await tuttiGliArticoli();
  // Solo per le prove in locale su una macchina carica: genera al build i primi N, gli altri alla
  // prima visita. Su Vercel la variabile non c'e' e si generano tutti.
  const limite = Number(process.env.BUILD_LIMITE_ARTICOLI) || tutti.length;
  return tutti.slice(0, limite).map((a) => {
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
  const { scheda, corpo } = estraiScheda(a.contenuto);
  return (
    <article>
      {seo.schema ? (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(seo.schema) }} />
      ) : null}

      {scheda ? (
        // Prova del piano 01 (docs/brief/01-guida-testata-scheda.md): tre varianti nella pagina,
        // scelte con ?v=a|b|c. Dopo la scelta resta solo quella approvata.
        <div id="lab" data-v="a">
          <style>{`#lab[data-v="a"] [data-variant]:not([data-variant="a"]),#lab[data-v="b"] [data-variant]:not([data-variant="b"]),#lab[data-v="c"] [data-variant]:not([data-variant="c"]){display:none}`}</style>
          <div data-variant="a">
            <TestataGuida a={a} />
            <div className="mt-5">
              <SchedaPannello s={scheda} />
            </div>
          </div>
          <div data-variant="b">
            <TestataGuida a={a} />
            <div className="mt-4">
              <SchedaStriscia s={scheda} />
            </div>
          </div>
          <div data-variant="c">
            <TestataCopertina a={a} />
            <div className="-mx-4">
              <SchedaCopertina s={scheda} />
            </div>
          </div>
          <SelettoreVarianti
            sezione="Scheda"
            varianti={[
              { id: "a", nome: "Pannello" },
              { id: "b", nome: "Striscia" },
              { id: "c", nome: "Copertina" },
            ]}
          />
        </div>
      ) : (
        <TestataGuida a={a} />
      )}

      <SpazioPubblicitario />

      {!scheda && a.immagine && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={a.immagine.src}
          srcSet={a.immagine.srcset}
          sizes="(min-width: 768px) 736px, 100vw"
          alt={a.immagine.alt}
          width={a.immagine.larghezza}
          height={a.immagine.altezza}
          className="mb-6 h-auto w-full rounded-lg"
        />
      )}
      <div className="contenuto" dangerouslySetInnerHTML={{ __html: corpo }} />
      {a.tag.length > 0 && (
        <ul className="mt-8 flex flex-wrap gap-2 text-sm">
          {a.tag.map((t) => (
            <li key={t.slug}>
              <Link href={`/tag/${t.slug}/`} className="flex min-h-11 items-center rounded-full border border-linea px-4 hover:border-link">
                #{t.nome}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}
