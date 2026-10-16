# Come stanno insieme i documenti, e cosa è stato corretto

Questo progetto ha tre fonti scritte da tre parti diverse. Questo documento dice quale vale per cosa e quali contraddizioni sono state trovate e risolte, oppure lasciate aperte. Si legge per primo.

## Le fonti e la loro autorità

| Documento | Autore | Decide |
|---|---|---|
| `05-reference-proprietario.pdf` | il proprietario del sito | **funzionalità del redesign e ordine del lavoro di design** (sezioni 01–10, in particolare il prototipo della sezione 10) |
| `04-brief-design.md` | la sessione di Axialoop | reference di design aggiuntive, skill e strumenti, metodo per varianti, componenti |
| `01-progetto.md`, `02-piano-e-metodo.md`, `03-wordpress-headless.md` | la sessione di EvalisDeck | **infrastruttura**: dove vive WordPress, come si deploya, conservazione degli indirizzi e della SEO, pubblicità e consenso, backup, sicurezza, regole sui sistemi vivi |

Regola di precedenza:
- su **cosa** costruire e **in che ordine** progettarlo vince il PDF, come dice il brief;
- su **come** farlo funzionare senza perdere indirizzi, traffico, pubblicità o dati valgono i documenti 01–03;
- quando due fonti si contraddicono e questo documento non lo risolve, **ci si ferma e si chiede all'utente**.

## Contraddizioni trovate, verificate il 15/10/2026

### 1. «Nessuna pubblicità visibile»: falso

Il brief (sezione 2) dice che non c'è pubblicità. L'HTML della home contiene due spazi della concessionaria **HB Agency** (`hbagency_space_304793`, `hbagency_space_304794`) e il suo script d'asta Prebid (`prebid_hb_9582_38206.js`), e `ads.txt` ha circa 1.000 righe gestite da HB Agency. Probabilmente gli annunci si caricano solo nel browser, dopo il consenso, e un lettore automatico non li vede.

**Conseguenza**: la domanda aperta 2 del brief («pubblicità prevista?») ha già una risposta, cioè **sì, c'è già**, e va trattata come in `01-progetto.md` (decisione D2) e `02-piano-e-metodo.md` (fase pubblicità). Il layout deve prevedere gli spazi pubblicitari **da subito**, non aggiungerli dopo: cambiano altezze, CLS e velocità.

### 2. «Consenso cookie nostro»: va bene solo senza pubblicità personalizzata

Il brief (sezione 6) prevede un banner del consenso fatto in casa, come su Axialoop ed EvalisDeck. Con annunci personalizzati in UE, Google e le concessionarie richiedono un banner **certificato IAB TCF**, e uno fatto in casa non lo è.

**Risoluzione**: si decide con la D3 di `01-progetto.md`, dopo la risposta di HB Agency. Se gli annunci restano, il banner è quello certificato (della concessionaria, di Google o di un fornitore come iubenda); il comportamento («nessuna richiesta prima della scelta») resta quello descritto in `03`.

### 3. «Stessi indirizzi, oppure redirect 301 uno per uno»

Il brief lascia aperta l'alternativa. **Gli articoli mantengono gli stessi indirizzi**, senza eccezioni: è la regola di `01` e `02`. I redirect servono solo per indirizzi che cambiano davvero, ed è il punto seguente.

### 4. Gli hub per gioco: quale indirizzo?

Il PDF (sezione 04) e il brief vogliono che i tag dei giochi diventino hub. Oggi quei tag stanno su `/tag/<slug>/` e sono indicizzati. Due strade:

- (a) l'hub **prende il posto** di `/tag/<slug>/`: nessun redirect, la pagina migliora sul suo indirizzo;
- (b) l'hub nasce su un indirizzo nuovo (per esempio `/giochi/<slug>/`) e `/tag/<slug>/` fa un 301 verso di lui.

È la **decisione D8**, da prendere con l'analisi SEO della Fase 0. (a) non rischia niente; (b) dà un indirizzo più parlante, ma richiede 129 redirect e un periodo di assestamento.

⚠️ **Non tutti i tag sono giochi**: il quinto per numero di articoli è «Novità» (68). L'elenco degli hub non si deriva da «tutti i tag»: serve un'indicazione esplicita di quali tag sono giochi (campo in WordPress o elenco curato).

### 5. Campi strutturati (ACF) e chi scrive

Il brief (sezione 6) propone campi dedicati, per esempio con ACF, per scheda riassuntiva, checklist, tabelle e correlati. È la scelta giusta. Due vincoli che il brief non dice:

- **si pubblica con wpvibe**, cioè via REST: i campi devono essere **leggibili e scrivibili dalla REST API** (in ACF, `show_in_rest`), altrimenti l'AI non li compila e le guide nuove escono senza scheda;
- i campi si aggiungono sul **WordPress nuovo su Hetzner**, non su quello di produzione su Aruba (regola dei sistemi vivi). È la ragione per cui la copia del CMS su Hetzner va fatta **presto** (vedi l'ordine delle fasi in `02`).

### 6. L'ordine delle fasi

Il brief mette «migrazione e messa online» per ultima, e il PDF vuole il prototipo su un gioco prima dell'estensione. Il piano 02 aveva l'infrastruttura prima del design. **Il piano 02 è stato riordinato** per rispettare il PDF:
- il prototipo della sezione 10 arriva subito dopo le fondamenta;
- l'infrastruttura necessaria al prototipo (copia del CMS su Hetzner, strato dati, indirizzi) sta nelle fondamenta;
- il passaggio di dominio resta alla fine.

### 7. «Guide del momento» basate sui dati

Il PDF vuole una selezione «basata su consultazioni in un periodo definito». Due limiti da dichiarare:
- servono i dati di GA4 o Search Console (accesso, domanda 4 del brief);
- con circa **300 visualizzazioni al giorno**, e GA4 che conta solo chi accetta i cookie, i numeri per singola guida sono piccoli.

Il criterio va scelto sapendolo (per esempio Search Console, che non dipende dal consenso, su 28 giorni) e **dichiarato in pagina**, come chiede il PDF.

### 8. Nome della sessione di riferimento

Il messaggio di Axialoop chiama la sessione EvalisDeck **`evalisdeck-b0`**. È la sessione che lavora in `C:\Users\user\evalisdeck` (sezione 11 di `03`). Va comunque cercata con `ListAgents`, perché il nome può cambiare da un avvio all'altro.

## Cose che il brief non copre e che restano in 01–03

- Spostamento di WordPress da Aruba a Hetzner, con backup cifrati, prova di ripristino e allarmi.
- Mu-plugin: webhook, anteprima, slug **e date** precedenti, sitemap del CMS spente.
- Feed RSS `/feed/`, `ads.txt` aggiornabile, `robots.txt`.
- **DNS e posta del dominio su Aruba**: al passaggio si cambiano solo i record del sito.
- Sicurezza di wpvibe (utente Editor, `DISALLOW_FILE_MODS`).
- Le trappole note (tabella in `03`, sezione 9).

## Una cosa da chiarire con l'utente

Su Vercel esiste già un progetto **`ilplatinatore-ai`** (Vite, agosto 2026), e nella cartella Download ci sono molti documenti «Il_Platinatore_AI_…» di aprile 2026. **Non fanno parte di questo progetto** e non vanno toccati né riusati, salvo indicazione dell'utente.
