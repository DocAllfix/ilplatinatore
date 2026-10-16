# Fase 0: analisi del sito, SEO, reference e decisioni

Misure del 15/10/2026, tra le 18:40 e le 19:20, fatte dall'esterno e in sola lettura: REST API pubblica, sitemap di Yoast, pagine pubbliche, un browser vero (Playwright) a 390 px. Nessuna scrittura su Aruba, WordPress, DNS o Vercel.

File collegati:
- `docs/analisi/inventario-url.csv`: 2.495 righe, cioè tutti gli indirizzi oggi raggiungibili (articoli, pagine, archivi con la loro paginazione, feed, sitemap, file alla radice) più i modelli di indirizzo che WordPress accetta (`/?s=`, archivi per data, `/<slug>/`, `/embed/`, `/?p=`).

---

## 1. Cosa è cambiato rispetto a `01-progetto.md`

| Voce | In `01` | Oggi | Note |
|---|---|---|---|
| Articoli | 1.702 | **1.710** | sitemap e API coincidono (1.710 su 1.710) |
| Immagini | 1.814 | 1.818 | |
| Categorie | Guide 1.536, News 136, Uncategorized 12, Approfondimenti 11, Videogiochi 8 | Guide **1.543**, News 136, Uncategorized 12, Approfondimenti **12**, Videogiochi 8 | un articolo sta in due categorie |
| Tag | 129 | 129, di cui **2 vuoti** (`lego-batman-the-dark-knight`, `warhammer-40`), fuori sitemap | sitemap dei tag: 127 |
| Articoli senza tag | non rilevato | **21**, tra cui tutti gli articoli su Castlevania: Belmont's Curse usciti oggi | un gioco nuovo nasce senza tag, quindi senza hub |
| Tag che non sono giochi | «Novità» | Novità (68), Playstation 5 (17), Xbox (9), Nintendo Switch (4) | più tag doppi: tre per LEGO Batman, due per Warhammer |
| Ritmo | 3–5 al giorno | **5–30 al giorno** (30 il 10/10, 26 il 14/10, 20 il 15/10); 204 articoli in ottobre | pesa su webhook, rigenerazioni e importazione incrementale |
| Forma degli indirizzi | `/AAAA/MM/GG/slug/` | confermata per 1.710 su 1.710, slug tutti ASCII minuscoli, URL più lungo 155 caratteri | |
| Indirizzi non elencati in `01` | | archivi per data `/AAAA/`, `/AAAA/MM/`, `/AAAA/MM/GG/` (noindex); `/comments/feed/`; feed per tag e categoria; `/…/embed/` (63 iframe interni li usano); `/?p=<id>` → 301; `/<slug>/` senza data → **301 all'articolo**; slug con maiuscole → 200 con canonical minuscolo; `/wp-sitemap.xml` → 301 | vanno decisi uno per uno (sezione 2.2) |
| `llms.txt` | da creare | **esiste già**, generato da Yoast 28.7 | Yoast è alla 28.7 |
| `robots.txt` | da mantenere | **nessuna riga `Sitemap:`**; `Disallow` su `/privacy-policy/` (che è in sitemap e `index`) e su due pagine inesistenti (`/cookie-policy/`, `/Redazione-e-contatti/`, entrambe 404) | da correggere nel sito nuovo, non copiare |
| `ads.txt` | circa 1.000 righe | 1.011 righe, `managerdomain=hbagency.it`, `ownerdomain=ilplatinatore.it`, 29 righe google.com | md5 `9ea4cc6b…` per il confronto di parità |
| Spazi pubblicitari | 2 nella home | home: 2 (piè di pagina adesivo, interstitial); **articolo: 8** posizioni di Advanced Ads: prima del contenuto, dopo il paragrafo N, `contenuto-2`, `contenuto-4`, video outstream dopo il 5° paragrafo, dopo il contenuto, interstitial globale, piè di pagina adesivo | elenco completo in sezione 2.4 |
| Banner dei cookie | «da verificare» | **c'è, ed è un CMP certificato IAB TCF** (1.032 partner), caricato dallo script di HB Agency | risponde in buona parte a D3 |
| Analytics | GA4 via Site Kit | tag Google `GT-NS4PBCN4` via Site Kit, più Burst | |
| Tempi di risposta | 0,5–0,8 s a caldo, ~4 s a freddo | home in cache 0,16–0,24 s; articoli **a freddo 0,8–2,0 s**, a caldo 0,25 s; archivio tag 1,8 s; ricerca 3,2 s; REST 100 post 4,5 s | header `X-Aruba-Cache: HIT/MISS` |
| Peso | home 111 KB, 27 script | home 112 KB e 27 script; articolo 113 KB e 30 script. Nel browser, da telefono: **circa 200 richieste, 2 MB, circa 50 domini terzi** | misura di laboratorio, sezione 2.5 |

Le reference che il brief dava per non leggibili (PSNProfiles, PlayStationTrophies, Exophase, Fextralife, Polygon, SpazioGames) **si aprono** in un browser vero; solo la pagina di gioco di PlayStationTrophies risponde 403.

---

## 2. Analisi SEO

Fatta con il metodo della skill `seo-audit` (tecnica, contenuti, on-page, schema, sitemap, prestazioni, immagini, ricerca AI), in linea e non con sottoagenti. PageSpeed Insights non era interrogabile (quota giornaliera esaurita senza chiave): le prestazioni sono misurate in laboratorio con Playwright e vanno riconfermate con i dati di campo di Search Console.

**Punteggio indicativo: 69/100.** Tecnica 80, contenuti 70, on-page 65, schema 60, prestazioni 45, immagini 85, ricerca AI 70, con i pesi della skill. Serve come punto di partenza da battere, non come giudizio.

### 2.1 Cosa sta in piedi e va conservato com'è

- Canonical corretto e uguale al link su 1.710 articoli su 1.710; `index, follow` su tutti.
- Titoli Yoast unici (0 duplicati); descrizioni presenti su 1.683 articoli.
- Schema Yoast completo sugli articoli: `Article`, `WebPage`, `ImageObject`, `BreadcrumbList`, `WebSite`, `Organization`, `Person` (con `wordCount`, `articleSection`, `dateModified`).
- `noindex, follow` già su ricerca e archivi per data.
- Redirect: `http` e dominio nudo → `https://www.` con un solo salto; senza barra finale → con barra; `/?p=` e `/<slug>/` → articolo.
- `lang="it-IT"`, viewport corretto, tutte le immagini con `alt`.

### 2.2 Indirizzi da conservare (priorità)

| Gruppo | Quanti | Cosa fare nel sito nuovo |
|---|---|---|
| Articoli `/AAAA/MM/GG/slug/` | 1.710 | identici, con barra finale; verifica di parità su ognuno |
| Home e paginazione `/page/N/` | 171 | identici |
| Categorie e paginazione | 5 + 169 | identici |
| Tag e paginazione | 129 + 120 | identici finché non si decide D8; i 2 tag vuoti oggi danno 200: 410 o 301 al tag giusto |
| Autore e paginazione | 1 + 170 | identici |
| Pagina privacy | 1 | identica |
| `/feed/`, `/comments/feed/`, feed di tag e categorie | | `/feed/` obbligatorio; gli altri feed: 301 a `/feed/` o all'archivio (da decidere) |
| Sitemap Yoast (`/sitemap_index.xml` e figlie) | 7 | stessi nomi, generati dal frontend: Search Console le conosce già |
| `ads.txt`, `robots.txt`, `llms.txt` | 3 | `ads.txt` identico e aggiornabile; `robots.txt` corretto (riga `Sitemap:`, niente `Disallow` su pagine inesistenti); `llms.txt` rigenerato |
| `/<slug>/` senza data | modello | **301 all'articolo**, come oggi: link incollati a mano, condivisioni, AI possono usarlo |
| Slug con maiuscole | modello | 301 alla forma minuscola (Next risponderebbe 404) |
| `/…/embed/` | modello | 301 all'articolo; nel corpo, gli iframe di incorporamento diventano una scheda di collegamento nostra |
| `/?p=<id>` | modello | 301 all'articolo |
| Archivi per data | modello | oggi `noindex`; proposta: 301 alla home o all'archivio Guide, oppure mantenerli `noindex` |
| `/?s=` | modello | pagina di ricerca propria, `noindex` (D5) |
| Slug e date cambiati (`_wp_old_slug`, `_wp_old_date`) | da contare sul database | servono la copia completa e il mu-plugin esteso alle date |

### 2.3 Problemi trovati, in ordine di gravità

**Alta**
1. **Il markup pubblicitario di Advanced Ads è dentro `content.rendered` della REST su tutti i 1.710 articoli** (classi `ilpla-…`, `hbagency_space_…`). Il frontend lo riceverebbe nel corpo. La sanificazione deve toglierlo e gli spazi vanno ricreati come componenti nostri; meglio ancora, sul CMS di lavoro si spegne l'iniezione per le richieste REST. Non è previsto in `03`.
2. **Un gioco nuovo nasce senza tag** (Castlevania, 5 articoli oggi), e 21 articoli in tutto non hanno tag. Con gli hub costruiti sui tag, questi articoli restano fuori dal sistema. Serve una regola di redazione, valida anche per wpvibe, e un controllo automatico che segnali gli articoli senza gioco.
3. `robots.txt` senza `Sitemap:` e con `Disallow` su `/privacy-policy/`, pagina in sitemap e `index`: segnale contraddittorio.
4. **Mancano pagine di identità editoriale** (chi siamo, redazione, contatti): `robots.txt` cita `/Redazione-e-contatti/`, che non esiste. Per un sito di guide con un solo autore `ilplatinatore` e pubblicazione assistita da AI è il punto più debole di E-E-A-T.

**Media**
5. Home: titolo «🎮 Il Platinatore -» (trattino finale vuoto), nessuna descrizione. Archivi dei tag: titolo «Crimson Desert Archivi», nessuna descrizione, `og:type` article. Gli hub sono l'occasione per sistemarli.
6. Nel corpo degli articoli: **150 link con `?utm_source=chatgpt.com`**, 3 link interni rotti (404), 2 link a `/wp-admin/post.php`, 1 link `?p=`. Pulizia da fare sul CMS di lavoro, non in produzione.
7. 27 articoli senza descrizione Yoast, 2 descrizioni duplicate, 18 descrizioni oltre 160 caratteri.
8. Collegamenti interni deboli: 712 articoli su 1.710 linkano almeno un altro articolo; 998 non ne linkano nessuno. È esattamente ciò che i correlati contestuali del PDF (07) e gli hub (04) risolvono.
9. Schema: solo `Article`. Per gli hub servirà `CollectionPage` con `ItemList`; per le schede del gioco `VideoGame` come `about`. Niente `HowTo` né `FAQPage` (Google non li mostra più per questi siti).

**Bassa**
10. 134 articoli sotto le 500 parole (3 sotto le 300): non sono pagine sottili per una guida puntuale, ma vanno guardati negli hub.
11. `xmlrpc.php` risponde 200 su Aruba (sul CMS nuovo sarà chiuso).

### 2.4 Pubblicità: cosa si vede oggi da telefono

Dopo il consenso, un articolo mostra insieme un interstitial a tutto schermo, un banner adesivo in basso, un banner laterale che copre parte del testo e annunci nel corpo. La tabella riassuntiva della guida finisce sotto l'interstitial. Per il sito nuovo è il vincolo di layout più forte: gli spazi vanno riservati da subito (`02`, Fase 1A), e conviene chiedere a HB Agency quali formati sono indispensabili alla resa.

Posizioni di Advanced Ads ricavate dalle classi: `prima-del-contenuto` (304962), `contenuto` (304795), `contenuto-2` (304796, inpage), `contenuto-4` (304968, inarticle), `hba-video-outstream-dopo-5-paragrafo` (345270), `dopo-il-contenuto` (304792), `hba-interstitial-globale` (304794), `footer` (304793).

### 2.5 Prestazioni (laboratorio, da confermare con dati di campo)

Telefono emulato (Pixel 7), rete veloce: LCP circa 3,0–3,4 s su articolo e tag, e l'elemento più grande è il banner del consenso; CLS 0 prima del consenso. Con rete e processore rallentati il CLS sale a 0,10–0,11 dopo il consenso e lo scorrimento, cioè sulla soglia. Circa 200 richieste e 2 MB per pagina.

**Da verificare**: già prima di qualsiasi scelta nel banner partono richieste verso circa 50 domini terzi. Può trattarsi del CMP e di richieste senza dati personali, ma va controllato: il sito nuovo deve rispettare la regola di `03`, sezione 5 (nessuna richiesta verso terzi prima della scelta), e qui la regola dipende anche da come si comporta lo script di HB Agency.

### 2.6 Ricerca AI

`llms.txt` esiste (Yoast) ma elenca solo 5 articoli e 3 categorie; nessun blocco ai crawler AI in `robots.txt`. Le guide sono già scritte per domande precise («come», «dove trovare»): con la scheda riassuntiva in testa diventano facili da citare.

---

## 3. Reference del brief (sezione 4), nello schema del PDF

Aperte tutte il 15/10/2026 in un browser vero a 390 px, con banner del consenso chiuso; viste le schermate.

### 3.1 Trofei

**PowerPyx, guida Valor Mortis**: confermata.
- Funzionalità: in testa un elenco fisso di 13 voci (difficoltà su 10, ore al platino, trofei offline con dettaglio per tipo, online, mancabili per nome, trofei con bug, effetto della difficoltà, trofeo più difficile, partite minime, versioni PS4/PS5, free roam dopo la storia, New Game+, salvataggi manuali); poi roadmap a passi; poi indice dei capitoli della guida ai collezionabili.
- Proposta: è la base dei campi della scheda riassuntiva (PDF 03). **La guida di Il Platinatore allo stesso gioco ha già una tabella con gli stessi dati** (difficoltà 5/10, 15–25 ore, partite minime 1): i campi si possono ricavare dagli articoli esistenti. Aggiungere tre voci che PowerPyx tratta in prosa: free roam, salvataggi, differenze fra versioni.

**PSNProfiles, guide**: confermata (si apre, il brief diceva di no).
- Funzionalità: testata della guida con tre numeri grandi (difficoltà, partite, ore); poi i trofei raggruppati per natura (storia, accumulabili, mancabili, online, collezionabili, grind) come righe di icone; valutazioni dei lettori.
- Proposta: il raggruppamento dei trofei per natura diventa il filtro della checklist (PDF 05) e risponde alla domanda «cosa posso perdere?». Scartate le valutazioni dei lettori: il sito ha zero commenti e nessun account.

**PlayStationTrophies.org**: scartata. Home e portale guide si aprono, la pagina di gioco risponde 403; quello che si vede è un portale con forum che non aggiunge nulla a PSNProfiles.

**Exophase**: scartata. Mostra statistiche di comunità (trofei ottenuti, giocatori tracciati) e un tracciamento automatico tramite account: dati che non abbiamo e un modello che il PDF esclude (tracciamento manuale, PDF 05).

### 3.2 Hub e wiki

**Game8, hub Elden Ring**: confermata.
- Funzionalità: sotto la testata, una griglia di 12 categorie (procedura, mappa, boss, armi, build…) toccabili col pollice; una ricerca «dentro il gioco»; «Last updated» in vista; un indice tabellare ripetuto più in basso.
- Proposta: testata dell'hub (PDF 04) con griglia di accessi per tipo di aiuto (che è anche il primo filtro chiesto dal PDF), ricerca limitata al gioco e data di aggiornamento in vista.

**Game8, home**: confermata in parte.
- Funzionalità: «Bookmark» e watchlist dei giochi (con account); sezione **Daily Games**, mini-giochi quotidiani.
- Proposta: la watchlist resta fuori dalla prima versione (servono account). I Daily Games confermano che il mini-giochi (PDF 08) è una formula riconosciuta su un sito di guide.

**Fextralife**: confermata in parte (oggi raggiungibile).
- Funzionalità: una wiki per gioco, con menu di categorie che scorre in orizzontale su telefono.
- Proposta: il menu orizzontale per le categorie dell'hub su telefono. Scartata l'estetica (scura, decorata, testo in maiuscolo).

### 3.3 Lettura e impaginazione

**Eurogamer, guide**: confermata, la più utile per la pagina guida.
- Funzionalità: briciole Home › Guides › Gioco; sottotitolo che dice cosa si trova; «Guide di [autore], ruolo» con «Updated on» data e ora; pulsante «Segui [gioco]»; portale guide con «In evidenza» e blocchi per gioco.
- Proposta: testata della guida con tipo di aiuto, gioco, data di aggiornamento e firma; l'aggiornamento visibile sostiene il modulo «Guide aggiornate» (PDF 02). «Segui il gioco» solo quando ci saranno notifiche o account.

**The Verge**: confermata per un solo comportamento.
- Funzionalità: in testa alla home, schede «Top stories / Latest / Following».
- Proposta: separare la selezione editoriale dal flusso cronologico (PDF 01 e 09) con due schede, non con due colonne. Scartata l'identità visiva (tipografia enorme, colori acidi).

**Polygon**: confermata in parte.
- Funzionalità: home a card grandi con immagine; il portale guide mette il nome del gioco sopra il titolo di ogni guida, con l'autore.
- Proposta: l'etichetta del gioco sopra il titolo in ogni elenco di guide. Scartate le card a cornice colorata: con 5–30 uscite al giorno consumano spazio.

### 3.4 Concorrenti italiani

**Everyeye.it**: confermata come concorrente.
- Funzionalità: scheda gioco con piattaforme, data d'uscita, voto della redazione e degli utenti, «Segui»; niente guide in home.
- Proposta: i dati di base del gioco (piattaforme, uscita) in testa all'hub; niente voti, il sito non fa recensioni.

**Multiplayer.it**: confermata come concorrente. Consenso con opzione a pagamento («rifiuta e abbonati»), scheda gioco, nessuna sezione guide in home.

**SpazioGames**: confermata come concorrente (oggi raggiungibile). Notizie, provati, opinioni, sondaggi; nessuna sezione guide in home. L'osservazione del brief regge: i tre grandi siti italiani non presidiano le guide.

### 3.5 Dati di gioco

**HowLongToBeat**: confermata.
- Funzionalità: durate per stile di gioco; inoltre **HowLongToBeat: The Game**, un gioco quotidiano a indovinelli.
- Proposta: fonte citata delle durate nella scheda riassuntiva, con la condizione della stima (PDF 03), dopo aver verificato i termini d'uso. Il loro gioco quotidiano è un secondo riferimento per il PDF 08.

---

## 4. Il gioco del prototipo

| | Crimson Desert | Valor Mortis |
|---|---|---|
| Articoli | 308 | 26 |
| Guida al platino | sì (`/2026/03/10/crimson-desert-lista-trofei-durata-guida-platino/`) | sì, con tabella riassuntiva |
| Collezionabili con numero noto | 37 rovine, 16 santuari, 13 costellazioni, spire, 10 sfide di addestramento, minigiochi | collezionabili per capitolo (3 capitoli su 11 coperti) |
| Momento | uscito a marzo 2026 | uscito il 13/10/2026, in copertura adesso |
| Confronto diretto con PowerPyx | no | sì |

~~Proposta: Crimson Desert.~~ **Rivista il 16/10 dopo la lettura del database (sezione 5.5).** Le guide di Crimson Desert sono brevi e senza dati strutturati: la guida al platino ha 566 parole, 3 titoli e nessuna tabella; quella sulle 37 rovine ha 668 parole e non le elenca tutte. Le tabelle e la checklist andrebbero scritte da zero. La guida al platino di Valor Mortis ha 2.573 parole, 13 sezioni e 6 tabelle (67 righe), con la stessa scheda di PowerPyx già compilata. Proposta nuova: **Valor Mortis per gli strumenti** (scheda, checklist, tabelle), sapendo che la copertura è ancora in corso; Crimson Desert resta il caso migliore per provare un hub grande. Decide l'utente.

---

## 5. La copia completa (backup del 15/10/2026, ore 16:18)

File: `www-ilplatinatore-it-20261015-161803-i49fxeo8jwjp.wpress` (All-in-One WP Migration 7.112), 11,7 GB, nella cartella Download dell'utente. Letto in sola lettura: indice delle 22.391 voci, estratti solo `package.json` e `database.sql` in una cartella temporanea della sessione, database convertito in SQLite per le interrogazioni. Né l'archivio né il database stanno nel repository: contengono hash delle password, token e chiavi.

### 5.1 Composizione

| Parte | Peso | Cosa farne |
|---|---|---|
| `backuply/` | 9,3 GB, 35 file | vecchi backup completi (febbraio–aprile 2026). **Non si migrano.** Sul server Aruba rispondono 403, quindi non sono scaricabili |
| `uploads/2025`, `uploads/2026` | 1,8 GB, 13.893 file | le immagini vere: si migrano |
| `uploads/backup`, `ShortpixelBackups` | 330 MB | copie degli originali prima dell'ottimizzazione: non si migrano |
| `uploads/2020`–`2024`, `popularfx-templates`, `ansar_import_data` | pochi MB | immagini e dati demo dei temi: non si migrano |
| `database.sql` | 51 MB, 50 tabelle, prefisso reale `wpsd_` | si migra |
| plugin e temi | circa 90 MB | si reinstallano dalle fonti ufficiali, non si copiano |

Ambiente: WordPress 7.1.3, PHP 8.3.33, MySQL 8.0.45, utf8mb4.

### 5.2 Plugin attivi

Advanced Ads, Akismet, Aruba HiSpeed Cache, Backuply e Backuply Pro, Burst Statistics, Google Site Kit, Loginizer e Loginizer Security, wpvibe (`vibe-ai`), Yoast SEO. Mu-plugin: `burst_rest_api_optimizer.php`. Tema Blogread (figlio di Blogdata). Tracce di plugin e temi rimossi: Imagify, ShortPixel, Pagelayer, SiteSEO, UpdraftPlus, GoSMTP, SpeedyCache, PopularFX, Blogarise.

Sul CMS di Hetzner servono solo Yoast, wpvibe, Akismet ed eventualmente ACF. **Advanced Ads non va attivato**: è lui che inserisce il markup pubblicitario nel corpo restituito dalla REST, mentre il contenuto salvato nel database è pulito (0 articoli su 1.704 contengono markup pubblicitario). `ads.txt` oggi vive nelle sue impostazioni (`advanced_ads_ads_txt`, 45 KB) e va portato nel frontend.

### 5.3 Contenuti

- Articoli: 1.704 pubblicati, 5 programmati (usciti dopo la copia), 2 bozze, 1 nel cestino; 1.313 revisioni; 1 pagina.
- Formato: Gutenberg standard (paragrafi, titoli, liste, 370 tabelle, 77 incorporamenti, 81 immagini nel corpo); 48 articoli in HTML classico senza blocchi.
- 10 commenti, nessuno approvato (4 in attesa, 6 nel cestino): l'API mostra 0, coerente.
- Fuso orario: `gmt_offset = 2` fisso, senza nome del fuso. La data nell'indirizzo è quella locale (`post_date`): il frontend deve usare il campo `date` della REST e mai ricalcolarla da `date_gmt`, altrimenti gli articoli pubblicati poco dopo mezzanotte cambiano giorno nell'indirizzo.

### 5.4 Indirizzi cambiati

- `_wp_old_date`: 173 righe, ma **171 sono voci di menu**; gli articoli con data cambiata sono 2.
- `_wp_old_slug`: 8 righe; 7 su articoli pubblicati, 1 su un articolo nel cestino.
- I 9 indirizzi vecchi degli articoli pubblicati, provati dal vivo, rispondono tutti 301 verso l'indirizzo attuale: vanno riprodotti uguali.
- Nessun plugin di redirect e nessuna opzione di redirect di Yoast.

### 5.5 Statistiche di Burst (13/08–15/10/2026)

Burst non usa cookie e conta tutti i visitatori, a differenza di GA4. Dati: 14.104 visualizzazioni, 11.821 sessioni.

- **Media degli ultimi 28 giorni: 324 visualizzazioni al giorno**, in linea con il dato del proprietario.
- **Telefono 69%**, computer 31%.
- Provenienza: Google 6.672 sessioni, nessun referrer 2.677, Bing 1.020, DuckDuckGo 637, Brave 400; ChatGPT 32.
- Per tipo di pagina: articoli 94%, home 5%, **tag 74 visualizzazioni in due mesi**, ricerca 67. Gli archivi dei tag oggi quasi non sono visitati, quindi gli hub non hanno traffico da perdere.
- Per gioco, ultimi 28 giorni: **EA Sports FC 27 4.179** (circa il 45%), Crimson Desert 1.097, Fortnite 428, Ghost of Yōtei 407, Marvel's Wolverine 404, Control Resonant 235, Hades II 231. Valor Mortis è uscito il 13/10 e non è ancora rilevante.
- Pagina più vista: `/2026/09/19/fc-27-migliori-giocatori-buggati-economici/` (1.029 in 28 giorni).

Conseguenza per «Guide del momento»: Burst sul WordPress headless non vedrà più i lettori, perché il sito pubblico sarà Next.js. Le fonti possibili restano Search Console oppure un contatore aggregato nostro, senza cookie.

### 5.6 Utenti e accessi

- Due utenti: `ilplatinatore` (amministratore, autore di tutti gli articoli) e `Johnny` (autore, nessun articolo).
- wpvibe è collegato all'utente amministratore tramite un'application password. Per il CMS di Hetzner vale la regola di `01`: utente dedicato col ruolo Editor.
- L'application password ricevuta il 15/10 alle 21:51 è sull'utente `ilplatinatore` (nella copia non c'è perché creata dopo) e funziona via REST. La diagnosi «Aruba scarta l'intestazione Authorization», data prima di questa verifica, era sbagliata: il nome «Allfix» è il nome della password, non l'utente.

### 5.7 Navigazione

Un menu, «Menu 1», con 60 voci: le categorie News, Guide, Approfondimenti, Videogiochi e **56 giochi** scelti a mano. È il primo elenco curato di «quali tag sono giochi», con tre eccezioni da togliere (Playstation 5, Xbox, Nintendo Switch).

### 5.8 Pubblicità: i posizionamenti veri

9 posizionamenti attivi in Advanced Ads, tutti HB Agency:

| Posizionamento | Dove | Spazio |
|---|---|---|
| Header Banner | prima del contenuto | 304962 |
| In Image | dopo il 1° paragrafo | 304795 |
| Billboard 970×250 | dopo il 3° paragrafo | 304796 |
| Interscroller | dopo il 4° paragrafo | 304968 |
| Video Outstream | dopo il 5° paragrafo | 345270 |
| Mobile Leaderboard 320×100 | dopo il 7° paragrafo | 304970 |
| Floor Ad | dopo il contenuto (fisso in basso) | 304792 |
| Magic Left 300×600 | globale | 304793 |
| Interstitial | globale | 304794 |

Annunci disattivati sui singoli articoli: nessuno (`disable_ads = 0` su 1.400 articoli).

### 5.9 Immagini

1.818 allegati, nessun file originale mancante. Formati: WebP 834, JPG 620, AVIF 286, PNG 77, 1 PDF. Peso degli originali: mediana 138 KB, 90° percentile 555 KB, **massimo 35 MB**. WordPress genera già 9 misure per immagine (fino a 2048 px), quindi le immagini si possono servire senza l'ottimizzazione di Vercel, come prevede `03`.

---

## 6. Decisioni prese con l'utente il 16/10/2026

| # | Decisione | Note |
|---|---|---|
| Prototipo | **Valor Mortis** | guida al platino con 6 tabelle; copertura ancora in corso |
| D1 | **server Hetzner nuovo**, dedicato al Platinatore | l'utente lo acquista su indicazione delle specifiche |
| D2 | HB Agency, stesso script | restano da chiedere a HB: rinnovo al cambio pagina lato client, formati indispensabili, condizione sugli indirizzi nuovi |
| D6 | **tutti i tag indicizzati, come oggi** | nessuna soglia di noindex |
| D8 | **hub su `/tag/<slug>/`** | nessun redirect |
| Mini-gioco | **tre formati a rotazione da subito**: Indovina il trofeo, Riconosci il gioco, Riconosci il classico | diverge dal PDF (08: «scegliere un formato iniziale»), scelta consapevole dell'utente. Le copertine vanno verificate nei diritti prima del passaggio di dominio |
| Misure | contatore aggregato nostro, senza cookie né dati personali, più GA4 dopo il consenso (Fase 5) | |
| Metodo | **tutto si prova su un deploy `*.vercel.app` prima della migrazione**, e quel sito resta `noindex` | il noindex dipende da una variabile d'ambiente e un controllo automatico lo verifica |
| Approvazione | l'utente sceglie le varianti e mostra il link dell'anteprima al proprietario | |
| Commit | DocAllfix con email noreply di GitHub | |
| Vercel | progetto nuovo nel team «docallfix's projects», collegato al repository GitHub; l'utente fornirà un token | |

Ancora aperte: D3 e D4 (in attesa della risposta di HB Agency), D5 (ricerca: proposta pagina propria `noindex`), D7 (solo i record del sito su Aruba), D9 (ACF con `show_in_rest`), accesso a Search Console e GA4, visibilità del repository.
