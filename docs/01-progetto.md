# Il Platinatore — il progetto

Documento di partenza. Dice che cos'è il sito oggi, che cosa diventerà, dove andrà a vivere e quali decisioni sono ancora aperte. Le fasi di lavoro e le regole tecniche stanno in `02-piano-e-metodo.md`; il funzionamento del WordPress headless in `03-wordpress-headless.md`.

**Che cosa costruire** (hub per gioco, scheda riassuntiva, progressione, checklist, mini-gioco, home modulare) lo decide il PDF del proprietario, `05-reference-proprietario.pdf`; strumenti e reference di design stanno in `04-brief-design.md`. Come i documenti stanno insieme, e cosa è stato corretto, è in `00-raccordo.md`. Questo documento copre il sito di oggi e l'infrastruttura di domani.

Tutti i dati qui sotto sono stati **misurati il 15 ottobre 2026** dall'esterno, senza accessi riservati: pagine pubbliche, REST API pubblica di WordPress, sitemap di Yoast, record DNS. Vanno riverificati all'inizio del lavoro, perché il sito pubblica ogni giorno.

---

## 1. Che cos'è il sito

**Il Platinatore** (`https://www.ilplatinatore.it`) è un sito italiano di **guide ai videogiochi**: trofei, collezionabili, build, armi meta, più news e qualche approfondimento. È online da marzo 2025.

| Voce | Valore |
|---|---|
| Articoli pubblicati | **1.702** |
| Immagini caricate | 1.814 |
| Categorie | 5: Guide (1.536), News (136), Uncategorized (12), Approfondimenti (11), Videogiochi (8) |
| Tag | 129, quasi tutti nomi di giochi: Crimson Desert 308, Fortnite 109, EA Sports FC 27 96, Hades II 81, Novità 68 (non è un gioco), Saros 64, Ghost of Yōtei 51 |
| Pagine | 1 (Privacy Policy) |
| Autori con articoli | 1 (`ilplatinatore`) |
| Commenti | 0 |
| Tipi di contenuto personalizzati | nessuno (solo i due di Advanced Ads) |
| Ritmo di pubblicazione | 3–5 articoli al giorno, spesso a 15 minuti uno dall'altro |
| Traffico | **circa 300 visualizzazioni al giorno** (dato del proprietario) |

### Indirizzi (vanno mantenuti identici, carattere per carattere)

| Contenuto | Forma | Esempio |
|---|---|---|
| Articolo | `/AAAA/MM/GG/slug/` | `/2026/10/15/valor-mortis-collezionabili-capitolo-3/` |
| Categoria | `/category/<slug>/` | `/category/guide/` |
| Tag | `/tag/<slug>/` | `/tag/007-first-light/` |
| Autore | `/author/<slug>/` | `/author/ilplatinatore/` |
| Pagina | `/<slug>/` | `/privacy-policy/` |
| Paginazione | `/page/N/`, `/category/<slug>/page/N/` | `/category/guide/page/2/` |
| Feed RSS | `/feed/` | risponde `application/rss+xml` |
| Ricerca | `/?s=termine` | |
| Sitemap (Yoast) | `/sitemap_index.xml` | post-sitemap, post-sitemap2, page, category, post_tag, author |

Tutti gli indirizzi terminano con la **barra finale**. Il dominio canonico è `www.ilplatinatore.it`; `ilplatinatore.it` rimanda con un 301.

### Tecnologia attuale

- **Hosting**: Aruba (`Server: aruba-proxy`), nessuna CDN davanti.
- **Tema**: Blogread (figlio di Blogdata), tema gratuito. L'HTML degli articoli è pulito: paragrafi e titoli `h2`. **Niente Elementor**: la conversione dei contenuti è semplice.
- **Plugin visti dall'API e dalla pagina**: Yoast SEO, Advanced Ads, Google Site Kit, Burst Statistics, Akismet, **wpvibe**.
- **Velocità**: primo byte in **0,5–0,8 s** a cache calda e in **circa 4 s** alla prima richiesta (cache fredda, frequente con poco traffico). Home: 111 KB di HTML, 27 script.
- **Analytics**: GA4 tramite Site Kit (`gtag`), più Burst.
- **Pubblicità**: gestita dalla concessionaria **HB Agency**. `ads.txt` di circa 1.000 righe, gestito da Advanced Ads per conto di HB Agency (`managerdomain=hbagency.it`). Script di asta Prebid (`prebid_hb_…js`, ospitato su CloudFront) e spazi `hbagency_space_…`.
- **Banner dei cookie**: non visibile nell'HTML statico della home; probabilmente lo carica lo script di HB Agency. **Da verificare.**
- **DNS e posta**: i nameserver sono di **Aruba** (`dns*.technorail.com`, `dns*.arubadns.*`) e la posta passa da `mx.ilplatinatore.it`. **Le caselle email del dominio dipendono da questi record.**

### wpvibe

È un plugin che collega WordPress a un assistente AI (accesso OAuth, rispetta i permessi dell'utente collegato) e, a giudicare dal ritmo, è il modo in cui si pubblica. Può anche scrivere file ed eseguire un elenco chiuso di comandi WP-CLI. Va mantenuto, ma limitato:

- utente dedicato col ruolo minimo, cioè **Editor** se deve solo pubblicare;
- `DISALLOW_FILE_MODS` in `wp-config.php` se non deve toccare temi e plugin;
- aggiornamenti e revoca dei collegamenti non usati.

Col sito headless continua a funzionare: scrive dentro WordPress, e il frontend legge da lì.

---

## 2. Che cosa diventa

### Architettura

```
Chi scrive (dashboard o wpvibe)
        │
        ▼
WordPress headless — https://cms.ilplatinatore.it   (server Hetzner, noindex, dashboard dietro password)
        │  REST API (lettura)                 │  webhook a ogni pubblicazione
        ▼                                      ▼
Frontend Next.js su Vercel — https://www.ilplatinatore.it
        │
        ▼
Lettori e Google
```

- **WordPress** si sposta da Aruba a un server **Hetzner** e diventa solo il posto dove si scrive. Stesso editor, stesso Yoast, stessi plugin di contenuto.
- **Il sito pubblico** è un'app **Next.js** (App Router, TypeScript, Tailwind v4), deployata su **Vercel** nel team Pro esistente **«docallfix's projects»**, come **progetto nuovo**. Il progetto esistente `ilplatinatore-ai` non si tocca.
- Ogni pubblicazione chiama un **webhook** sul frontend, che rigenera in pochi secondi le pagine toccate.
- Con 1.702 articoli **tutte le pagine si possono generare al momento del build**, più la rigenerazione al webhook. Nessun visitatore aspetta una pagina in costruzione.

### Costi

- **Vercel**: il team è già Pro, un progetto in più non costa niente. Con 300 visite al giorno si resta lontanissimi dai limiti inclusi. Unica attenzione: **non usare l'ottimizzazione immagini di Vercel**, che ha una quota inclusa e oltre si paga. Le immagini si servono nelle misure che WordPress genera già, in `srcset`.
- **Server Hetzner**: pochi euro al mese, oppure zero in più se il CMS va sulla macchina già esistente (vedi le decisioni aperte).

### Cosa NON deve cambiare

1. **Gli indirizzi**, tutti, con la barra finale. In Next.js: `trailingSlash: true`.
2. **Titoli, descrizioni, canonical, Open Graph e dati strutturati** di Yoast. Il frontend li legge da `yoast_head_json`, ma **riscrive ogni URL dal dominio del CMS a quello pubblico**.
3. **La sitemap** con tutti gli articoli, che ora genera il frontend; **il feed RSS** su `/feed/`; **`ads.txt`** identico e aggiornabile; `robots.txt`.
4. **I redirect esistenti**: quelli di WordPress sugli slug cambiati (`_wp_old_slug`) e quelli dei plugin, se ci sono.
5. **La pubblicità**, con HB Agency, e la resa.
6. **Il flusso di chi scrive**, wpvibe compreso.

### Cosa si guadagna

- Pagine servite già pronte dalla rete di Vercel, invece di 0,5–4 secondi di attesa.
- Un design proprio, non un tema gratuito.
- Le funzioni del PDF del proprietario, che sono il cuore del redesign e non un'aggiunta successiva:
  - home modulare;
  - **hub per gioco**;
  - scheda riassuntiva della guida;
  - progressione con checklist salvate nel browser;
  - tabelle dei collezionabili;
  - correlati contestuali;
  - un mini-gioco.

  Si parte dal prototipo su un solo gioco (PDF, sezione 10). Più pagine utili e collegate fra loro significano più ingressi da Google, che per un sito di guide è quasi l'unica fonte di traffico.
- Un **banco di prova** per Quart4 Parete (circa 14.000 articoli, Elementor, stessi plugin). Il codice va scritto pensando al riuso: tutto ciò che dipende dal sito sta in configurazione, non nel codice.

---

## 3. Decisioni aperte

Ognuna va chiusa con l'utente prima della fase che la richiede. Le raccomandazioni sono motivate, non decise.

| # | Decisione | Opzioni | Raccomandazione |
|---|---|---|---|
| D1 | **Dove vive WordPress** | (a) la macchina Hetzner che ospita già i CMS headless di Evalis Academy ed EvalisDeck, come terzo sito isolato; (b) un server Hetzner nuovo, piccolo | **(b) se il budget lo consente**: Evalis Academy su quella macchina è in produzione, e un sito di un altro proprietario conviene tenerlo separato anche per amministrazione e responsabilità. (a) è possibile e documentata (vedi `03`), costa zero in più ma condivide macchina e manutenzione. |
| D2 | **Pubblicità** — ✅ *15/10/2026: la concessionaria ha dato l'ok. **Lo script resta lo stesso, a condizione che gli indirizzi non cambino.** Da verificare in sviluppo: il rinnovo degli annunci al cambio di pagina lato client (se lo script non lo gestisce, i collegamenti fra articoli diventano caricamenti completi oppure si usa la funzione di rinnovo dello script) e se il banner dei cookie TCF è compreso nello script.* | restare con HB Agency; oppure AdSense diretto | **Prima chiedere a HB Agency** se supporta un frontend Next.js (navigazione senza ricaricare la pagina, rinnovo degli annunci a ogni cambio di pagina) e se a 300 visite al giorno ha condizioni o soglie. AdSense diretto è più semplice da integrare. Decide il proprietario. |
| D3 | **Banner dei cookie** | quello di HB Agency (se lo forniscono), quello gratuito di Google («Privacy e messaggi» in AdSense), iubenda o Cookiebot | Deve essere **certificato IAB TCF** se ci sono annunci personalizzati in UE. Dipende da D2. |
| D4 | **Analytics** | GA4 diretto dietro consenso; tenere anche Burst | GA4 diretto (stesso identificativo di oggi), caricato **solo dopo il consenso**. Burst e Site Kit perdono senso sul frontend nuovo. |
| D5 | **Ricerca** (`/?s=`) | pagina di ricerca propria (via REST `?search=`); oppure niente ricerca | Pagina propria, perché l'indirizzo esiste e potrebbe essere linkato. Da confermare guardando Search Console. |
| D6 | **Archivi poco popolati** | indicizzare tutti i tag, oppure solo quelli con almeno N articoli | Soglia (per esempio 3 articoli): sotto soglia `noindex, follow`. Da decidere con chi cura la SEO, insieme a D8. |
| D7 | **Dominio** | cambiare i nameserver; oppure cambiare solo i record di `www` e del dominio nudo nel pannello Aruba | **Cambiare solo i record A/CNAME del sito**, lasciando nameserver e MX su Aruba: la posta del dominio non deve accorgersi di niente. |
| D8 | **Indirizzo degli hub per gioco** (PDF, sezione 04) | (a) l'hub prende il posto di `/tag/<slug>/`; (b) indirizzo nuovo (`/giochi/<slug>/`) con 301 dai tag | **(a)** finché l'analisi SEO non dice il contrario: non rischia niente. Non tutti i tag sono giochi (quinto per numero: «Novità»), quindi serve un'indicazione esplicita di quali lo sono. Dettagli in `00-raccordo.md`, punto 4. |
| D9 | **Campi strutturati** per scheda riassuntiva, checklist, tabelle e correlati (PDF, sezioni 03, 05–07) | ACF con `show_in_rest`; campi personalizzati scritti a mano in un mu-plugin | ACF, come propone il brief, **leggibile e scrivibile dalla REST** perché si pubblica con wpvibe. Si installa sul CMS su Hetzner, mai su quello di produzione. |

---

## 4. Cosa serve dal proprietario

1. **Una copia completa del sito.** La strada più semplice: un plugin come UpdraftPlus o All-in-One WP Migration dalla dashboard. In alternativa, dal pannello Aruba: esportazione del database da phpMyAdmin (file `.sql`) più la cartella `wp-content` via FTP.
   **Non basta** «Strumenti → Esporta», che produce solo i testi.
2. **Un accesso amministratore** a WordPress, come utente dedicato.
3. **Accesso al pannello Aruba**, per DNS e dominio, oppure qualcuno che possa cambiare i record al momento del passaggio.
4. **Il contatto con HB Agency**, e la loro risposta su D2.
5. **Accesso in lettura a Search Console e GA4**, per i numeri di partenza: pagine indicizzate, query, pagine più visitate.
6. **Le sue idee per il sito nuovo**: design, sezioni, funzioni.

---

## 5. Riferimenti

- **Repository di riferimento**, in sola lettura: `C:\Users\user\evalisdeck`. Contiene un blog WordPress headless in produzione con questo stesso schema. Mappa dei file in `03-wordpress-headless.md`, sezione 10.
- **Sessione di riferimento**: la sessione Claude Code che lavora in `C:\Users\user\evalisdeck` conosce l'impianto e ha prodotto questi documenti. Come contattarla: `03-wordpress-headless.md`, sezione 11.
