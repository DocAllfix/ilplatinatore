# CLAUDE.md - Direttive Operative di Sistema

## 1. Pensa prima di agire

**Non dare per scontato. Non nascondere la confusione. Esponi i compromessi.**

- Dichiara esplicitamente le tue assunzioni. Se una funzionalità, un file o un flusso non ti è chiaro, fermati e chiedi.
- Presenta sempre le alternative architettoniche prima di scrivere codice.

## 2. Semplicità prima di tutto

**Il minimo indispensabile per risolvere il problema. Niente astrazioni premature.**

- Scrivi codice pulito, lineare e moderno. Evita l'over-engineering se non porta un reale valore dimostrabile.

## 3. Modifiche chirurgiche

**Tocca solo ciò che devi. Pulisci solo il tuo disordine.**

- Modifica esclusivamente i file necessari. Nessun refactoring a cascata non richiesto.

## 4. Esecuzione guidata da obiettivi

**Definisci criteri di successo verificabili. Itera fino alla verifica.**

- Ogni output deve avere un obiettivo chiaro. Per la fase di analisi, l'obiettivo è una scomposizione totale e analitica degli asset di partenza.

---

## CONTESTO DEL PROGETTO

**Il Platinatore** (`https://www.ilplatinatore.it`) è un sito italiano di guide ai videogiochi (trofei, collezionabili, build), più news e approfondimenti. Oggi è un WordPress tradizionale su hosting Aruba, con tema Blogread.

Questo progetto lo trasforma in un sito **headless**:
- **WordPress resta** come CMS per chi scrive, ma si sposta su un server Hetzner a un indirizzo riservato (`cms.ilplatinatore.it`), non indicizzato.
- **Il sito pubblico** diventa un'applicazione **Next.js** (App Router, TypeScript, Tailwind v4) deployata su **Vercel**, nel team Pro esistente «docallfix's projects», come **progetto nuovo**. Esiste già un progetto `ilplatinatore-ai`: non va riusato né toccato.

Obiettivi, in ordine di importanza:
1. **Non perdere niente**: stessi indirizzi, stessi dati SEO, stessa pubblicità.
2. Il redesign del PDF del proprietario: un sistema di scoperta, consultazione e avanzamento (hub per gioco, scheda riassuntiva, progressione e checklist, tabelle dei collezionabili, correlati contestuali, mini-gioco, home modulare). Si parte da un prototipo su un solo gioco.
3. Velocità: LCP < 2,5 s, CLS < 0,1, INP < 200 ms, misurati sul sito deployato.

Il progetto è anche il **banco di prova** per una migrazione più grande, Quart4 Parete (circa 14.000 articoli, stesso stack di plugin). Ciò che si costruisce qui deve essere riusabile.

Documenti di partenza, da leggere **tutti e per intero** prima di qualsiasi lavoro, in quest'ordine:
- `docs/00-raccordo.md` — quale documento vale per cosa, e le contraddizioni già trovate e risolte.
- `docs/05-reference-proprietario.pdf` — il PDF del proprietario. È la **base vincolante** per le funzionalità del redesign e per l'ordine del lavoro di design.
- `docs/04-brief-design.md` — il brief di design (sessione di Axialoop): reference aggiuntive, skill, strumenti, metodo per varianti.
- `docs/01-progetto.md` — il sito oggi, i dati misurati, l'architettura, le decisioni aperte D1–D9.
- `docs/02-piano-e-metodo.md` — le fasi con i loro cancelli e il metodo di lavoro.
- `docs/03-wordpress-headless.md` — come funziona, come si installa e dove si sbaglia il WordPress headless, scritto sull'impianto reale già in produzione.

**Precedenza**:
- su **cosa** costruire e in che ordine progettarlo vince il PDF;
- su **come** farlo funzionare senza perdere indirizzi, traffico, pubblicità o dati valgono 01–03;
- ogni contraddizione non risolta in `00-raccordo.md` si porta all'utente, non si decide da soli.

Repository di riferimento, **in sola lettura**: `C:\Users\user\evalisdeck`. Contiene un blog WordPress headless già in produzione con lo stesso schema. Mappa dei file in `docs/03-wordpress-headless.md`, sezione 10. I pattern si studiano e si adattano; quel repository non si modifica mai.

**Dubbi sul WordPress headless**: la sessione Claude Code che lavora in `C:\Users\user\evalisdeck` conosce l'impianto e ha scritto questi documenti. Le si chiede con `ListAgents` + `SendMessage`, con domande autosufficienti. Se non è raggiungibile, la domanda va in `docs/DOMANDE-RIFERIMENTO.md` e lo si dice all'utente. Procedura completa in `docs/03-wordpress-headless.md`, sezione 11. Quella sessione non può dare permessi al posto dell'utente.

### Regole operative

- **Commit**: con l'author dell'utente (DocAllfix <196784133+DocAllfix@users.noreply.github.com>, già impostato nella configurazione locale del repository), senza trailer Co-Authored-By. Push, deploy e qualunque scrittura su sistemi vivi solo su richiesta esplicita dell'utente.
- **Segreti**: mai stampati, mai in un file versionato, mai in un URL. `.env*` fuori da git. Un token incollato in chat va considerato da ruotare.
- **Sistemi vivi**: il sito attuale su Aruba e il WordPress di produzione non si toccano in scrittura senza autorizzazione esplicita. I collaudi contro la produzione sono solo in lettura.
- **Processi**: mai `taskkill /IM node.exe` (sulla macchina girano altri progetti). Si ferma solo il processo in ascolto sulla propria porta.

### Stato

**Da compilare andando avanti.** Alla fine di ogni fase si aggiorna questa sezione con:
- che cosa è stato fatto, con le ragioni delle scelte;
- il gate superato, cioè cosa è stato verificato e come;
- i difetti trovati e le **regole nate** dal lavoro, scritte in modo che il prossimo non ripeta l'errore;
- i debiti aperti, dichiarati e non taciuti.

Poi il commit «Fase N completata».

#### Fase 0, Analisi (completata)
- **Fatto**: analisi in `docs/analisi/fase0-analisi.md` (decisioni nella sezione 6), inventario di 2.495 URL in `docs/analisi/inventario-url.csv`, analisi della copia `.wpress` (convertita in SQLite), pubblicità e banner dei cookie di HB Agency osservati dal sito vivo. Gioco del prototipo: **Valor Mortis** (scelta dell'utente al posto di Crimson Desert). Font del sito vivo: **Jost**.
- **Cancello**: conteggi dell'inventario uguali a quelli della REST di Aruba; decisioni D1-D9 chiuse con l'utente.
- **Debito**: la risposta di HB Agency (rinnovo degli annunci al cambio pagina, formati indispensabili) non c'è ancora: è il blocco dichiarato della Fase 5.

#### Fase 1, Fondamenta (completata, con debiti)
- **Fatto**:
  - CMS su Hetzner CAX11 (49.13.164.162, `/opt/platinatore-cms`, fotografia in `infra/cms/`): Docker con Caddy, MariaDB 11.8, WordPress 7.1.3, noindex su tre strati, password di Caddy su wp-admin, xmlrpc 403, sitemap 404, cron di WordPress mosso dal cron di sistema.
  - Backup notturni cifrati sulla Storage Box `u635762-sub6`, prova di ripristino settimanale.
  - mu-plugin `platinatore-headless.php`: webhook bloccante, indirizzi vecchi, `post_link`, campi strutturati `pl_*` (wpvibe o nativi, scrivibili via REST).
  - Frontend Next.js 16 su Vercel, progetto `ilplatinatore`: rotte identiche a oggi, sitemap come Yoast, feed, robots, redirect di slug e date, SEO da Yoast con gli URL riportati sul dominio pubblico, noindex finché `SITO_NOINDEX` non vale `0`.
  - `PRODUCT.md` e `DESIGN.md` (palette del proprietario, Jost, scuro predefinito più chiaro).
- **Cancello**: HTTPS e noindex sul CMS verificati; ripristino del backup provato verde e rosso; scrittura REST dei campi come wpvibe; catena webhook provata da capo a fondo (5-40 s senza deploy); parità SEO sulle pagine campione; controlli automatici (`scripts/qa/controlli.py`) a 0 problemi sul sito deployato; sito su Aruba invariato.
- **Regole nate**:
  - Il nome utente delle application password è il login (`ilplatinatore`), non il nome della password.
  - Next carica `.env.local`: i segreti stanno in `.env.segreti`.
  - Col CMS headless `DISABLE_WP_CRON` più un cron di sistema, o gli articoli programmati restano fermi.
  - Nelle richieste REST l'avviso al sito parte da `rest_after_insert_post`, dopo il salvataggio dei meta, non da `transition_post_status`.
  - La cache del build di Turbopack ha pubblicato CSS vecchio: resta spenta.
  - `?p=` di un articolo non pubblicato dava 500: 401 e 403 della REST valgono «non trovato».
  - Il build si fa su Vercel, non in locale (memoria e percorsi di Windows).
  - Commit prima di qualsiasi prova che rompe apposta qualcosa.
  - Il mu-plugin si controlla con `php -l` su una copia temporanea nel contenitore, e solo dopo si sostituisce quello attivo (17/10/2026: un apostrofo non protetto ha fermato il CMS di lavoro per circa un minuto). Nei testi PHP fra apici singoli, niente apostrofi.
  - Modifiche ai file con espressioni regolari: mai attraverso stringhe Python normali (`\b` diventa un carattere invisibile, `\1` un altro): si usa lo strumento di modifica o un file di testo copiato com'è, e dopo si cercano i caratteri di controllo.
  - Cache di sviluppo di Next rotta («HMR hash mismatch», pagine che si ricaricano da sole): si ferma il server sulla propria porta e si cancella `.next`.
- **Debiti aperti**:
  - allarme «uomo morto» dei backup predisposto ma senza `HEALTHCHECK_URL` (serve un account healthchecks.io dall'utente);
  - ~~DNS di `cms.ilplatinatore.it` non ancora propagato~~: risolto, il record c'è e funziona (verificato il 20/10/2026); `CMS_URL` su Vercel e la sorveglianza spostati da `sslip.io` a `cms.ilplatinatore.it`, il nome provvisorio resta solo nel Caddyfile, da togliere al passaggio;
  - ~~archivi per data, `ads.txt`, `llms.txt`, rotta di anteprima~~ (fatti nelle Fasi 4-6); restano elenco dei 410, immagini nella sitemap, redirect 308 invece di 301;
  - wpvibe spento sul CMS di lavoro, da provare al passaggio; password di prova `collaudo-rest` da revocare;
  - importazione incrementale da Aruba ancora da fare (Fase 6).

#### Fase 2, Prototipo (completata)
- **Fatto, con le scelte dell'utente e del proprietario**:
  - piano 01, testata e scheda: B «Sovrapposta»;
  - piano 02, checklist «Lista» e progressione a «Pillola», più il pulsante «Torna all'inizio» su tutti gli articoli;
  - piano 03, collezionabili B «Tabella» e correlati C «Con immagine».
  - piano 04, hub del gioco A «Percorso» su `/tag/<gioco>/` (campi del tag, tipo di guida dal titolo) e barra di lettura A «Linea» su tutti gli articoli.
  - piano 05, la sfida del giorno su `/sfida/`: tre formati a rotazione, generati dai dati del sito (spunta «Usabile nella sfida» sul tag, trofei dei campi, classici in Strumenti > Classici della sfida); una scelta per formato (vedi `docs/brief/05-mini-gioco.md`).
  - Brief e scelte in `docs/brief/`; formato dei campi per redazione e wpvibe in `docs/guida-campi-wpvibe.md`.
- **Regole nate**: ogni dato del prototipo sta in un campo `pl_*` del CMS, mai nel codice; la tabella del testo resta solo come ripiego. Prima di ogni consegna, passata con impeccable polish e design-taste-frontend.
  - piano 06, home a sezioni sul modello games.gg (cambiata dal proprietario rispetto ai tre moduli del PDF 10): dieci file che si riempiono da sole per regola (Strumenti > Sezioni della home), locandine con una scheda grande ogni due sezioni; «Più letti» da Search Console, collegata il 17/10/2026 (proprietà `https://www.ilplatinatore.it/`, account di servizio in sola lettura; senza dati, ripiego dichiarato in pagina).
- **Cancello**: le varianti scelte dall'utente e dal proprietario sono online sull'anteprima; tutti i componenti leggono dati veri del CMS di lavoro (campi `pl_*`, campi del tag, opzioni in Strumenti), nessun dato scritto nel codice.

#### Fase 3, Verifica del prototipo (completata, approvata dall'utente il 18/10/2026)
- **Fatto**: suite `scripts/qa/criteri.py` con i 12 criteri del PDF, ognuno con il suo guasto (`--rompi`); misure d'uso come eventi nella pagina (`src/lib/misure.ts`). Rapporto in `docs/analisi/fase3-verifica.md`.
- **Cancello**: criteri del PDF (15 dopo il piano 07) verdi nel modo normale e rossi con i guasti; `controlli.py` a 0 problemi; PageSpeed della home 91 su telefono e 100 su computer; approvazione dell'utente.
- **Regole nate**:
  - Un guasto messo prima che React prenda la pagina viene cancellato da React: i guasti nel DOM si inseriscono dopo il caricamento, o il controllo sembra rotto quando non lo è.
  - Nelle file orizzontali le immagini fuori schermo si caricano comunque: oltre la quarta partono solo quando si tocca la fila.
  - Una parola più lunga della riga fa scorrere la pagina: `overflow-wrap: anywhere` sul corpo, e niente `shrink-0` senza una larghezza massima.
- **Incidente del 17/10/2026** (anteprima e CMS di lavoro, sito su Aruba mai toccato): rapporto in `docs/analisi/incidente-2026-10-17.md`. Regole nate:
  - Mai una richiesta `cache: "no-store"` dentro una pagina pubblica: la rende dinamica e ogni visita interroga il CMS.
  - Il webhook segna i dati come vecchi (`revalidateTag(…, "max")`), mai `expire: 0`: il visitatore riceve sempre l'ultima versione pronta.
  - Una pagina con una parte fallita non si salva: si lancia l'errore e resta la versione buona.
  - Le immagini le serve Caddy dal disco, senza WordPress; la conservazione lunga solo sui file che esistono, mai sugli errori.
  - Pubblicazione limitata a 2 processi con 3 pagine ciascuno, Apache a 12 processi: il CMS non si satura.
  - Prima di dire «risolto»: prova con WordPress spento, e prova da telefono emulato (Pixel e iPhone) che conti le immagini rotte.
- **Piano 07** (richieste del proprietario dopo il prototipo, 18/10/2026): testata con logo al centro, menu Select/Start a barra orizzontale, ricerca col mirino, tasto chiaro/scuro; hero a rotazione con cornice-timer; sezioni con solo il titolo e bottoni Acido; news «ultim'ora»; sfida da ogni pagina col controller; scheda del gioco dalla descrizione del tag (fine articolo, pagina del tag, hub); tabelle dei mancanti in tutti gli articoli-elenco; archivi a schede. Brief in `docs/brief/07-richieste-proprietario.md`; scelte: barra delle file sfumata, linea viola sui titoli e bagliore che pulsa. Regole nate: un bersaglio da toccare non si anima nella posizione o nella scala (pulsa solo l'alone); immagini sovrapposte (hero) partono una alla volta, o rubano banda all'LCP; dentro un `<dl>` solo `div > dt + dd`.
- **Piano di stabilità ed efficienza**: `docs/piano-stabilita.md` (monitor, server CAX21, allarme dei backup, Redis, riscaldamento dopo le pubblicazioni; al passaggio DNS su Cloudflare e immagini su R2). Sorveglianza ogni 10 minuti già attiva su GitHub Actions.
- **PageSpeed** (18/10/2026, home dell'anteprima): 91 su telefono, 100 su computer.
- **Debiti**: LCP della guida al limite (immagini di WordPress senza formati moderni, Fase 6); misure d'uso senza trasporto (Fase 5); chiave di Search Console passata via WhatsApp, da ruotare a fine lavoro. Breaking, Hot take ed «Esplora per gioco» vanno nella home completa (Fase 4).

#### Fase 4, Estensione (completata il 18/10/2026, con debiti dichiarati)
- **Fatto**:
  - **56 hub** (tag-gioco con almeno 5 articoli, elenco approvato dall'utente; esclusi Novità, PlayStation 5, Xbox, Warhammer 40000), spunta «È un gioco» sul CMS di lavoro; guida al Platino trovata dal titolo quando il campo è vuoto (20 hub su 56).
  - Home: sezione **«Esplora per gioco»** (regola `esplora-giochi` in Strumenti > Sezioni della home); gli altri moduli del PDF 09 non richiesti dall'utente.
  - **Anteprima delle bozze**: il pulsante «Anteprima» di WordPress apre la bozza sul sito (modalità bozza di Next, utente CMS dedicato `anteprima-sito` con ruolo Editor, segreti su Vercel `CMS_PREVIEW_TOKEN`, `CMS_USER`, `CMS_APP_PASSWORD`); senza cookie la bozza non esiste (404).
  - **Controlli con allarme** su GitHub Actions: `dopo-pubblicazione.yml` (a ogni push aspetta che il sito serva la versione, meta `platinatore-versione`, poi `scripts/qa/sorveglia.sh`), `mattina.yml` (ogni mattina `controlli.py` e `criteri.py`), `sorveglianza.yml`. Email al proprietario del repository se qualcosa fallisce.
- **Cancello**:
  - tutti i 56 hub verificati uno per uno (200, un h1, percorso presente);
  - pubblicazione, modifica, cambio di slug e cestino provati via REST, la stessa strada dell'editor: visibili sul sito in 2, 11, 6 e 5 s; articolo di prova eliminato;
  - un difetto vero fermato dal controllo del mattino (criterio superato dopo gli hub) e un guasto messo apposta nella sorveglianza: lavoro rosso ed email.
- **Regole nate**:
  - Vercel non avvisa GitHub delle pubblicazioni: il controllo dopo la pubblicazione aspetta la versione scritta nella pagina.
  - I lavori pianificati di GitHub non sono puntuali (la sorveglianza «ogni 10 minuti» gira ogni qualche ora): l'allarme vero e veloce richiede un monitor esterno.
  - L'anteprima delle bozze non usa mai la password di prova: utente dedicato, revocabile.
- **Debiti**:
  - prova con **wpvibe** rimandata dall'utente: il CMS di lavoro contiene il collegamento copiato del sito vero, attivarlo così potrebbe staccare quello su Aruba (da fare come secondo sito nel pannello wpvibe, o al passaggio);
  - **allarme sul telefono**: serve l'account UptimeRobot o Better Stack;
  - il token dell'anteprima viaggia nell'indirizzo del pulsante «Anteprima» (schema del riferimento): resta solo nel primo indirizzo, poi il redirect lo toglie.

#### Fase 5, Pubblicità, consenso, analytics (completata il 18/10/2026; il collaudo degli annunci veri si fa al passaggio, scelta dell'utente)
- **Fatto**:
  - i **9 spazi di HB Agency** con lo stesso markup del sito di oggi (`src/lib/annunci.ts`, `src/components/annunci.tsx`): Header Banner con altezza riservata (100 px da telefono, 250 da computer), 5 spazi nel testo dopo il 1°, 3°, 4°, 5° e 7° paragrafo, Floor Ad dopo l'articolo, Magic Left e Interstitial su ogni pagina;
  - lo **script di HB** (che porta anche il banner del consenso TCF) e **GA4 `GT-NS4PBCN4`** partono solo su `www.ilplatinatore.it` / `ilplatinatore.it`; GA4 solo dopo il consenso (finalità 1 TCF) e riceve le misure d'uso degli strumenti;
  - **navigazione a caricamento completo** (`src/components/collegamento.tsx` al posto di `next/link`): lo script di HB non ha un'API per le pagine cambiate lato client, e HB ha confermato che con lo stesso indirizzo lo script vale così com'è;
  - **`/ads.txt` identico** al file di oggi, letto dal CMS (mu-plugin, sezione 9, opzione di Advanced Ads), rigenerato ogni ora.
- **Cancello** (sull'anteprima):
  - md5 di `/ads.txt` uguale a quello del sito vero (`9ea4cc6b…`), `text/plain`, noindex;
  - nessuna richiesta verso HB, CloudFront o Google aprendo home e articolo (Chrome, telefono emulato);
  - un clic su un articolo ricarica la pagina intera; CLS dell'articolo 0;
  - i 9 id `hbagency_space_*` presenti nell'HTML dell'articolo; `controlli.py` 0 problemi, `criteri.py` verde e rosso con `--rompi`, 92 test.
- **Regole nate**:
  - gli script di terzi legati al dominio (pubblicità, statistiche) si accendono per nome di dominio in pagina, mai per variabile d'ambiente: l'anteprima resta pulita anche se qualcuno copia le variabili;
  - un file che deve restare identico (ads.txt) si confronta byte per byte, a-capo compresi, non a occhio.
- **Debiti** (tutti al passaggio, con HB):
  - impressioni viste dalla concessionaria, annunci rinnovati fra tre pagine, banner del consenso mai coperto (il pulsante della sfida e il «torna su» stanno in basso a destra, il Floor Ad in basso: da guardare con gli annunci veri);
  - **CSP**: oggi assente; si mette in sola segnalazione (report-only) al passaggio, con le origini reali che HB carica, poi si stringe;
  - nessun contatore aggregato delle misure d'uso senza consenso: senza GA4 restano solo nel `dataLayer`.

#### Fase 6, Migrazione dei dati e preparazione del passaggio (completata il 23/10/2026)
- **Fatto**:
  - **Importazione incrementale** da Aruba (sola lettura) al CMS: `scripts/importa/incrementale.py` + `infra/cms/importa-incrementale.php`. Confronta campo per campo, conserva gli ID di Aruba e i campi `pl_*`, copia i file mancanti, copia `ads.txt` se diverso, alla fine avvisa il sito. Ultimo giro il 22/10: 44 articoli creati, 94 aggiornati (i tag sistemati dal proprietario), poi 0 e 0.
  - **Parità** su 2.648 indirizzi (`scripts/qa/parita.py`), 0 differenze non spiegate; archivi per data e `llms.txt` fatti.
  - **Richieste del proprietario**: registro degli hub (ogni tag e' un hub tranne gli esclusi, sezioni dalle parole dei titoli, Strumenti > Registro degli hub); recensioni (voto con lo shortcode, figura B «Lastra inclinata», scheda del verdetto, vetrina in home); «La parola» (gioco 4, tre livelli, elenco in Strumenti > Parole della sfida, nomi brevi `facile | nome | slug`); correlati automatici in tutti gli articoli; «La parola di oggi» a fine articolo. Brief in `docs/brief/08-recensioni.md` e `09-la-parola.md`.
  - **Server**: CMS sul CX33 a Norimberga dal 22/10 (stesso IPv4, `infra/cms/sposta-server.py`); CAX11 cancellato, istantanea «platinatore-cms CAX11 prima del trasloco» conservata.
  - **DNS su Cloudflare** dal 22/10 (zona attiva alle 15:07): 49 record identici ad Aruba, compresi i 6 che si vedono solo dall'esportazione del pannello (firma DKIM `a1._domainkey`, `stat`, `statistiche`, `sms`, xmpp); `localhost` escluso apposta. Confronto: `scripts/dns/copia-zona.py --confronta`. Stato in `docs/passaggio-dns.md`.
  - **Immagini da R2**: Worker `platinatore-immagini` su `img.ilplatinatore.it` (`infra/cloudflare/`), il sito inoltra `/wp-content/uploads/` li' con gli STESSI indirizzi pubblici; immagine mancante presa dal CMS e salvata. **WebP** allo stesso indirizzo: `foto.jpg.webp` preparato dal server (`infra/cms/webp/`, cron ogni 10 minuti), dato a chi legge il WebP se pesa meno, `Vary: Accept`; versione delle immagini `?v=3`.
  - **Sitemap con le immagini**, calcolate dall'analizzatore di Yoast sul CMS (mu-plugin, sezione 13): 1.932 su 1.932 uguali al sito vero.
  - **`ads.txt` da Strumenti > ads.txt** (mu-plugin, sezione 9): file intero salvato com'e', mai vuoto, il sito lo serve senza aggiungere niente.
  - **Sorveglianza**: UptimeRobot (5 monitor con parola chiave) e healthchecks.io (backup notturno, prova di ripristino settimanale).
- **Cancello**:
  - PageSpeed della home da telefono **98** (Google, 23/10; era 87 prima del WebP), articolo 93 e hub 97 (Lighthouse locale), computer 99-100;
  - parita' 0 differenze non spiegate; `controlli.py` 0 problemi, `criteri.py` verde; 0 immagini rotte su Pixel e iPhone;
  - `ads.txt` identico byte per byte, provato dal salvataggio, con una riga aggiunta e tolta, con il CMS che risponde errore;
  - importazione rilanciata a vuoto: 0 da creare, 0 da aggiornare, 0 file mancanti.
- **Regole nate**:
  - In Caddy un `respond` sciolto viene DOPO `handle` nell'ordine delle direttive: dal 17/10 i blocchi di xmlrpc, readme e sitemap non scattavano. I blocchi stanno dentro `handle`.
  - Il crontab si installa da un file scritto con `printf`, poi si guardano i byte (`cat -A`): il 21/10 un `\r` letterale ha fermato il cron di WordPress per 16 ore (e avrebbe fermato i backup).
  - Un comando interrotto o rifiutato su un sistema vero puo' essere gia' partito: prima di dire che cosa e' successo si legge il registro (Hetzner aveva gia' spento e cambiato il server).
  - Con `trailingSlash` Next rende facoltativa la barra nelle regole: una regola «senza barra -> con la barra» rimanda ogni pagina a se stessa (anteprima in loop per 20 minuti il 22/10). Ogni regola di rimando si prova prima su indirizzi con e senza barra. Il rimando resta 308 (Google lo tratta come 301, scelta dell'utente).
  - La zona DNS si copia dall'esportazione del pannello, non solo dal DNS pubblico: i nomi che non si indovinano (il selettore DKIM) mancano. La firma della posta e' mancata dalle 14:30 alle 21:15 del 22/10.
  - L'importazione con wp-cli non avvisa il sito (non passa dalla REST): lo fa lo script alla fine.
  - Una risposta che cambia formato allo stesso indirizzo vuole `Vary: Accept`, e le copie gia' in cache senza `Vary` si scavalcano cambiando la versione `?v=`.
  - Il Worker gratuito di Cloudflare non ha la potenza per convertire immagini: le converte il server, il Worker sceglie.
  - Nei testi con `\n`, `\r`, `\1` niente heredoc o stringhe Python: strumento di modifica o `chr()`, poi ricerca dei caratteri di controllo (successo di nuovo il 23/10 nel mu-plugin, fermato prima del caricamento).
- **Debiti**:
  - meta descrizione della home assente (come oggi su Aruba): la scrive il proprietario in Yoast sul nuovo CMS;
  - «La parola»: Castlevania e Planet Zoo 2 senza nome breve (proposti «Castlevania» e «Planet Zoo»);
  - posizioni della pubblicita' scritte nel codice (`src/lib/annunci.ts`): una pagina Strumenti > Pubblicita' e' proposta, non fatta;
  - al passaggio: togliere `sslip.io` dal Caddyfile, revocare la password `collaudo-rest`, ricollegare wpvibe, CSP in sola segnalazione, elenco dei 410;
  - dopo il passaggio: cancellare l'istantanea del CAX11; ruotare le chiavi passate in chat (Cloudflare, Hetzner, Vercel, UptimeRobot, healthchecks, Search Console);
  - per Quart4 Parete: il limite gratuito del Worker (100.000 richieste al giorno) va rifatto con il traffico vero.

#### Dopo il passaggio: riconfigurazione degli annunci HB (29/10/2026, specifiche del proprietario)
- **Fatto**: 7 formati attivi (Interscroller 304968, Video Outstream 345270, In Page 304796 nel testo; Floor 304792, Magic Left 304793, Interstitial 304794, Header Banner 304962 fissi); spenti In Image 304795 (con la copia dell'immagine), Mobile Leaderboard 304970, Billboard 304969, 304961. Spazi nel testo per lunghezza (`pianoNelTesto` in `src/lib/annunci.ts`: paragrafi sostanziali di primo livello da 15 parole, classe breve/media/lunga, almeno 250 parole fra due annunci, mai attaccati a correlati o checklist). Un solo regista per i formati fissi e per lo script (`src/components/pubblicita-script.tsx`): articoli, home e archivi; telefono Magic Left + Interstitial (Magic dove e come lo mette HB, 300x320 a sinistra sopra la colonna: scelta del proprietario del 29/10 sera dopo le misure, da rivalutare dopo una settimana; `MAGIC_DA_TELEFONO` a false riporta il Floor), computer Floor (Magic al suo posto quando HB lo abilita, `MAGIC_DA_COMPUTER`). Interstitial dalla prima pagina con il capping nativo di HB a 30 minuti (scelta dell'utente: rischio SEO dichiarato), ma solo se la scelta nel banner del consenso e' gia' salvata quando la pagina si apre (cookie IAB `euconsent-v2`): per chi arriva la prima volta, dalla pagina dopo il clic. Capping messo con una proprieta' a setter su `window.hbagency_cba` prima dello script (`preparaCapping`): la chiave c'e' dal primo istante. Magic da computer, quando HB lo abilita, da 1500 px (sotto, il loro modello lo nasconde). I nostri comandi fissi salgono sopra Floor e video (`--annunci-basso`, `--annunci-destra`). Banco con annunci veri: `scripts/qa/annunci.py`.
- **Cancello** (banco in locale col dominio vero, 29/10): da telefono e computer, articoli breve/medio/lungo, home e archivio: 0 id doppi, 0 spazi spenti in pagina, 0 sovrapposizioni con i nostri comandi, 0 scorrimento orizzontale; distanze fra annunci nel testo 1.272-2.793 px; Floor chiuso con la sua X e pulsanti di nuovo giu'; interstitial: senza scelta nel banner 0 aperture su 8 visite e nessun cookie di capping (prima della correzione: 7 su 8, aperto SOTTO il banner); con la scelta salvata aperto con la X subito, chiave a 30 gia' presente all'asta (osservata come prima funzione della coda di Prebid), cookie di 30 minuti, poi 0 offerenti alla pagina dopo, ricaricando, in una nuova scheda e tornando dopo 5 minuti, di nuovo eleggibile dopo la scadenza vera del cookie. Riquadri fissi: Floor da computer 12-14% dello schermo; Magic da telefono erogato in 6 scenari su 6, 28% della superficie e 38% dell'altezza, sopra la colonna, mai sui nostri pulsanti; nessun annuncio sopra un altro (il video non e' mai stato erogato nelle prove). Unita' spente: aste vere a ogni pagina (13-14 offerenti per 304795, 304969, 304970; 1 per 304961), 0 vinte, 0 aperte. Prova sui 1.992 articoli: 0 doppioni; Interscroller 98%, Outstream 65%, In Page 18%. vitest 139, tsc, eslint, `controlli.py` 0 problemi, `criteri.py` verde e rosso.
- **Regole nate**:
  - I formati che si vedono dipendono dalla configurazione di HB, non dal nostro codice: Magic, Interstitial e Header oggi esistono solo da telefono, il Video Outstream (tipo 28) e' sempre flottante. Prima di promettere un formato si legge il loro script (lista `adUnits_hbagency` e `adzones_already_bannerType`).
  - Lo script di HB dichiara `var hbagency_cba=[]` e cancella una chiave messa prima: il capping si mette con una proprieta' a setter definita prima dello script, che rimette la chiave nella lista che HB assegna. Mai con ritardi o all'`onload`.
  - Quando un Magic si apre (da telefono si rinnova ogni 31 s) HB scrive il cookie del capping per TUTTE le chiavi di `hbagency_cba`: la chiave dell'interstitial si mette solo nelle pagine che hanno il suo spazio, o il capping si allunga senza fine.
  - Un offerente risponde anche senza consenso: un formato a tutto schermo nasce solo se la scelta nel banner e' gia' salvata (`euconsent-v2`), perche' HB non usa uno spazio creato dopo il suo avvio. Una prova «non succede» vale solo ripetuta (8 giri): due giri senza offerte l'avevano fatta passare.
  - Lo script di HB esclude i browser headless per nome: le prove usano l'identificativo di un Chrome normale.
  - Per provare il codice locale col dominio vero: Chrome con `--host-resolver-rules` verso `next dev` in HTTPS, e `allowedDevOrigins`. Un ponte con `page.route` non basta: senza il suo websocket il server di sviluppo non avvia React.
  - Le modifiche fatte con Python su Windows scrivono CRLF: si riportano a LF.
- **Configurazione ferma 7 giorni dalla pubblicazione**: pubblicata il 30/10/2026 alle 00:05 (commit `cdb7710`). Sul sito vero: banco 0 problemi in 15 scenari (Magic da telefono 6 su 6, Floor da computer), capping verde fino alla scadenza vera (00:36), controllo «Dopo la pubblicazione» verde. Lighthouse locale da telefono: home 41, articolo 39, CLS 0; l'LCP (~12 s simulati) e' il testo del banner del consenso di HB (CMP InMobi, 684 ms di blocco), non un annuncio: sulla home e' nuovo perche' ora HB parte anche li'. PageSpeed di Google non misura gli annunci (HB esclude «lighthouse» per nome): contano i dati veri (Umami, CrUX). Nessuna modifica a formati e posizioni fino al **6/11/2026 compreso**; il 6/11 il proprietario valuta (Magic da telefono compreso).
- **Debiti (da HB, nessun parametro dal nostro lato: lo script legge solo `hbagency_cba`)**: Magic Left e Header Banner da computer; togliere 304795, 304969, 304970, 304961 dalla configurazione (aste vere senza spazio); Outstream 345270 dal tipo 28 (sempre flottante, `showOOP`) a un tipo in linea; capping dell'interstitial dentro il loro script. Magic da telefono: oggi riquadro fisso di 320 px (scritto nel loro codice) con taglie fino a 300x600, 38% dello schermo misurato; anche un 300x250 con la sua X (~275 px) supera il 25% su ogni telefono (servirebbero 1.100 px di altezza) e il 30% sotto i 917 px, e si sovrappone al video flottante sotto i 550 px di larghezza (il proprietario lo ha accettato: Magic acceso cosi' com'e', da rivalutare). Il primo interstitial per chi arriva la prima volta e' sulla seconda pagina (dopo la scelta nel banner).
