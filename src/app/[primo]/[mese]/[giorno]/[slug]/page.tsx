// L'articolo, su /AAAA/MM/GG/slug/ come oggi. Il primo segmento si chiama `primo` perche' allo
// stesso livello c'e' /[primo]/ (pagine come /privacy-policy/ e link senza data): Next vuole lo
// stesso nome di parametro.

import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { SchedaSovrapposta } from "@/components/guida/scheda";
import { TestataCopertina, TestataGuida } from "@/components/guida/testata";
import { SpazioPubblicitario } from "@/components/pubblicita";
import { estraiScheda } from "@/lib/guida/scheda";
import { collocaGruppi, schedaDaCampi, trofeiDaCampi } from "@/lib/guida/campi";
import { aggiungiAncore, dividiCorpo, estraiChecklist } from "@/lib/guida/checklist";
import { PillolaProgressione } from "@/components/guida/barra";
import { TornaSu } from "@/components/torna-su";
import { ChecklistGruppo, NotaEAzzera } from "@/components/guida/checklist";
import { TabellaCollezionabili } from "@/components/guida/collezionabili";
import { CorrelatoConImmagine, CorrelatoRiga, CorrelatoRiquadro } from "@/components/guida/correlato";
import { SelettoreVarianti } from "@/components/lab/selettore-varianti";
import { collezionabiliDaCampi, collocaCorrelati, correlatiDaCampi } from "@/lib/guida/collezionabili";
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
  // Prima i campi strutturati del CMS (scritti dalla redazione o da wpvibe), poi le tabelle del
  // testo come ripiego. Le tabelle si tolgono comunque dal corpo, per non mostrare i dati due volte.
  const { scheda: schedaTabella, corpo: senzaScheda } = estraiScheda(a.contenuto);
  const scheda = schedaDaCampi(a.meta) ?? schedaTabella;
  const { gruppi: gruppiTabelle, corpo: senzaTabelle } = estraiChecklist(senzaScheda);
  const gruppiCampi = trofeiDaCampi(a.meta);
  const gruppi = gruppiCampi.length ? gruppiCampi : gruppiTabelle;
  const posti = gruppiCampi.length
    ? collocaGruppi(gruppiTabelle.map((g) => g.id), gruppiCampi)
    : new Map(gruppiTabelle.map((g) => [g.id, [g]]));
  const senzaPosto = gruppiCampi.length && !gruppiTabelle.length ? gruppiCampi : [];
  const { html: conAncore, indice } = aggiungiAncore(senzaTabelle);
  const ancore = new Set([...conAncore.matchAll(/<h[23][^>]*\sid="([^"]+)"/g)].map((m) => m[1]));
  // Piano 03: collezionabili e correlati dai campi. Un correlato verso un articolo non pubblicato non compare.
  const oggetti = collezionabiliDaCampi(a.meta, ancore);
  const { html, collocati } = collocaCorrelati(conAncore, correlatiDaCampi(a.meta));
  const destinazioni = new Map(
    (await Promise.all(collocati.map(async (c) => [c.id, (await articoloPerSlug(c.articolo))?.articolo] as const))).filter(
      (x): x is readonly [string, NonNullable<(typeof x)[1]>] => Boolean(x[1]),
    ),
  );
  const pezzi = dividiCorpo(html);
  const idsTrofei = gruppi.flatMap((g) => g.voci.map((v) => v.id));
  const ultimoGruppo = gruppi.at(-1)?.id;

  const gruppoConNota = (g: (typeof gruppi)[number]) => (
    <div key={g.id}>
      <ChecklistGruppo articolo={a.id} gruppo={g} />
      {g.id === ultimoGruppo && <NotaEAzzera articolo={a.id} ids={idsTrofei} />}
    </div>
  );
  const corpo = [
    // trofei nei campi ma nessuna tabella nel testo: la checklist va in testa al corpo
    ...senzaPosto.map(gruppoConNota),
    ...pezzi.map((p, i) => {
      if ("html" in p) return <div key={i} className="contenuto" dangerouslySetInnerHTML={{ __html: p.html }} />;
      if ("gruppo" in p) return <div key={i}>{(posti.get(p.gruppo) ?? []).map(gruppoConNota)}</div>;
      const c = collocati.find((x) => x.id === p.correlato);
      const dest = destinazioni.get(p.correlato);
      if (!c || !dest) return null;
      // Prova del piano 03 (docs/brief/03-collezionabili-correlati.md): tre varianti, ?v=a|b|c
      return (
        <div key={i}>
          <div data-variant="a"><CorrelatoRiquadro c={c} a={dest} /></div>
          <div data-variant="b"><CorrelatoRiga c={c} a={dest} /></div>
          <div data-variant="c"><CorrelatoConImmagine c={c} a={dest} /></div>
        </div>
      );
    }),
  ];
  const idsProgressione = oggetti.length ? oggetti.map((o) => o.id) : idsTrofei;
  const inProva = oggetti.length > 0 || destinazioni.size > 0;

  return (
    <article>
      <div id="inizio-articolo" />
      <TornaSu />
      {seo.schema ? (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(seo.schema) }} />
      ) : null}

      {scheda ? (
        // Scelta del piano 01, giro 2: variante B «Sovrapposta» (docs/brief/01-guida-testata-scheda.md)
        <>
          <TestataCopertina a={a} alta />
          <SchedaSovrapposta s={scheda} />
        </>
      ) : (
        <TestataGuida a={a} />
      )}
      <div id="fine-scheda" />

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

      <div id={inProva ? "lab" : undefined} data-v="a" className={idsProgressione.length ? "pb-24" : undefined}>
        {inProva && (
          <style>{`#lab[data-v="a"] [data-variant]:not([data-variant="a"]),#lab[data-v="b"] [data-variant]:not([data-variant="b"]),#lab[data-v="c"] [data-variant]:not([data-variant="c"]){display:none}`}</style>
        )}
        {oggetti.length > 0 && (
          // PDF 06: la tabella dei mancanti in testa all'articolo
          <>
            {(["a", "b", "c"] as const).map((v) => (
              <div key={v} data-variant={v}>
                <TabellaCollezionabili articolo={a.id} voci={oggetti} variante={v} />
              </div>
            ))}
            <NotaEAzzera articolo={a.id} ids={oggetti.map((o) => o.id)} />
          </>
        )}
        {corpo}
        {/* Piano 02 chiuso: progressione a «Pillola». Spazio in fondo per non coprire il testo. */}
        {idsProgressione.length > 0 && (
          <PillolaProgressione articolo={a.id} ids={idsProgressione} indice={indice} unita={oggetti.length ? "oggetti" : "trofei"} />
        )}
        {inProva && (
          <SelettoreVarianti
            sezione={oggetti.length ? "Collezionabili" : "Correlati"}
            posizione="alto"
            varianti={
              oggetti.length
                ? [
                    { id: "a", nome: "Per area" },
                    { id: "b", nome: "Tabella" },
                    { id: "c", nome: "Aree a schede" },
                  ]
                : [
                    { id: "a", nome: "Riquadro" },
                    { id: "b", nome: "Riga" },
                    { id: "c", nome: "Con immagine" },
                  ]
            }
          />
        )}
      </div>

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
