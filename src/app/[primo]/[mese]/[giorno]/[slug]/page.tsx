// L'articolo, su /AAAA/MM/GG/slug/ come oggi. Il primo segmento si chiama `primo` perche' allo
// stesso livello c'e' /[primo]/ (pagine come /privacy-policy/ e link senza data): Next vuole lo
// stesso nome di parametro.

import type { Metadata } from "next";
import Link from "@/components/collegamento";
import { draftMode } from "next/headers";
import { notFound, permanentRedirect } from "next/navigation";
import { SchedaSovrapposta } from "@/components/guida/scheda";
import { TestataCopertina, TestataGuida } from "@/components/guida/testata";
import { HeaderBanner, SpazioHB } from "@/components/annunci";
import { FLOOR_AD, inserisciAnnunci, NEL_TESTO } from "@/lib/annunci";
import { estraiScheda } from "@/lib/guida/scheda";
import { collocaGruppi, schedaDaCampi, trofeiDaCampi } from "@/lib/guida/campi";
import { aggiungiAncore, dividiCorpo, estraiChecklist } from "@/lib/guida/checklist";
import { PillolaProgressione } from "@/components/guida/barra";
import { BarraLettura } from "@/components/barra-lettura";
import { TornaSu } from "@/components/torna-su";
import { ChecklistGruppo, NotaEAzzera } from "@/components/guida/checklist";
import { TabellaCollezionabili } from "@/components/guida/collezionabili";
import { Correlato } from "@/components/guida/correlato";
import { collezionabiliDaRighe, collocaCorrelati, correlatiDaCampi, estraiTabelleOggetti, righeDaCampi } from "@/lib/guida/collezionabili";
import { metadatiDaSeo } from "@/lib/cms/metadati";
import { jsonLd } from "@/lib/cms/seo";
import { articoliDelTag, articoloPerId, articoloPerSlug, indirizzoAttuale, terminePerSlug, tuttiGliArticoli, registroHub } from "@/lib/cms/wp";
import { eHub } from "@/lib/registro-hub";
import { guidaPlatinoDalTitolo } from "@/lib/hub";
import { correlatiAutomatici, eRecensione, estraiVerdetto } from "@/lib/recensione";
import { SchedaVerdetto } from "@/components/recensione/scheda-verdetto";
import { sitoPubblico } from "@/lib/cms/config";
import { SchedaGioco } from "@/components/gioco/scheda-gioco";
import { schedaDaDescrizione } from "@/lib/scheda-gioco";

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
  // Anteprima di una bozza (rotta /api/preview/): solo per chi ha il cookie della modalita' bozza.
  // Si legge la versione non pubblicata e non si fa nessun redirect.
  if ((await draftMode()).isEnabled) {
    const perId = slugNormale.match(/^anteprima-(\d+)$/);
    const bozza = perId ? await articoloPerId(Number(perId[1]), { bozza: true }) : await articoloPerSlug(slugNormale, { bozza: true });
    if (bozza) return { ...bozza, anteprima: true };
  }
  const dati = await articoloPerSlug(slugNormale);
  if (dati) {
    // data o maiuscole diverse dall'indirizzo vero: si porta il lettore (e Google) su quello
    if (dati.articolo.percorso !== richiesto) permanentRedirect(dati.articolo.percorso);
    return { ...dati, anteprima: false };
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
  const { articolo: a, seo, anteprima } = await risolvi(params);
  // Prima i campi strutturati del CMS (scritti dalla redazione o da wpvibe), poi le tabelle del
  // testo come ripiego. Le tabelle si tolgono comunque dal corpo, per non mostrare i dati due volte.
  // recensioni: il voto e il verdetto finale diventano la scheda del verdetto (20/10/2026)
  const { voto, titolo: titoloVerdetto, verdetto, corpo: senzaVerdetto } = estraiVerdetto(a.contenuto);
  const { scheda: schedaTabella, corpo: senzaScheda } = estraiScheda(senzaVerdetto);
  const scheda = schedaDaCampi(a.meta) ?? schedaTabella;
  const { gruppi: gruppiTabelle, corpo: senzaTabelle } = estraiChecklist(senzaScheda);
  const gruppiCampi = trofeiDaCampi(a.meta);
  const gruppi = gruppiCampi.length ? gruppiCampi : gruppiTabelle;
  const posti = gruppiCampi.length
    ? collocaGruppi(gruppiTabelle.map((g) => g.id), gruppiCampi)
    : new Map(gruppiTabelle.map((g) => [g.id, [g]]));
  const senzaPosto = gruppiCampi.length && !gruppiTabelle.length ? gruppiCampi : [];
  // articoli-elenco (piano 07): le tabelle «Oggetto/Arma/...» del testo diventano la tabella dei mancanti
  const { righe: righeTabelle, corpo: senzaOggetti } = estraiTabelleOggetti(senzaTabelle);
  const { html: conAncore, indice } = aggiungiAncore(senzaOggetti);
  const titoli = [...conAncore.matchAll(/<h([23])[^>]*\sid="([^"]+)"[^>]*>([\s\S]*?)<\/h\1>/g)].map((m) => ({ id: m[2], testo: m[3].replace(/<[^>]+>/g, "") }));
  // Piano 03: collezionabili e correlati dai campi. Un correlato verso un articolo non pubblicato non compare.
  // prima il campo pl_collezionabili, poi le tabelle del testo come ripiego
  const righeCampi = righeDaCampi(a.meta);
  const oggetti = collezionabiliDaRighe(righeCampi.length ? righeCampi : righeTabelle, titoli);
  const [termini, registro] = await Promise.all([Promise.all(a.tag.map((t) => terminePerSlug("tags", t.slug))), registroHub()]);
  // il gioco dell'articolo: il primo tag che non e' escluso dal registro
  const iGioco = a.tag.findIndex((t, i) => termini[i] && eHub(t.slug, registro));
  // correlati: quelli scelti a mano (campo pl_correlati); in una recensione senza scelte, automatici:
  // una guida dello stesso gioco ogni due sezioni, prima quella al Platino (scelta dell'utente, 20/10/2026)
  let correlati = correlatiDaCampi(a.meta);
  if (!correlati.length && eRecensione(a) && iGioco >= 0) {
    const notizia = (x: { categorie: Array<{ slug: string }> }) => x.categorie.some((c) => /^news$|notizi/i.test(c.slug));
    const guide = (await articoliDelTag(termini[iGioco]!.id)).filter((x) => x.id !== a.id && !eRecensione(x) && !notizia(x));
    const recenti = [...guide].sort((x, y) => (y.modificato ?? y.data).localeCompare(x.modificato ?? x.data));
    correlati = correlatiAutomatici(
      indice.map((v) => v.id),
      recenti,
      guidaPlatinoDalTitolo(guide),
    );
  }
  const { html, collocati } = collocaCorrelati(conAncore, correlati);
  const destinazioni = new Map(
    (await Promise.all(collocati.map(async (c) => [c.id, (await articoloPerSlug(c.articolo))?.articolo] as const))).filter(
      (x): x is readonly [string, NonNullable<(typeof x)[1]>] => Boolean(x[1]),
    ),
  );
  // Fase 5: gli spazi di HB dopo il 1°, 3°, 4°, 5° e 7° paragrafo, come Advanced Ads oggi
  const pezzi = dividiCorpo(inserisciAnnunci(html));
  const giochi: Array<{ slug: string; nome: string; dati: ReturnType<typeof schedaDaDescrizione> }> = [];
  const altriTag: typeof a.tag = [];
  a.tag.forEach((t, i) => {
    const tt = termini[i];
    const dati = schedaDaDescrizione(tt?.description);
    // ogni tag e' il suo gioco, tranne gli esclusi del registro (scelta del proprietario, 20/10/2026)
    if (tt && eHub(t.slug, registro)) giochi.push({ slug: t.slug, nome: t.nome, dati });
    else altriTag.push(t);
  });
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
      if ("annuncio" in p) {
        const an = NEL_TESTO.find((x) => x.id === p.annuncio);
        return an ? <SpazioHB key={i} id={an.id} nome={an.nome} /> : null;
      }
      if ("verdetto" in p) {
        if (!voto) return null;
        return (
          <SchedaVerdetto
            key={i}
            voto={voto}
            titolo={titoloVerdetto}
            verdetto={verdetto}
            gioco={iGioco >= 0 ? { nome: a.tag[iGioco].nome, slug: a.tag[iGioco].slug } : undefined}
          />
        );
      }
      const c = collocati.find((x) => x.id === p.correlato);
      const dest = destinazioni.get(p.correlato);
      if (!c || !dest) return null;
      // Piano 03 chiuso: variante C «Con immagine»
      return <Correlato key={i} c={c} a={dest} />;
    }),
  ];
  const idsProgressione = oggetti.length ? oggetti.map((o) => o.id) : idsTrofei;

  return (
    // Piano 07 chiuso: linea viola sui titoli e bagliore che pulsa (scelte del proprietario)
    <article>
      {anteprima && (
        // solo per chi scrive: la bozza non e' pubblicata
        <p className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border-2 border-avviso px-4 py-2 text-sm font-semibold text-avviso">
          Anteprima della bozza: non è ancora pubblicata.
          <a href={`/api/preview/esci/?verso=${encodeURIComponent(a.percorso)}`} className="inline-flex min-h-11 items-center underline underline-offset-4">
            Esci dall&apos;anteprima
          </a>
        </p>
      )}
      <div id="inizio-articolo" />
      {/* Piano 04 chiuso: barra di lettura A «Linea»; «Torna all'inizio» resta su tutti gli articoli */}
      <BarraLettura />
      <TornaSu />
      {seo.schema ? (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(seo.schema) }} />
      ) : null}
      {voto && eRecensione(a) && iGioco >= 0 && (
        // la recensione con il suo voto e il gioco recensito: oggi su Aruba non c'e' (novita' dichiarata)
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: jsonLd({
              "@context": "https://schema.org",
              "@type": "Review",
              name: a.titolo,
              url: seo.canonical ?? `${sitoPubblico()}${a.percorso}`,
              datePublished: a.data,
              ...(a.modificato ? { dateModified: a.modificato } : {}),
              inLanguage: "it-IT",
              ...(a.autore ? { author: { "@type": "Person", name: a.autore.nome, url: `${sitoPubblico()}/author/${a.autore.slug}/` } } : {}),
              publisher: { "@type": "Organization", name: "Il Platinatore", url: `${sitoPubblico()}/` },
              itemReviewed: { "@type": "VideoGame", name: a.tag[iGioco].nome, url: `${sitoPubblico()}/tag/${a.tag[iGioco].slug}/` },
              reviewRating: { "@type": "Rating", ratingValue: voto.valore, bestRating: voto.scala, worstRating: 0 },
            }),
          }}
        />
      )}

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

      <HeaderBanner />

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

      <div className={idsProgressione.length ? "pb-24" : undefined}>
        {oggetti.length > 0 && (
          // PDF 06: la tabella dei mancanti in testa all'articolo. Piano 03 chiuso: variante B «Tabella»
          <>
            <TabellaCollezionabili articolo={a.id} voci={oggetti} />
            <NotaEAzzera articolo={a.id} ids={oggetti.map((o) => o.id)} />
          </>
        )}
        {corpo}
        {/* Piano 02 chiuso: progressione a «Pillola». Spazio in fondo per non coprire il testo. */}
        {idsProgressione.length > 0 && (
          <PillolaProgressione articolo={a.id} ids={idsProgressione} indice={indice} unita={oggetti.length ? "oggetti" : "trofei"} />
        )}
      </div>

      {/* Fase 5: Floor Ad dopo il contenuto (HB lo fissa in basso), come oggi */}
      <SpazioHB id={FLOOR_AD.id} nome={FLOOR_AD.nome} />
      {/* Il gioco a fine articolo, come scheda col bagliore (piano 07); gli altri tag come etichette */}
      {giochi.map((g) => (
        <div key={g.slug} className="mt-10">
          <SchedaGioco nome={g.nome} slug={g.slug} dati={g.dati} />
        </div>
      ))}
      {altriTag.length > 0 && (
        <ul className="mt-6 flex flex-wrap gap-2 text-sm">
          {altriTag.map((t) => (
            <li key={t.slug}>
              <Link prefetch={false} href={`/tag/${t.slug}/`} className="flex min-h-11 items-center rounded-full border border-linea px-4 hover:border-link">
                #{t.nome}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}
