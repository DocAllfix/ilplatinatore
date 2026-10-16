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

_(nessuna fase ancora completata)_
