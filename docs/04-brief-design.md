# Il Platinatore: brief per il redesign

Aggiornato al 15 ottobre 2026. Destinatario: l'agente che rifà www.ilplatinatore.it.

## 1. Come usare questo documento

- **Il PDF "Il Platinatore, reference e componenti per il redesign" (15 ottobre 2026) è la base vincolante.** Le sue sezioni 01-10 decidono funzionalità e ordine di lavoro. Niente qui le sostituisce: se qualcosa sembra in conflitto, vince il PDF e si chiede.
- Le **reference aggiuntive** (sezione 4) costruiscono sopra il PDF e coprono quello che il PDF dichiara di non coprire: aspetto, lettura, concorrenza su Google. Si copiano le decisioni, non i siti.
- Strumenti, base tecnica e metodo (sezioni 5-7) vengono dal progetto axialoop.com, già online e verificato.
- Le **domande aperte** (sezione 9) vanno chiuse con chi gestisce il sito prima di scrivere codice.

## 2. Il sito oggi (dati verificati il 15/10/2026)

È un sito di **guide**, non di notizie.

| Aspetto | Oggi |
| --- | --- |
| Piattaforma | WordPress, tema BlogData (Themeansar), sitemap Yoast (`/sitemap_index.xml`) |
| Articoli | 1.704: Guide 1.537, News 136, Approfondimenti 12, Videogiochi 8, Senza categoria 12 |
| Tag | 129, quasi tutti nomi di giochi |
| Giochi con più articoli | Crimson Desert 308, Fortnite 109, EA Sports FC 27 96, Hades II 81, Saros 64, Ghost of Yōtei 51 |
| Autori | 1 (ilplatinatore) |
| Ritmo | 5 articoli su Warzone il solo 15 ottobre 2026 |
| Indirizzi | `/AAAA/MM/GG/slug/`, `/category/…`, `/tag/…`, immagini in `/wp-content/uploads/` |
| Home | articolo in evidenza, griglia di schede, recenti, nuvola di tag, paginazione |
| Canali | YouTube. Nessuna newsletter, nessuna pubblicità visibile |

Conseguenze:
- Gli **hub per gioco** del PDF (sezione 04) hanno già la materia prima. Un tag come Crimson Desert raccoglie 308 guide che oggi si leggono solo in ordine di data.
- La migrazione deve **conservare 1.704 indirizzi indicizzati** su Google. Un errore qui costa traffico da un giorno all'altro.

## 3. Base vincolante: il PDF, tradotto in componenti

| PDF | Cosa costruire | Note di realizzazione |
| --- | --- | --- |
| 01 Home modulare | Moduli con scopi diversi e forme diverse: apertura editoriale, guide del momento, evergreen, sfida, accessi ai giochi | Niente griglia di schede tutte uguali. "Breaking" solo se c'è una notizia vera |
| 02 Guide del momento / evergreen | Tre moduli con criterio dichiarato: Guide del momento, Dalla biblioteca, Guide aggiornate. Sezione giochi storici | "Del momento" da dati veri (Search Console, GA4) e periodo dichiarato |
| 03 Scheda riassuntiva | Difficoltà, durata, partite, mancabili, online, in testa alla guida; versione mini su schede e archivio | Campi strutturati, non testo libero. Dati del gioco separati dal progresso del lettore |
| 04 Hub del gioco | Template gioco, saga, esigenza. Nel gioco: presentazione, piattaforme, dati del completamento, Inizia qui, guida al platino, guide specifiche, news separate | I 129 tag diventano hub. Filtri iniziali: gioco e tipo di aiuto |
| 05 Progressione | Barra compatta: completati/totale, Indice, Da completare, Riprendi, Inizio. Progresso per sezione | Salvataggio nel browser nella prima versione, dichiarando che non è sincronizzato con PSN |
| 06 Tabelle collezionabili | Stato, elemento, area, prerequisito, link alla soluzione. Solo mancanti, filtro area, spoiler, prossimo elemento, reset con conferma | Niente mappa nella prima fase. Contatore per raccolta e generale; platino ≠ 100% |
| 07 Correlati contestuali | Riquadri "Prima di continuare", "Procedura dettagliata", "Prossimo obiettivo", ciascuno con il perché | Relazioni scritte dalla redazione, non per tag condiviso |
| 08 Mini-gioco | Un formato iniziale; soluzione sempre visibile; rimando all'hub | Cadenza settimanale. Verificare i diritti delle copertine |
| 09 Composizione home | L'ordine dei 9 moduli del PDF | Testata: logo, Giochi, Guide, News, Sfide, ricerca |
| 10 Prototipo | Un gioco già coperto: hub, guida con scheda, checklist, tabella mancanti, 2 correlati, mini-gioco. In home solo 3 moduli | Candidato naturale: Crimson Desert (308 articoli). Criteri di verifica del PDF = definizione di "finito" |

Punto tecnico decisivo: **checklist, tabelle e scheda riassuntiva funzionano solo con dati strutturati**. Oggi le guide sono testo libero di WordPress, quindi servono campi dedicati (vedi sezione 6).

## 4. Reference aggiuntive

Le reference del PDF sono di **comportamento**: il PDF stesso avverte che non sono un'analisi di layout, animazioni o comportamento su telefono. Queste le completano. Per ognuna: a cosa serve e cosa si è potuto verificare.

**Primo compito dell'agente**: aprirle davvero, confermare o scartare ciascuna con una riga di motivazione, e riportarle nello stesso schema del PDF (reference → funzionalità → proposta di utilizzo).

### 4.1 Trofei: lo standard che i lettori conoscono già

| Reference | A cosa serve | Verificato |
| --- | --- | --- |
| [PowerPyx, guida Valor Mortis](https://www.powerpyx.com/valor-mortis-trophy-guide-roadmap/) | Formato della scheda in testa alla guida: difficoltà su 10, ore stimate, trofei offline e online con dettaglio per tipo, numero e nomi dei mancabili, trofei con bug. Il Platinatore copre lo stesso gioco: confronto diretto | Sì, letta il 15/10 |
| [PSNProfiles, guide](https://psnprofiles.com/guides) | Roadmap per fasi, consigli trofeo per trofeo, valutazioni dei lettori | No: il sito blocca i lettori automatici. Da aprire in un browser |
| [PlayStationTrophies.org](https://www.playstationtrophies.org/) | Guide al platino con difficoltà e durata stimate dalla comunità | No: blocco automatico |
| [Exophase](https://www.exophase.com/) | Elenco trofei per gioco e tracciamento del progresso | No: blocco automatico |

### 4.2 Hub e wiki: giochi con centinaia di pagine

| Reference | A cosa serve | Verificato |
| --- | --- | --- |
| [Game8, hub Elden Ring](https://game8.co/games/Elden-Ring) | Come si organizzano centinaia di guide su un gioco: indice numerato in testa, "Guide consigliate", procedura divisa per regione con livello consigliato, categorie (boss, armi, build, mappe, DLC…), "Guide Index" ripetuto in barra laterale e piè di pagina, stessa guida collegata da più categorie, data di aggiornamento | Sì, letta il 15/10 |
| [Game8, home](https://game8.co/) | Strumenti per gioco (mappa interattiva, checklist, tier list, pianificatore build) e "watchlist" per gli aggiornamenti delle guide | Sì |
| [Fextralife](https://fextralife.com/) | Wiki di gioco classiche: navigazione per categorie molto profonda | No: sito non raggiungibile al momento |

Da Game8 il modello per un hub come Crimson Desert: indice in testa, "Inizia qui", procedura per zone, categorie, data di aggiornamento visibile.

### 4.3 Lettura e impaginazione

Le guide sono il 90% del sito: conta come si legge un articolo lungo, soprattutto da telefono.

| Reference | A cosa serve | Verificato |
| --- | --- | --- |
| [Polygon](https://www.polygon.com/) | Oltre alle raccolte citate nel PDF, impaginazione editoriale moderna di articoli e guide | No: non raggiungibile da qui, da aprire in un browser |
| [The Verge](https://www.theverge.com/) | Home editoriale con identità forte: notizia principale, flusso rapido, moduli di sezione | Raggiungibile, contenuto non leggibile in automatico |
| [Eurogamer, guide](https://www.eurogamer.net/guides) | Pagina guida pulita e leggibile, hub di guide per gioco | Raggiungibile, contenuto non leggibile in automatico |

### 4.4 Concorrenti italiani, per Google

Servono a capire come il Platinatore compete sulle stesse ricerche in italiano, non a copiarne il design.

| Reference | Cosa mostra | Verificato |
| --- | --- | --- |
| [Everyeye.it](https://www.everyeye.it/) | Menu per piattaforma, schede gioco ([esempio](https://www.everyeye.it/giochi/elden-ring/)), home con notizia in evidenza, recensioni, flusso cronologico, più letti, classifica giochi. **Nessuna sezione guide visibile in home** | Sì, letta il 15/10 |
| [Multiplayer.it](https://multiplayer.it/) | Filtro per piattaforma, sezione giochi ([esempio](https://multiplayer.it/giochi/grand-theft-auto-vi-gta-6.html)), flusso notizie, live, sondaggi, più letti. **Nessuna sezione guide visibile in home** | Sì, letta il 15/10 |
| [SpazioGames](https://www.spaziogames.it/) | Terzo grande sito italiano | No: blocco automatico |

Osservazione da verificare con i dati di Search Console: i grandi siti italiani puntano su notizie e recensioni, non sulle guide. Per le ricerche di guide in italiano il Platinatore può essere il riferimento.

### 4.5 Dati di gioco

| Reference | A cosa serve | Verificato |
| --- | --- | --- |
| [HowLongToBeat](https://howlongtobeat.com/) | Riferimento per le durate, da citare come fonte. Non copiare dati senza verificarne i termini d'uso | Raggiungibile |

**Da non usare**: le gallerie di landing page (landdding, lapa.ninja, saaslandingpage, land-book) e deck.gallery. Sono pensate per prodotti SaaS e porterebbero fuori strada.

## 5. Strumenti e skill: cosa usare e quando

| Strumento | Uso | Quando |
| --- | --- | --- |
| **impeccable** | Metodo: PRODUCT.md e DESIGN.md prima del codice, poi shape, critique, audit, polish. Tipo di progetto misto: editoriale per la home, strumento per guide, checklist e tabelle | Dall'inizio e a ogni fase |
| **redesign-existing-projects** | È il suo caso: sito esistente, prima analisi poi cambio | Prima del design |
| **design-taste-frontend**, **ui-ux-pro-max** | Gusto e regole anti-slop; palette, tipografia, accessibilità | Durante il design |
| **Skill SEO** (seo-audit, seo-technical, seo-schema, seo-sitemap, seo-programmatic, seo-content, seo-images) | **Priorità numero uno.** Analisi prima della migrazione, mappa dei redirect, dati strutturati, sitemap; seo-programmatic per gli hub generati in serie | Prima di tutto, e prima della messa online |
| **shadcn/ui** | Fondamenta: checkbox, tabs, accordion, finestra di conferma del reset, ricerca a comandi, pannello mobile. Ripuliti dai colori demo e portati sui token del sito | Componenti |
| **React Aria** | Riserva per i componenti più complessi (tabelle filtrabili, ricerca con suggerimenti) se Radix/shadcn non bastano per l'accessibilità | Solo se serve |
| **transitions.dev** (+ transitions-polish) | Spunta della checklist, contatore che sale, accordion, tab, toast "salvato", scossa d'errore nel mini-gioco | Interazioni |
| **Skill di Emil Kowalski** (animate, review-animations, emil-design-eng, mobile-native, break-ui) | Movimento sensato, telefono, casi limite. break-ui è indispensabile: i titoli dei giochi sono lunghissimi | Interazioni e verifica |
| **dataviz** | Barre e indicatori di progresso | Progressione |
| **Magic UI, Aceternity** | Pochissimo, come idee riscritte in CSS: al massimo in home e nel mini-gioco. Su un sito editoriale l'effetto "wow" rallenta e distrae | Raramente |
| **webapp-testing** (Playwright) | Prove su telefono e computer, spunte che persistono, nessuno scroll orizzontale | Ogni fase |
| **animos.app** | Video promozionali delle nuove funzioni per YouTube e social | Lancio |
| **DialKit** | Taratura delle animazioni, solo in sviluppo | Facoltativo |
| **21st.dev** | Ricerca visiva di componenti, senza importarli così come sono | Facoltativo |

**Da non usare**: MUI, Chakra, Mantine, HeroUI. Sono librerie complete e pesanti; ne basta una base (shadcn), e mescolarle peggiora la velocità. Tremor: solo se dataviz non basta.

## 6. Base tecnica (dal progetto axialoop.com)

- **Front-end**: Next.js 16 (App Router), Tailwind v4 con token di design in `@theme`, font in locale con `next/font/local`. Pagine statiche. JavaScript solo dove serve davvero (checklist, tabelle, ricerca, mini-gioco). Animazioni in CSS dove possibile. Consenso cookie nostro, Analytics solo dopo il consenso.
- **WordPress resta come CMS, ma dietro le quinte (headless)**. Con 1.704 articoli, cinque uscite al giorno e un autore abituato a WordPress, spostare tutto in file sarebbe un errore. L'autore scrive in WordPress; il sito legge i contenuti tramite API e si aggiorna da solo a ogni pubblicazione (rigenerazione su richiesta).
- **Dati strutturati in WordPress**: i campi della scheda riassuntiva, gli elementi delle checklist e delle tabelle e le relazioni dei correlati in campi dedicati (per esempio ACF), non nel testo.
- **EvalisDeck fa già WordPress headless con Next.js.** Chiedere alla sua sessione Claude (nome `evalisdeck-b0`) i file già scritti. Repo: `C:\Users\user\evalisdeck`, cartelle `src\features\blog\` e `src\components\blog\`: loader, pulizia dell'HTML, indice dei contenuti, metadati e JSON-LD, archivi, sitemap.
- **Migrazione SEO prima del design**:
  - stessi indirizzi `/AAAA/MM/GG/slug/`, oppure redirect 301 uno per uno;
  - titoli e descrizioni importati da Yoast;
  - dati strutturati per articoli, guide e breadcrumb;
  - sitemap e `llms.txt`;
  - prima della messa online, confronto automatico di tutti i 1.704 indirizzi vecchi con quelli nuovi.
- **Velocità**: immagini ottimizzate e servite nella misura giusta, nessuna libreria pesante, hub e articoli statici. Obiettivi misurati con PageSpeed **sul sito vero**, non solo in locale (su Axialoop la misura locale è risultata poco affidabile): LCP < 2,5 s, CLS < 0,1, INP < 200 ms.

## 7. Metodo (quello che ha funzionato su Axialoop)

1. **PRODUCT.md e DESIGN.md** scritti prima del codice (impeccable teach), confermati da chi gestisce il sito.
2. **Varianti sull'anteprima con un selettore**, una sezione alla volta: chi decide le confronta dal vivo, anche da telefono, e sceglie o combina. Mai proporre a parole o con immagini statiche.
3. **Prima il telefono**: ogni sezione nasce a 375 px.
4. **Controlli automatici a ogni passaggio**: build, lint, accessibilità (axe), nessuno scroll orizzontale, Lighthouse.
5. **Punto di ripristino** (tag git) prima di ogni messa online.
6. **Lavoro coordinato con le altre sessioni** che hanno già risolto un problema (EvalisDeck per WordPress headless, FinBeacon per la redazione automatica), chiedendo prima di reinventare.
7. **Testi**: niente trattini lunghi, niente numeri senza fonte, titoli con la prima lettera maiuscola e il resto minuscolo all'italiana.

## 8. Fasi di lavoro

1. **Analisi**: skill SEO sul sito attuale, inventario degli indirizzi, dati Search Console e GA4, studio delle reference (sezione 4).
2. **Fondamenta**: PRODUCT.md, DESIGN.md, collegamento headless a WordPress, campi strutturati, redirect.
3. **Prototipo del PDF (sezione 10)**: un gioco (proposta Crimson Desert) con hub, guida con scheda, checklist persistente, tabella dei mancanti, 2 correlati, mini-gioco. In home solo 3 moduli: guide del momento, evergreen, sfida.
4. **Verifica con i criteri del PDF**:
   - le spunte aggiornano il contatore e restano al ritorno;
   - indice e barra non coprono i titoli e funzionano da telefono e tastiera;
   - stati e completamento non affidati al solo colore;
   - spoiler, reset, dati mancanti e differenze fra versioni gestiti;
   - si misura l'uso degli strumenti, non solo la permanenza.
5. **Estensione**: gli altri hub, la home completa del PDF (sezione 09), le pagine archivio.
6. **Migrazione e messa online**: controllo di tutti gli indirizzi, PageSpeed sul sito vero, punto di ripristino.

## 9. Domande aperte (da chiudere prima del codice)

1. WordPress resta il CMS per chi scrive? (Consigliato: sì, headless.)
2. Pubblicità o affiliazioni previste? Cambiano layout e velocità.
3. Progresso dei lettori: basta il salvataggio nel browser nella prima versione, o servono account?
4. Accesso a Search Console e GA4 del sito, per "Guide del momento" e per le priorità SEO?
5. Copertine per il mini-gioco: con quali diritti si possono usare?
6. Chi approva le varianti sull'anteprima?
7. Hosting attuale e dominio: dove andrà il nuovo front-end (per esempio Vercel)?

## Fonti consultate il 15/10/2026

- [Il Platinatore, home](https://www.ilplatinatore.it/) e [sitemap](https://www.ilplatinatore.it/sitemap_index.xml); API pubblica WordPress (`/wp-json/wp/v2/`) per conteggi di articoli, categorie e tag
- [PowerPyx, Valor Mortis Trophy Guide & Roadmap](https://www.powerpyx.com/valor-mortis-trophy-guide-roadmap/)
- [Game8, home](https://game8.co/) e [hub Elden Ring](https://game8.co/games/Elden-Ring)
- [Everyeye.it](https://www.everyeye.it/)
- [Multiplayer.it](https://multiplayer.it/)
- Non leggibili in automatico (da aprire in un browser): PSNProfiles, PlayStationTrophies.org, Exophase, SpazioGames, TrueAchievements, GAMES.GG, Polygon, The Verge, Eurogamer, Fextralife
