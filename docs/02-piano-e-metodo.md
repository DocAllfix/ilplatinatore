# Il Platinatore — piano di lavoro e metodo

Le fasi, nell'ordine in cui vanno fatte, ciascuna con un **cancello**: l'elenco delle cose verificate che permettono di passare alla successiva.

L'ordine rispetta il PDF del proprietario (`05-reference-proprietario.pdf`): prima le fondamenta, poi il **prototipo su un solo gioco** (PDF, sezione 10), poi l'estensione. Il passaggio di dominio viene per ultimo. Come i documenti stanno insieme è spiegato in `00-raccordo.md`.

Il piano si può rivedere, ma ogni modifica va proposta all'utente con la ragione **prima** di applicarla.

---

## Metodo di lavoro

Valgono in ogni fase.

1. **Prima si capisce, poi si scrive codice.** Ogni fase si apre dichiarando assunzioni e alternative, e chiedendo dove la scelta spetta all'utente. Decisioni aperte: tabella in `01-progetto.md` (D1–D9) e domande della sezione 9 di `04-brief-design.md`.
2. **Ogni fase ha un cancello verificabile.** Non «sembra funzionare», ma «questi controlli sono verdi, ed eccoli».
3. **Ogni controllo nuovo si prova rompendolo**: si rimette di proposito il difetto, si vede il rosso sull'asserzione giusta, poi si ripristina. Un controllo che non può diventare rosso non è un controllo.
4. **Si misura il prodotto come lo vede un visitatore**: richieste HTTP vere, pagine aperte in un browser vero, richieste di rete contate.
5. **Varianti sull'anteprima, una sezione alla volta, prima da telefono** (375 px). Chi decide le confronta dal vivo con un selettore e sceglie o combina. Mai proposte a parole o con immagini statiche. Viene da `04-brief-design.md`, sezione 7.
6. **Si guarda**: foto delle pagine da telefono e da computer, aperte e guardate. Molti difetti di impaginazione non li vede nessun test.
7. **Controlli automatici a ogni passaggio**: build, lint, accessibilità (axe), nessuno scorrimento orizzontale, Lighthouse. Le prestazioni vere si misurano con PageSpeed **sul sito deployato**, non in locale.
8. **I collaudi locali si fanno sul build di produzione** (`next build` + `next start`), verificando che il server acceso sia quello del build appena fatto.
9. **Niente scritture su sistemi vivi senza autorizzazione esplicita**: il sito su Aruba, il WordPress di produzione, i DNS, Vercel in produzione. I collaudi contro la produzione sono in sola lettura.
10. **Punto di ripristino** (tag git) prima di ogni messa online.
11. **Testi**: niente trattini lunghi, niente numeri senza fonte, titoli con la sola prima lettera maiuscola, all'italiana.
12. **Alla fine di ogni fase** si aggiorna la sezione «Stato» di `CLAUDE.md` (fatto, cancello, difetti, regole nate, debiti), si fa il commit «Fase N completata» e **si aggiorna l'utente**.
13. **Le regole nuove si scrivono come regole, non come aneddoti**: «Un X fa Y, quindi si fa Z».

---

## Fase 0 — Analisi

**Obiettivo**: sapere esattamente che cosa c'è, come sta il sito oggi e che cosa si vuole, prima di toccare qualcosa.

1. **Accessi** dal proprietario (`01-progetto.md`, sezione 4):
   - copia completa del sito;
   - accesso amministratore;
   - DNS;
   - contatto con HB Agency;
   - Search Console e GA4.
2. **Analisi SEO con le skill SEO** (`seo-audit`, `seo-technical`, `seo-sitemap`, `seo-schema`, `seo-content`, `seo-images`). È la priorità: gli indirizzi da conservare vengono prima di tutto.
3. **Inventario degli indirizzi**: tutti gli URL dalla sitemap pubblica (articoli, pagine, categorie, tag, autore), più `/feed/`, la paginazione, `ads.txt` e `robots.txt`. Salvato in un file del repository: è l'elenco su cui si verificherà la parità.
4. **Redirect esistenti**: esportazione dei plugin di redirect, se ci sono, e conteggio degli slug e delle date cambiati (`_wp_old_slug`, `_wp_old_date`) dal database della copia.
5. **Contenuti**: un campione di almeno 30 articoli, di categorie diverse, per vedere che HTML arriva (blocchi, tabelle, video, shortcode, gallerie). Serve a fissare la sanificazione e i componenti. **In più, l'analisi completa del gioco scelto per il prototipo** (proposta: Crimson Desert, 308 articoli): come sono fatte oggi le sue guide e quali dati strutturati se ne possono ricavare.
6. **Dati SEO di Yoast**: che cosa c'è in `yoast_head_json` su articoli, categorie, tag, autore e home.
7. **Pubblicità**: dove stanno oggi gli spazi e come li inserisce Advanced Ads, quale script carica HB Agency, se porta il banner dei cookie. **Risposta di HB Agency** sulla compatibilità con Next.js.
8. **Reference**: le reference della sezione 4 del brief si aprono davvero, si confermano o si scartano con una riga di motivazione, e si riportano nello schema del PDF (reference → funzionalità → proposta di utilizzo).
9. **Punto di partenza misurato**:
   - tempi di risposta (a freddo e a caldo), peso delle pagine e Core Web Vitals (PageSpeed);
   - pagine indicizzate, query principali e pagine più visitate da Search Console.

**Cancello**:
- inventario degli URL nel repository, con i conteggi uguali a quelli dell'API;
- analisi SEO scritta, con gli indirizzi da conservare e i rischi;
- campione dei contenuti e gioco del prototipo analizzati;
- reference riportate nello schema del PDF;
- punto di partenza misurato e scritto;
- decisioni D1–D9 e domande del brief chiuse, o con una data per chiuderle;
- risposta di HB Agency ricevuta, oppure dichiarata come blocco della Fase 5.

---

## Fase 1 — Fondamenta

Tre parti, che possono procedere in parallelo. Il cancello è unico.

### 1A — Prodotto e design

1. `PRODUCT.md` e `DESIGN.md` con la skill **impeccable**, approvati dall'utente **prima** di scrivere componenti. Tipo di progetto misto: editoriale per la home, strumento per guide, checklist e tabelle.
2. Strumenti e regole di `04-brief-design.md`, sezione 5:
   - shadcn/ui ripulito sui token del sito;
   - React Aria solo se serve;
   - niente librerie UI pesanti.
3. **Gli spazi pubblicitari stanno nel layout da subito**, con misure riservate, anche se gli annunci arrivano in Fase 5: cambiano altezze e CLS.

### 1B — Il CMS su Hetzner (copia di lavoro)

1. Server secondo la decisione D1. Dettagli in `03-wordpress-headless.md`, sezione 2: Docker Compose con Caddy, MariaDB e WordPress, con rete, schema e utente del database dedicati.
2. `Caddyfile`:
   - `noindex` su ogni risposta;
   - password su `/wp-admin` e `/wp-login.php`;
   - `xmlrpc` e file sensibili chiusi;
   - sitemap del CMS a 404;
   - **REST API aperta**.
   `caddy validate` prima di ogni ricarica.
3. Record DNS `cms.ilplatinatore.it` → server, nel pannello Aruba. Solo quel record.
4. Import della copia, `wp search-replace` del dominio, «Scoraggia i motori di ricerca» acceso.
5. **mu-plugin** adattato (`03`, sezione 3): webhook, slug **e date** precedenti, anteprima, `post_link` nella forma `/AAAA/MM/GG/slug/`, sitemap del CMS spente.
6. **Campi strutturati (D9)** sul CMS di lavoro, leggibili e scrivibili dalla REST, per scheda riassuntiva, elementi di checklist e tabelle, relazioni dei correlati, e indicazione «questo tag è un gioco».
7. **Backup** cifrati notturni con copia fuori dal server, prova di ripristino settimanale, allarme con interruttore dell'uomo morto (`03`, sezione 8).
8. Utenti: amministratore dedicato, utente Editor per wpvibe, `DISALLOW_FILE_EDIT`.
9. Fotografia della configurazione nel repository (`infra/cms/`), senza segreti.

⚠️ **Finché il dominio non passa, la redazione continua a pubblicare su Aruba.** Il CMS su Hetzner è una copia di lavoro: gli articoli nuovi si riportano con importazioni incrementali (Fase 6). Per questo i campi strutturati e i contenuti del prototipo si scrivono **solo** su Hetzner, e la copia di Hetzner **non si sovrascrive mai in blocco** con quella di Aruba.

### 1C — Il frontend di base

1. Progetto Next.js 16 (App Router, TypeScript, Tailwind v4 con token in `@theme`, font locali), `trailingSlash: true`, `env.ts` con validazione, Vitest. Su Vercel, progetto nuovo nel team «docallfix's projects».
2. Strato dati sul modello di `03`, sezione 4:
   - `config` da ambiente;
   - `wp` con `_embed`, ritentativi ed errori propagati;
   - `mappa` pura;
   - `seo` con la riscrittura degli URL;
   - `sanitize` dalla Fase 0.
3. Rotte **identiche** a oggi:
   - articoli `/[anno]/[mese]/[giorno]/[slug]/`, generati al build;
   - categorie, tag, autore, con la loro paginazione;
   - home, pagine, ricerca (D5) e 404.
4. Slug e date precedenti → redirect permanente; 410 per i rimossi; redirect importati e appiattiti.
5. Sitemap (con `lastModified` solo se noto), `robots.txt`, **`/feed/` RSS**, `ads.txt` aggiornabile senza deploy, `llms.txt`.
6. Dati strutturati: Article, BreadcrumbList, schema di Yoast con gli URL riscritti.
7. Webhook e anteprima (`03`, sezione 4.9), con token separati e 404 senza token.
8. **Nessuna pagina pubblica legge la richiesta**, e un test che lo garantisce seguendo gli import.

**Cancello della Fase 1**:
- `PRODUCT.md` e `DESIGN.md` approvati dall'utente;
- CMS di lavoro:
  - risponde in HTTPS con l'header `noindex`;
  - `/wp-admin` chiede la password di Caddy;
  - `xmlrpc` risponde 403 e le sitemap del CMS 404;
  - conteggi della REST uguali a quelli di Aruba;
  - un backup **ripristinato davvero**;
  - l'allarme visto scattare;
- campi strutturati visibili e scrivibili via REST, provati con una scrittura REST come quella di wpvibe;
- build verde con tutte le pagine generate;
- **verifica di parità** (Fase 6, punto 2) contro il build locale, con zero differenze non spiegate;
- nessun URL del CMS nell'HTML reso;
- un articolo pubblicato dalla dashboard del CMS di lavoro compare sul frontend dopo il webhook;
- sito su Aruba invariato.

---

## Fase 2 — Il prototipo del PDF (sezione 10)

**Obiettivo**: un sistema ridotto e funzionante su **un solo gioco**, già ben coperto (proposta del brief: Crimson Desert, da confermare in Fase 0), deployato in anteprima su Vercel.

1. **Hub del gioco** (PDF 04): presentazione, piattaforme, dati del completamento, «Inizia qui», guida al platino, guide specifiche, notizie separate.
2. **Guida con scheda riassuntiva** (PDF 03): difficoltà, durata, partite, mancabili, requisiti online, con le condizioni delle stime; versione mini per schede e archivio. I dati del gioco restano separati dal progresso del lettore.
3. **Checklist persistente e barra di progressione** (PDF 05): completati su totale, Indice, Da completare, Riprendi, Inizio. Salvataggio nel browser, dichiarando che non è sincronizzato con PSN.
4. **Tabella dei mancanti** (PDF 06): solo mancanti, filtro per area, spoiler, prossimo elemento, reset con conferma. Contatore per raccolta e generale; platino ≠ 100%.
5. **Due correlati contestuali** (PDF 07), ciascuno con il perché, scritti dalla redazione.
6. **Un mini-gioco** (PDF 08) con rimando all'hub e la soluzione sempre visibile. Diritti delle immagini da verificare.
7. **Home con soli tre moduli**: guide del momento (con criterio dichiarato: `00-raccordo.md`, punto 7), evergreen, sfida.

Ogni sezione si costruisce **per varianti sull'anteprima, prima da telefono**. I dati strutturati del gioco del prototipo si compilano sul CMS di lavoro.

**Cancello**: le varianti scelte dall'utente sono online sull'anteprima · i componenti funzionano coi dati veri del CMS di lavoro, non con dati finti scritti nel codice.

---

## Fase 3 — Verifica del prototipo con i criteri del PDF

I criteri della sezione 10 del PDF sono la definizione di «finito»:
- le spunte aggiornano il contatore e restano al ritorno sulla pagina;
- indice e barra non coprono i titoli e funzionano da telefono e da tastiera;
- stati e completamento non affidati al solo colore, con etichette testuali;
- spoiler, reset, dati mancanti e differenze fra versioni gestiti;
- si misura l'uso degli strumenti (checklist usate, ritorni, passaggi verso guide pertinenti, sfide completate), non solo la permanenza.

In più:
- `break-ui` con titoli di giochi lunghissimi e dati mancanti;
- axe senza violazioni;
- nessuno scorrimento orizzontale a 360 px;
- Lighthouse e PageSpeed sull'anteprima.

**Cancello**: ogni criterio provato con un controllo automatico o una prova scritta, ognuno visto anche rosso · approvazione dell'utente.

---

## Fase 4 — Estensione

1. Gli altri hub per gioco (con l'indicazione di quali tag sono giochi), secondo la decisione D8 sugli indirizzi. Skill `seo-programmatic` per gli hub generati in serie: niente pagine sottili.
2. La home completa del PDF (sezione 09) e le pagine archivio.
3. **Catena di pubblicazione continua**:
   - il webhook invalida articolo, home, hub, archivi, sitemap e feed;
   - anteprima delle bozze;
   - controlli automatici dopo ogni pubblicazione e ogni mattina, con allarme (`03`, sezione 7);
   - **prova con wpvibe**: un articolo con campi strutturati, pubblicato dall'AI, compare completo.

**Cancello**: tutti gli hub generati e verificati · pubblicazione, modifica, cambio di slug e cestino provati dalla dashboard e visti sul sito · un difetto messo apposta fa scattare controllo e allarme.

---

## Fase 5 — Pubblicità, consenso, analytics

1. Integrazione secondo le decisioni D2 e D3:
   - annunci negli spazi già riservati in 1A;
   - caricamento sotto la piega quando ci si arriva;
   - **rinnovo a ogni cambio di pagina** lato client.
2. Banner del consenso **certificato TCF** se ci sono annunci personalizzati, mai coperto da altri elementi.
3. GA4 solo dopo il consenso, più la misura dell'uso degli strumenti chiesta dal PDF.
4. CSP con le origini ricavate dall'ambiente.

**Cancello**:
- elenco delle richieste di rete prima del consenso: nessuna verso terzi;
- dopo il consenso, annunci e GA4 caricati senza violazioni CSP;
- annunci rinnovati navigando fra tre pagine;
- CLS sotto 0,1;
- la concessionaria vede le impressioni dall'anteprima.

---

## Fase 6 — Collaudo sull'anteprima e allineamento dei contenuti

1. **Importazione incrementale** degli articoli pubblicati su Aruba dopo la copia, con testi, immagini e date. Gli indirizzi devono restare identici. Si fa almeno una volta qui, per provarla, e poi di nuovo al passaggio.
2. **Verifica di parità** su **tutti** gli URL dell'inventario, vecchio sito contro anteprima, per ciascuno:
   - stato HTTP;
   - redirect con la destinazione finale;
   - titolo, descrizione e robots;
   - canonical;
   - numero e tipo degli schemi;
   - testo principale.
   Le differenze volute si dichiarano nel controllo.
3. PageSpeed sull'anteprima contro il punto di partenza. Obiettivi: LCP < 2,5 s, CLS < 0,1, INP < 200 ms.
4. L'anteprima è protetta dall'accesso Vercel: i controlli passano il bypass e verificano di non leggere la pagina di login.

**Cancello**: importazione incrementale provata · parità a zero differenze non spiegate · prestazioni migliori del punto di partenza · tutti i controlli verdi, ognuno col bersaglio stampato.

---

## Fase 7 — Il passaggio

1. **Prima**:
   - tag git di ripristino;
   - redazione avvisata, e **redazione ferma** per il tempo dell'ultima importazione incrementale;
   - da quel momento **si pubblica solo sul CMS su Hetzner**, wpvibe compreso, che va ricollegato al nuovo indirizzo.
2. Dominio aggiunto al progetto Vercel. Nel pannello DNS di Aruba si cambiano **solo** i record del sito (dominio nudo e `www`); **nameserver e MX restano**. TTL abbassato prima, se possibile.
3. Momento di traffico basso, utente presente.
4. **Subito dopo**:
   - parità contro il dominio vero;
   - controlli automatici;
   - **posta del dominio provata** (invio e ricezione);
   - sitemap reinviata in Search Console.
5. **Via di ritorno**: il sito su Aruba resta acceso e intatto per almeno due settimane.

**Cancello**: parità e controlli verdi sul dominio vero · posta funzionante · nessun errore nuovo in Search Console nelle prime 48 ore.

---

## Fase 8 — Sorveglianza

Per 4–8 settimane si confrontano col punto di partenza:
- Search Console (pagine indicizzate, errori, posizioni);
- Core Web Vitals;
- resa pubblicitaria;
- uso degli strumenti.

Solo dopo si spegne il sito su Aruba, conservandone la copia, e si scrive nel `CLAUDE.md` che cosa serve per Quart4 Parete.

---

## Che cosa si porta a Quart4 Parete

Alla fine si scrive che cosa era generico e che cosa era specifico di questo sito. Le differenze note di Quart4 Parete:
- circa 14.000 articoli, quindi servono pagine generate su richiesta e conservate;
- **Elementor**, con contenuti da convertire;
- 82 categorie e 5.684 tag;
- 2 tipi di contenuto personalizzati;
- AdSense con Advanced Ads;
- Cloudflare davanti;
- server proprio invece di Aruba.
