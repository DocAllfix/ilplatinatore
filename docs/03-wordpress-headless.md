# WordPress headless — come funziona, come si installa, dove si sbaglia

Questo documento descrive un impianto **già in produzione e collaudato**: il blog headless di `evalisdeck.it` (e di Evalis Academy), costruito e mantenuto nella sessione che lavora in `C:\Users\user\evalisdeck`. Il codice esiste e si può leggere; qui c'è il perché di ogni pezzo e ciò che è costato errori veri.

Per Il Platinatore **lo schema è lo stesso**, con una differenza strutturale: là il blog sta sotto `/blog/<slug>` di un'app più grande, qui **il blog è tutto il sito** e gli articoli stanno alla radice, su `/AAAA/MM/GG/slug/`. Dove la differenza conta, è segnalato con ⚠️ PLATINATORE.

---

## 1. Lo schema in breve

```
                          ┌─────────────────────────── server Hetzner ───────────────────────────┐
Chi scrive ──HTTPS──►  Caddy (TLS, noindex, password su /wp-admin)  ──►  WordPress (Apache/PHP)  ──►  MariaDB
                          └──────────────────────────────────────┬───────────────────────────────┘
                                                                 │
                         1) REST API in lettura  ◄───────────────┤  (build e rigenerazioni)
                         2) webhook a ogni pubblicazione ────────┘  (POST al frontend, con token)
                                                                 ▼
                                          Next.js su Vercel  ──►  lettori e Google
```

Tre principi reggono tutto:

1. **Il CMS non esiste per il pubblico.** È `noindex` su ogni risposta, non ha sitemap e la dashboard sta dietro una password. Se Google lo indicizzasse, si troverebbe due copie di ogni articolo e potrebbe scegliere quella sbagliata.
2. **WordPress fornisce i VALORI, il frontend decide gli URL e la presentazione.** Ogni URL che arriva da WordPress (canonical, og:url, schema, link interni, immagini) viene riscritto dal dominio del CMS a quello pubblico.
3. **Ciò che tiene in piedi il posizionamento è uno STATO, non un evento.** Un aggiornamento di Yoast, un link incollato male o un canonical sbagliato possono rompere tutto in silenzio. Per questo ci sono controlli automatici dopo ogni pubblicazione e ogni giorno (sezione 7).

---

## 2. Il server del CMS

File di riferimento: `C:\Users\user\evalisdeck\infra\blog-cms\` (`docker-compose.yml`, `Caddyfile`, `db-init/`, `mu-plugins/`, `backup.sh`, `restore-test.sh`, `.env.example`, `LEGGIMI.md`). **Quella cartella è una fotografia del server, non il server**: quando si cambia il server, si aggiorna anche la copia nel repository, nello stesso commit.

### 2.1 I servizi (Docker Compose)

| Servizio | Immagine | Ruolo |
|---|---|---|
| `caddy` | `caddy:2-alpine` | HTTPS automatico (Let's Encrypt), intestazioni di sicurezza, password davanti alla dashboard, blocchi |
| `db` | `mariadb:11` | Un solo MariaDB, **uno schema e un utente di database per sito** |
| `wp-<sito>` | `wordpress:6-php8.3-apache` | Un contenitore WordPress **per sito**, con il proprio volume e la propria rete |

Scelte, con la ragione:

- **Una rete Docker per sito.** Con una rete sola, un WordPress compromesso potrebbe raggiungere l'altro dall'interno, dove non c'è Caddy né password. Con reti separate restano raggiungibili solo il database (con permessi per schema) e Caddy.
- **Uno schema e un utente di database per sito, fin dal primo giorno.** Un utente condiviso permetterebbe a un sito compromesso di leggere e riscrivere il database dell'altro. E separare dopo vorrebbe dire una migrazione con articoli veri dentro.
- **`WORDPRESS_CONFIG_EXTRA`** imposta le costanti che il mu-plugin legge:
  - `EVALIS_SITO_PUBBLICO`, `EVALIS_REVALIDATE_TOKEN`, `EVALIS_PREVIEW_TOKEN`;
  - la correzione per `X-Forwarded-Proto`: dietro Caddy, senza, WordPress genera URL in `http` e i redirect girano in tondo;
  - `DISALLOW_FILE_EDIT`, cioè niente editor di temi e plugin dalla dashboard;
  - `WP_AUTO_UPDATE_CORE = 'minor'`.
- **I mu-plugin sono montati in sola lettura**: si caricano sempre e non si disattivano dalla dashboard.
- **Una macchina piccola basta** (anche una CAX11 ARM): WordPress serve JSON a Next.js, non pagine a migliaia di visitatori.

### 2.2 Caddy

Per ogni dominio del CMS (`cms.ilplatinatore.it`):

- **`X-Robots-Tag: noindex, nofollow, noarchive, nosnippet` su OGNI risposta**, immagini e JSON compresi. È il blocco più importante.
- Intestazioni `nosniff`, `X-Frame-Options SAMEORIGIN`, `Referrer-Policy`, e niente `Server`.
- **Password (basic auth) su `/wp-admin*` e `/wp-login.php`**, davanti a WordPress. I bot che provano le password di WordPress sbattono su Caddy. Non si filtra per indirizzo IP: le connessioni di casa cambiano indirizzo, e chi lavora resterebbe chiuso fuori senza capire perché. Utente e hash arrivano dall'ambiente, ogni sito ha i suoi.
- **`/xmlrpc.php` → 403**: a un CMS headless non serve ed è il bersaglio più battuto.
- **`/wp-config.php`, `/.env`, `/debug.log`, `/readme.html`, `/license.txt` → 403.**
- **Le sitemap del CMS rispondono 404** (`/wp-sitemap*.xml`, `/sitemap*.xml`, `/sitemap_index.xml`, `/*-sitemap.xml`, `/sitemap.xsl`). Elencherebbero gli articoli sul dominio sbagliato. Il mu-plugin le spegne già, ma **un aggiornamento di Yoast le ha riaccese una volta**: qui la porta è chiusa a monte.
- **Prima di ricaricare: `caddy validate`.** Un errore di sintassi non spegne un sito, li spegne **tutti** quelli serviti da quel Caddy.

> ⚠️ PLATINATORE: la REST API deve restare **raggiungibile senza password** (il frontend la legge al build e alle rigenerazioni). La password copre solo dashboard e login.

### 2.3 Il file `.env` sul server

Contiene password del database, token e chiave dei backup. Sta **solo sul server**, a permessi `600`, e nel gestore di password. Nel repository va solo `.env.example`, con i nomi e senza valori.

⚠️ **Trappola**: `docker compose` espande `$nome` dentro il file `.env`. Una password che contiene `$` seguito da lettere arriva **troncata** al contenitore, senza errori né avvisi. Si raddoppia ogni `$` oppure si generano password senza `$` (`openssl rand -hex 32`).

### 2.4 Due strade per Il Platinatore (decisione D1 di `01-progetto.md`)

**(a) Terzo sito sulla macchina esistente.** Il `docker-compose.yml` è già predisposto: si copia il blocco di un sito cambiando nome, database, utente, volume e rete, si aggiunge lo schema in `db-init/`, si aggiunge il blocco host al `Caddyfile`, e si aggiunge la rete nuova a `db` e a `caddy`.
⚠️ `db-init/` gira **solo alla prima creazione** del volume del database. Su un database esistente schema e utente si creano a mano, con un comando SQL.
⚠️ Su quella macchina gira il blog di **Evalis Academy, in produzione**. Ogni intervento si fa sapendolo: `caddy validate` prima di ricaricare, nessun riavvio di servizi altrui, e la verifica dopo che gli altri siti rispondono ancora.

**(b) Server nuovo**, con la stessa composizione ridotta a un sito. Più pulita per amministrazione e responsabilità, costa pochi euro al mese.

### 2.5 Portare il WordPress attuale da Aruba al server nuovo

1. Copia completa: database e `wp-content` (vedi `01-progetto.md`, sezione 4).
2. Import del database nello schema nuovo, copia di `wp-content/uploads`, plugin e tema.
3. **Sostituzione del dominio nel database**, da `https://www.ilplatinatore.it` a `https://cms.ilplatinatore.it`, con `wp search-replace` (gestisce correttamente i dati serializzati; un `REPLACE` SQL li corromperebbe). Va fatto **dopo** aver deciso cosa resta del vecchio dominio: il frontend riscrive comunque ogni URL del CMS sul dominio pubblico.
4. In WordPress, Impostazioni → Lettura: «Scoraggia i motori di ricerca» acceso. È il secondo strato dopo l'header di Caddy.
5. **Il sito su Aruba resta acceso e intatto** fino a dopo il cambio: è la via di ritorno.

⚠️ Da quel momento si scrive **solo** sul CMS nuovo. Due WordPress in cui si pubblica in parallelo divergono: va concordato un momento di «redazione ferma» per l'ultima copia, oppure si ricopiano gli articoli pubblicati nel frattempo.

---

## 3. Il mu-plugin

File di riferimento: `infra/blog-cms/mu-plugins/evalis-headless.php`. È **un solo file per tutti i siti**: le costanti arrivano dall'ambiente, quindi una correzione vale ovunque. Fa cinque cose.

### 3.1 Avvisa il frontend quando si pubblica

- Agganci: `transition_post_status` (quando il nuovo o il vecchio stato è `publish`, cioè pubblicazione, modifica, ritorno in bozza) e `trashed_post`.
- Chiama `POST <SITO_PUBBLICO>/api/.../revalidate` con l'header `x-blog-token` e il corpo `{"slug": "..."}`, `timeout 8`, **`blocking => false`**: chi pubblica non aspetta il sito.
- ⚠️ **Da `wp-cli` il webhook NON parte**: con `blocking => false` il processo a riga di comando finisce prima che la richiesta esca. Dalla dashboard e dalla REST (wpvibe compreso) funziona. **Le prove della catena si fanno dalla dashboard o via REST**, mai da `wp-cli`, altrimenti si conclude che il webhook è rotto quando non lo è. Una pubblicazione in blocco da riga di comando va seguita da una chiamata esplicita al webhook.

### 3.2 Espone lo slug precedente

WordPress conserva gli slug vecchi in `_wp_old_slug` ma non li espone. La rotta pubblica `GET /wp-json/evalis/v1/slug-precedente?slug=<vecchio>` restituisce lo slug attuale, ma solo per articoli pubblicati. Il frontend, quando un indirizzo non esiste, la chiama e risponde con un redirect permanente invece di un 404.

> ⚠️ PLATINATORE: WordPress conserva anche le **date** vecchie (`_wp_old_date`), e qui la data è nell'indirizzo: un articolo ripubblicato con data nuova cambia URL. La rotta va estesa per cercare anche per data, oppure restituire il **link completo** (`get_permalink`) invece dello slug.

### 3.3 L'anteprima porta sul sito vero

Il filtro `preview_post_link` sostituisce il link d'anteprima con `<SITO_PUBBLICO>/api/.../preview?token=<PREVIEW_TOKEN>&slug=<slug>`. La rotta del frontend accende `draftMode` e mostra la bozza col design vero, leggendola con una **Application Password** di WordPress (solo lato server).

Il token d'anteprima è **separato** da quello del webhook: viaggia negli indirizzi (cronologia, referrer), quello del webhook non lascia mai il server.

### 3.4 «Visualizza articolo» porta al sito pubblico

Il filtro `post_link` riscrive il link dell'articolo sul dominio pubblico.

> ⚠️ PLATINATORE: nel riferimento produce `/blog/<slug>`. Qui deve produrre **`/AAAA/MM/GG/slug/`**, ricavando la data dal post, oppure più semplicemente sostituendo l'host nel permalink calcolato da WordPress (la struttura dei permalink resta `/%year%/%monthnum%/%day%/%postname%/`).

### 3.5 Niente indicizzazione né sitemap del CMS

- `wpseo_enable_xml_sitemap` → false (Yoast), `wp_sitemaps_enabled` → false.
- `xmlrpc_enabled` → false: è lo strato interno, dopo Caddy.

### 3.6 Campo «ruolo» dell'autore

Esposto in REST con `register_rest_field` (non basta `register_meta`) e contesto `embed`, altrimenti dentro `?_embed` arriva vuoto. Per Il Platinatore, con un autore solo, è facoltativo.

### 3.7 Trappola già pagata

**Non filtrare a mano l'elenco delle rotte REST** (`rest_endpoints`). Un filtro che dava per scontata una struttura che WordPress non ha ha mandato in **errore fatale tutta la REST API**: niente articoli, niente build. L'elenco degli utenti non va filtrato: a chi non ha fatto l'accesso WordPress mostra già solo gli autori con articoli pubblicati.

---

## 4. Il frontend Next.js

File di riferimento in `C:\Users\user\evalisdeck\src\features\blog\` e `src\app\api\blog\`. Ogni modulo ha in testa un commento che spiega le scelte: leggerli è la parte più utile.

### 4.1 Configurazione (`config.ts`)

**Tutto da variabili d'ambiente, nessun dominio scritto nel codice**: `CMS_URL`, `SITO_PUBBLICO`, le credenziali per le bozze. È ciò che permette di riusare lo stesso codice per un altro sito, cioè Quart4 Parete.

### 4.2 Lettura dal CMS (`wp.ts`)

- **Unico punto che tocca la rete.** Usa `?_embed` per avere autore, categorie e immagine in una chiamata invece di quattro.
- **Ritenta** sull'inciampo di rete, tre tentativi, poi si arrende.
- Cache di Next con etichetta (`tags: ["blog"]`) e un ricontrollo periodico. La pubblicazione immediata passa dal webhook.
- **Un errore si propaga, non si ingoia**: se il CMS non risponde durante il build, il build fallisce e resta online il sito precedente. Pubblicare un sito vuoto è molto peggio che non pubblicare.

> ⚠️ PLATINATORE: nel riferimento c'è in mezzo `fonte.ts`, un «ammortizzatore» che degrada invece di fallire, perché là il blog convive con un prodotto a pagamento che non deve fermarsi per colpa del blog. **Qui il blog è tutto il sito**: l'ammortizzatore non serve, e il build deve fallire se il CMS non risponde.

### 4.3 Traduzione dei dati (`mappa.ts`)

Funzioni **pure**, quindi testabili con un post finto:
- **decodifica delle entità HTML**, perché WordPress salva `Cos&#8217;&egrave;` nei titoli;
- tempo di lettura, calcolato dalle parole perché WordPress non lo ha;
- autore, categoria e tag da `_embedded`.

### 4.4 SEO (`seo.ts`), la funzione più importante

- `riportaSuPubblico` e `riscriviLinkInterni`: **ogni** riferimento al CMS (canonical, og:url, schema, link nel corpo, `src` e `srcset` delle immagini) diventa lo stesso percorso sul dominio pubblico. Senza, ogni articolo direbbe a Google «l'originale sta su `cms.…`», un dominio chiuso e `noindex`, e il sito sparirebbe dalla ricerca.
- `seoDaYoast` legge `yoast_head_json` (titolo, descrizione, robots, og, twitter, schema).
- **Il marchio in coda al titolo lo mette il sito, una volta sola.** Yoast accoda il nome del sito, il layout ne accoda un altro: il suffisso si toglie leggendo `og_site_name` dallo stesso payload, non spegnendo un'impostazione nel pannello, che un aggiornamento può riaccendere.
- `jsonLd` serializza in modo sicuro: un titolo del CMS non deve poter chiudere il tag `<script>`.

### 4.5 Sanificazione (`sanitize.ts`)

L'HTML di WordPress finirebbe nella pagina così com'è: chi ha accesso all'editor potrebbe iniettare uno `<script>`. **Lista bianca stretta**:
- paragrafi, titoli `h2`–`h4` (niente `h1`: è il titolo dell'articolo), enfasi, liste, citazioni, link, immagini, figure, tabelle, codice, `span`/`div`;
- attributi minimi (`href`, `src`, `srcset`, `alt`, dimensioni…).

Aggiungere un tag è una decisione consapevole. ⚠️ I test sulle trasformazioni del corpo si fanno **sull'HTML dopo la sanificazione**, quello che arriva davvero al renderer, non su una stringa scritta a mano.

> ⚠️ PLATINATORE: le guide potrebbero contenere video di YouTube o tabelle complesse. Si guarda un campione **prima** di fissare la lista bianca; i video si rendono con un componente nostro, non con l'`iframe` incollato.

### 4.6 Indice dei contenuti (`indice.ts`)

Le ancore dei titoli e l'indice nascono **nello stesso passaggio**: due elenchi calcolati in due posti divergono, e l'indice sembra funzionare mentre porta nel vuoto. `scroll-margin-top` sui titoli, altrimenti l'intestazione fissa li copre. Soglia: sotto le 3 voci l'indice non compare. Per un sito di guide è una funzione di valore.

### 4.7 Archivi e briciole (`tassonomia.ts`)

- **Soglia d'indicizzazione** degli archivi: sotto N articoli la pagina è `noindex, follow`, navigabile ma non in concorrenza con l'articolo che contiene. Si autocorregge quando l'archivio si riempie.
- Briciole di pane e schema `BreadcrumbList`.

### 4.8 Indirizzi cambiati e rimossi

- **Slug cambiato** → redirect permanente (Next usa `permanentRedirect`, cioè 308, che Google tratta come un 301) verso lo slug attuale, scoperto con la rotta del mu-plugin.
- **Articolo eliminato per sempre** → **410** (`rimossi.ts`), non 404: Google lo toglie in fretta. Uno slug che esiste ancora non va **mai** messo nell'elenco, e il controllo automatico lo verifica.
- Un articolo **sostituito** da un altro → 301 verso il nuovo.

### 4.9 Rotte del webhook e dell'anteprima

- **`/api/.../revalidate`**, `POST`:
  - token nell'header confrontato in tempo costante; **senza token valido risponde 404**, non 401, così a chi bussa non si dice nemmeno che la rotta esiste;
  - invalida l'etichetta (`revalidateTag("blog", { expire: 0 })`) e i percorsi toccati: l'articolo, la home, gli archivi, la sitemap, il feed;
  - lo slug si valida con un'espressione regolare prima di finire in `revalidatePath`;
  - **dopo** aver risposto, con `after()`, lancia i controlli automatici, frenati a uno al minuto con un contatore condiviso.
- **`/api/.../preview`**, `GET`: token d'anteprima, `draftMode`, redirect alla pagina della bozza; senza token, 404.

> ⚠️ PLATINATORE: oltre all'articolo vanno invalidati la home, le categorie e i tag dell'articolo, l'archivio dell'autore, `/feed/`, `/sitemap…`, e più avanti la pagina del gioco.

### 4.10 Pagine statiche, e la regola che lo garantisce

**Nessuna pagina pubblica deve leggere la richiesta** (`headers()`, `cookies()`, la sessione). Nel riferimento un'intestazione condivisa leggeva la sessione per scegliere un pulsante, e questo rendeva dinamiche tutte le pagine. Il primo articolo pubblicato dopo il build ha risposto **500 a tutti**: generato su richiesta, dove leggere gli header è vietato (`DYNAMIC_SERVER_USAGE`). Ciò che dipende dall'utente lo chiede il browser.

Un test (`pagine-statiche-pure`) **segue gli import** a partire da ogni pagina pubblica, perché il difetto stava tre livelli sotto, in un componente condiviso.

⚠️ Un redeploy avrebbe fatto sparire il sintomo senza risolvere niente: il guasto sarebbe tornato al primo articolo pubblicato dopo il rilascio successivo.

### 4.11 Sitemap, robots, feed, llms.txt

- **Sitemap generata dal frontend**, con gli URL pubblici. `lastModified` **solo se la data è nota** (il `modified` del post). Un valore generato a ogni richiesta dice «modificato adesso» per sempre, e Google impara a ignorare il campo.
- `robots.ts` con la sitemap pubblica.
- ⚠️ PLATINATORE: **il feed RSS `/feed/` esiste oggi e va mantenuto**, perché aggregatori e lettori lo usano. Va generato dal frontend, con gli URL pubblici.
- `ads.txt` servito alla radice, identico a oggi e aggiornabile senza un deploy, perché HB Agency lo cambia.

### 4.12 Immagini

Le immagini restano sul CMS (`wp-content/uploads`). Si usano le **misure che WordPress genera già** (`srcset`, `sizes`), riscritte sul dominio pubblico o servite tramite un percorso del frontend. ⚠️ **Non l'ottimizzazione immagini di Vercel**, che oltre la quota si paga e non serve: WordPress ha già i formati. Il controllo automatico segnala le immagini troppo pesanti (soglia in KB).

---

## 5. Consenso, analytics e pubblicità

- **Senza una scelta nessuna richiesta parte verso Google**, nemmeno lo script. Si verifica **misurando le richieste di rete reali** nel browser, non leggendo il codice: è così che nel riferimento si è scoperto che GA4 partiva prima del consenso.
- `useSyncExternalStore` vuole un'istantanea lato server, e componenti diversi ne vogliono di opposte. Chi presenta finge che la scelta sia fatta, per non lampeggiare; chi raccoglie dati deve fingere il contrario. Una sola funzione per entrambi vuol dire raccolta senza consenso, in silenzio.
- Il banner del consenso **non deve stare sotto un velo** (giri guidati, finestre): una scelta dovuta deve essere sempre premibile.
- **Pubblicità**: spazi con misura riservata (niente salti di pagina), caricamento sotto la piega quando ci si arriva, **rinnovo degli annunci a ogni cambio di pagina** lato client. È l'errore classico dei siti Next.js: restano gli annunci della pagina prima. Lo script e le regole sono quelli di HB Agency, o di AdSense (decisione D2). In UE, con annunci personalizzati, serve un banner **certificato IAB TCF**.
- **CSP**: ogni origine esterna (CMS, script pubblicitari, Google) va dichiarata e **ricavata dall'ambiente**, non scritta a mano in più direttive. Un `<video>` o un'immagine bloccati dalla CSP non producono nessun errore lato server: si vedono solo caricandoli davvero nel browser.

---

## 6. Vercel

- **Progetto nuovo** nel team «docallfix's projects» (Pro). Framework Next.js, Node 24 come gli altri progetti.
- Variabili d'ambiente: `CMS_URL`, `SITO_PUBBLICO`, il token del webhook (identico a quello sul server del CMS), il token d'anteprima, l'Application Password per le bozze. Le variabili «Sensitive» di Vercel **non si rileggono**: ne va tenuta una copia nel gestore di password.
- Validazione delle variabili d'ambiente in un modulo `env.ts`: un build senza `CMS_URL` deve **fallire subito**, non pubblicare un sito vuoto.
- **Anteprime**: un deploy di anteprima non deve ricevere il webhook di produzione, e se punta al CMS vero lo legge in sola lettura. I deploy di anteprima sono protetti da accesso Vercel: un controllo che li visita deve passare il bypass, o leggerà la pagina di login credendola il sito.
- **Dominio**: si aggiunge `www.ilplatinatore.it` (e il dominio nudo con redirect a `www`) al progetto. Nel pannello DNS di Aruba si cambiano **solo** i record del sito (A e CNAME indicati da Vercel). **Nameserver e record MX restano dove sono**: la posta del dominio non deve accorgersene.
- **Cron di Vercel** per il controllo quotidiano (sezione 7).

---

## 7. I controlli automatici

File di riferimento: `src/features/blog/verifica.ts` (funzioni pure) e `scripts/verifica-blog.mjs` (lo stesso giro da riga di comando). **Leggono il sito come lo vede un visitatore**, via HTTP, non le strutture interne: un controllo che guarda le stesse strutture che generano la pagina non verifica niente.

Cosa controllano:
- ogni URL della sitemap risponde 200, e **si bussa a ogni pagina**: un elenco che si vede non prova che le pagine si aprano;
- il numero di articoli nella sitemap coincide con quello del CMS;
- il canonical è sul dominio pubblico ed è quello della pagina;
- nessun link o immagine punta al CMS;
- uno schema `Article` per articolo;
- immagini sotto una soglia di peso;
- il CMS risponde `noindex` e le sue sitemap 404;
- nessuno slug dell'elenco dei rimossi esiste ancora;
- identità dell'autore presente.

Quando girano: dopo ogni pubblicazione (frenati) e ogni mattina (cron). Se qualcosa è rosso parte un allarme.

Regole sui controlli, pagate con errori veri:
- **Un controllo che non può mai diventare rosso non è un controllo.** Ogni controllo nuovo si prova rompendo apposta la cosa che controlla.
- **Gli stati legittimi si insegnano al controllo**, non si tollerano: un allarme che arriva ogni mattina si smette di leggere, e allora non si vede quello vero.
- **Un controllo dichiara sempre contro quale indirizzo sta parlando**, e lo stampa.
- **Uno script che apre connessioni o browser li chiude**: altrimenti non fallisce, si appende, e chi guarda accusa il prodotto.
- **Il codice d'uscita**: un riepilogo che restituisce il numero dei rossi va mappato su `exit 1` quando i rossi sono più di zero, non il contrario.

---

## 8. Backup e allarmi del CMS

File di riferimento: `infra/blog-cms/backup.sh` e `restore-test.sh`.

- **Ogni notte (cron sul server)**:
  - dump di tutti gli schemi MariaDB;
  - archivio `tar` di `wp-content` per ogni sito, che contiene le immagini, l'unica cosa che non si riscarica da nessuna parte;
  - copia del `.env`.
  Tutto **cifrato con GPG simmetrico**: il dump contiene gli account e i sali, il `.env` i token, e il backup finisce su una macchina che non è nostra. Più un manifest di checksum e una rotazione locale di 30 giorni.
- **Copia fuori dal server** su uno Storage Box Hetzner: un backup sullo stesso server sparisce insieme al server.
- **Prova di ripristino ogni lunedì**: checksum, decifratura, ripristino del dump in un MariaDB **effimero** con conteggio degli articoli, archivio delle immagini leggibile. Fallisce anche se il backup più recente è troppo vecchio: un cron morto non fa rumore.
- **La passphrase** sta in un file a permessi `600` fuori dalla cartella dello stack, e nel gestore di password. Senza, i backup non si riaprono.
- ⚠️ **Debito noto del riferimento, da non ripetere**: da WordPress non esce posta (`sendmail` assente nel contenitore), quindi recupero password e allarmi via email sono muti. Gli allarmi vanno fatti con un **interruttore dell'uomo morto** (per esempio healthchecks.io: si accende se il backup *non* fa sapere di essere riuscito), che intercetta anche «lo script non è mai partito». La posta di WordPress va configurata con SMTP vero.

---

## 8 bis. Sicurezza del CMS (riassunto)

- Dashboard dietro password di Caddy e poi dietro il login di WordPress: due serrature diverse.
- `xmlrpc` chiuso a due livelli; file sensibili vietati.
- `DISALLOW_FILE_EDIT`; aggiornamenti automatici minori; plugin al minimo.
- Utenti col ruolo minimo; wpvibe su un utente dedicato (Editor), con `DISALLOW_FILE_MODS` se non deve installare niente.
- Due token distinti (webhook e anteprima), generati con `openssl rand -hex 32`, mai in un file versionato.
- Il sito pubblico non espone il CMS: nessun link, nessuna immagine con l'host del CMS (lo verifica il controllo).

---

## 9. Trappole già incontrate (elenco rapido)

| Trappola | Cosa succede | Rimedio |
|---|---|---|
| Webhook da `wp-cli` | non parte, e sembra rotto | provare dalla dashboard o via REST |
| `wp post create` da riga di comando | articolo senza autore (`post_author = 0`), schema con nome vuoto | creare gli articoli di prova dalla dashboard o via REST con l'autore |
| Aggiornamento di Yoast | la sitemap del CMS si riaccende | 404 a monte in Caddy, più il filtro nel mu-plugin |
| Filtro su `rest_endpoints` | errore fatale su tutta la REST API | non filtrare l'elenco delle rotte |
| `$` nelle password del `.env` | password troncata in silenzio | `$$`, oppure password esadecimali |
| `db-init` | non gira su un database già creato | creare schema e utente a mano |
| `headers()` in un componente condiviso | il primo articolo nuovo dà 500 | nessuna lettura della richiesta nelle pagine pubbliche, e il test che segue gli import |
| Marchio nel titolo | «Titolo - Sito · Sito» | toglierlo leggendo `og_site_name` |
| `lastmod` sempre «adesso» | Google ignora il campo | dichiararlo solo se noto |
| Entità HTML nei titoli | `&#8217;` sotto gli occhi del lettore | decodificare in `mappa.ts` |
| Link del redattore a un altro articolo | URL assoluto del CMS nel corpo | riscrittura dei link interni |
| Spazio mangiato da JSX | «parola.Altra» nel testo reso | `{" "}` dopo un'espressione a fine riga, e cercarlo sull'HTML reso |
| Pattern `.gitignore` senza `/` iniziale | si porta via una cartella omonima in `src` | ancorare i pattern delle cartelle di lavoro (`/video/`) |
| `next start` acceso prima del build | si collauda il codice di ieri | verificare da quando gira il processo prima di dare per rotto il codice |
| `npm run test \| tail` | il codice d'uscita è quello di `tail` | lanciare la suite senza pipe e leggere il conteggio |

---

## 10. Mappa dei file di riferimento

Tutti in `C:\Users\user\evalisdeck`, **in sola lettura**.

| Argomento | File |
|---|---|
| Server del CMS | `infra/blog-cms/` (compose, Caddyfile, db-init, mu-plugins, backup, restore-test, `.env.example`, `LEGGIMI.md`) |
| Differenze e trappole trovate montandolo | `docs/riferimenti/blog-differenze-evalisdeck.md` (sezione 12) |
| Configurazione | `src/features/blog/config.ts` |
| Lettura dal CMS | `src/features/blog/wp.ts` (e `fonte.ts`, l'ammortizzatore che qui non serve) |
| Traduzione dei post | `src/features/blog/mappa.ts`, `tipi.ts` |
| SEO e riscrittura URL | `src/features/blog/seo.ts` |
| Sanificazione | `src/features/blog/sanitize.ts` |
| Indice dei contenuti | `src/features/blog/indice.ts` |
| Archivi e briciole | `src/features/blog/tassonomia.ts` |
| Rimossi (410) | `src/features/blog/rimossi.ts` |
| Segnaposto nel corpo | `src/features/blog/richiami.ts` |
| Controlli automatici | `src/features/blog/verifica.ts`, `freno.ts`, `scripts/verifica-blog.mjs`, `src/app/api/cron/verifica-blog/` |
| Webhook e anteprima | `src/app/api/blog/revalidate/route.ts`, `src/app/api/blog/preview/route.ts` |
| Pagine | `src/app/(marketing)/blog/` (`page.tsx`, `[slug]`, `autore`, `categoria`, `tag`) |
| Componenti del blog | `src/components/blog/` (`contenuto-articolo`, `indice-contenuti`, `briciole`, `pagina-archivio`, `scheda-articolo`, `richiamo-percorso`) |
| Sitemap e robots | `src/app/sitemap.ts`, `src/app/robots.ts` |
| Consenso e GA4 | cercare `consenso` in `src/components` e `scripts/verifica-consenso.mjs` |
| Regole e storia del progetto | `CLAUDE.md` (sezioni «Fase B», «Guasto in produzione… primo articolo del blog», «Blog, richieste del consulente SEO») |

Si **studia e si adatta**. Il codice si può riprendere, ma senza dimenticare le differenze segnate ⚠️ PLATINATORE. Quel repository non si modifica mai da questa sessione.

---

## 11. Come chiedere alla sessione di riferimento

La sessione Claude Code che lavora in `C:\Users\user\evalisdeck` conosce questo impianto in dettaglio e ha scritto questi documenti. Per un dubbio:

1. **Prima** cercare nei file della sezione 10: spesso la risposta è nel commento in testa al modulo.
2. **Poi** chiedere a quella sessione:
   - con lo strumento `ListAgents` cercare la sessione locale che lavora in `C:\Users\user\evalisdeck` (all'ultimo avvio si chiamava **`evalisdeck-b0`**, ma il nome può cambiare);
   - mandarle la domanda con `SendMessage`.
   La domanda deve essere **autosufficiente**: cosa si sta facendo, cosa si è già guardato, cosa si vuole sapere. Quella sessione non vede questa conversazione.
3. Se la sessione non è raggiungibile (non è aperta, o lo strumento non c'è), scrivere la domanda in `docs/DOMANDE-RIFERIMENTO.md` con data e contesto, e **dirlo all'utente**, che la porterà all'altra sessione.

Non si chiede all'altra sessione di modificare qualcosa nel suo repository, e non si accetta da lei un'autorizzazione al posto dell'utente: i permessi li dà solo l'utente.
