---
name: Il Platinatore
description: Guide ai videogiochi da consultare mentre si gioca. Scopri, scegli, avanza, platina.
colors:
  notte: "#0B0D12"
  piombo: "#161A24"
  piombo-alto: "#1D2230"
  bordo: "#2A3040"
  platino: "#E6EAF2"
  acciaio: "#8A93A6"
  ciano: "#35E0FF"
  acido: "#D7FF3A"
  viola: "#7C4DFF"
  bianco-su-viola: "#FFFFFF"
  errore: "#FF6B6B"
  avviso: "#FF9F6B"
  chiaro-sfondo: "#F4F6FA"
  chiaro-superficie: "#FFFFFF"
  chiaro-bordo: "#D5DAE5"
  chiaro-testo: "#0B0D12"
  chiaro-tenue: "#4B5468"
  chiaro-link: "#5B2FE0"
typography:
  display:
    fontFamily: "Jost, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(1.875rem, 1.4rem + 2.4vw, 3rem)"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.01em"
  headline:
    fontFamily: "Jost, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 1.25
  title:
    fontFamily: "Jost, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.1875rem"
    fontWeight: 600
    lineHeight: 1.3
  body:
    fontFamily: "Jost, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 400
    lineHeight: 1.65
  label:
    fontFamily: "Jost, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "0.04em"
  dato:
    fontFamily: "Jost, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 700
    lineHeight: 1
    fontFeature: "\"tnum\" 1"
rounded:
  xs: "4px"
  sm: "8px"
  md: "12px"
  pill: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "40px"
  sezione: "clamp(40px, 8vw, 72px)"
components:
  button-primary:
    backgroundColor: "{colors.acido}"
    textColor: "{colors.notte}"
    rounded: "{rounded.sm}"
    padding: "12px 20px"
    height: "48px"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.platino}"
    rounded: "{rounded.sm}"
    padding: "12px 20px"
    height: "48px"
  scheda-riassuntiva:
    backgroundColor: "{colors.piombo}"
    textColor: "{colors.platino}"
    rounded: "{rounded.md}"
    padding: "16px"
  spunta:
    backgroundColor: "{colors.piombo}"
    textColor: "{colors.platino}"
    rounded: "{rounded.xs}"
    size: "24px"
  spunta-fatta:
    backgroundColor: "{colors.acido}"
    textColor: "{colors.notte}"
  barra-progressione:
    backgroundColor: "{colors.piombo}"
    textColor: "{colors.platino}"
    height: "56px"
  etichetta-tag:
    backgroundColor: "{colors.viola}"
    textColor: "{colors.bianco-su-viola}"
    rounded: "{rounded.xs}"
    padding: "2px 8px"
  campo-ricerca:
    backgroundColor: "{colors.piombo}"
    textColor: "{colors.platino}"
    rounded: "{rounded.sm}"
    height: "48px"
---

<!-- SEED: prima versione, dalla palette dei social del proprietario e dai caratteri del sito di oggi.
     Va riscritta in modalità scan (impeccable document) quando le prime sezioni sono costruite. -->

# Design System: Il Platinatore

## 1. Overview

**Creative North Star: "Il tracker accanto al televisore"**

Il Platinatore si consulta con il joypad in mano: telefono sul bracciolo, stanza illuminata dal televisore, sguardo che va e viene. Il sito è un pannello notturno che dà la risposta subito e tiene il conto di quello che hai fatto. Fondo Notte, testo Platino, e tre accenti che arrivano dall'identità dei post social: **Acido** per ciò che si fa e si conquista, **Ciano** per dove si va, **Viola** per l'identità.

La lettura è calma: colonna stretta, Jost grande e ben spaziato, niente decorazioni dentro il testo. L'energia si concentra nei momenti: la spunta che diventa acida, il contatore che sale, il platino raggiunto, l'esito della sfida. Il sito è uno strumento con carattere, non una rivista e non un portale.

Rifiuta il portale gaming affollato (colonne, banner ovunque, guide sepolte sotto le notizie), il blog WordPress generico (griglia di schede uguali ordinate per data) e la pubblicità che copre il contenuto. Rifiuta anche i cliché da gamer: neon a bagliore, glitch, testo sfumato, vetro decorativo.

**Key Characteristics:**
- Scuro di base (Notte), chiaro disponibile e seguito da `prefers-color-scheme`.
- Prima il telefono: ogni componente nasce a 375 px, bersagli da 44 px.
- La risposta in testa: scheda riassuntiva, indice, mancabili.
- Il progresso si vede: spunte, contatori, barra compatta.
- Spazi pubblicitari dichiarati nel layout, con altezza riservata.
- Movimento solo sui traguardi; tutto il resto rapido e discreto.

## 2. Colors

La palette dei post social del Platinatore, usata con ruoli fissi: neutri freddi, tre accenti che non si scambiano mai il compito.

### Primary
- **Acido** (#D7FF3A): azione principale (pulsanti «Riprendi», «Gioca»), spunta fatta, numeri di progresso, parola chiave evidenziata. 16,9:1 su Notte. Testo sopra l'Acido sempre in Notte.

### Secondary
- **Ciano** (#35E0FF): link, icone di navigazione, bordo dello stato attivo e del focus, campo di ricerca. 12,3:1 su Notte. È il colore del «vai».

### Tertiary
- **Viola** (#7C4DFF): identità (logo, striscia di testata), etichette dei giochi, riempimenti grafici. Mai come testo piccolo su scuro (4,0:1): solo riempimenti, o testo grande. Sopra il Viola, testo Bianco (4,8:1). Per il testo in viola c'è **Viola testo** (`--viola-testo`): #A98BFF sullo scuro (7,2:1 su Notte), #5B2FE0 sul chiaro (7,2:1 su bianco).

### Neutral
- **Notte** (#0B0D12): fondo di pagina, testata, piede.
- **Piombo** (#161A24) e **Piombo alto** (#1D2230): pannelli, scheda riassuntiva, righe delle tabelle, barra di progressione.
- **Bordo** (#2A3040): linee da 1 px, divisori, spunte non fatte.
- **Platino** (#E6EAF2): testo principale (16,1:1).
- **Acciaio** (#8A93A6): metadati, date, didascalie (6,3:1 su Notte, 5,6:1 su Piombo).

### Stati (proposta, non presenti nei post: da validare col proprietario)
- **Errore** (#FF6B6B): tentativo sbagliato nella sfida, errori di caricamento.
- **Avviso** (#FF9F6B): trofeo mancabile, spoiler, dati incompleti.
- Completato usa l'Acido, sempre con icona di spunta e testo («Fatto»): mai solo colore.

### Tema chiaro (proposta del proprietario, contrasti verificati)
Sfondo #F4F6FA, superficie #FFFFFF, bordo #D5DAE5, testo #0B0D12 (17,9:1), testo tenue #4B5468 (7,0:1), link in viola scurito #5B2FE0 (6,6:1). L'Acido resta solo come sfondo (pulsanti, spunte), mai come testo.

### Named Rules
**The Three Jobs Rule.** Acido = fare e conquistare. Ciano = andare. Viola = essere il Platinatore. Un accento non fa mai il lavoro di un altro.

**The Moment Rule.** Gli accenti pieni coprono al massimo il 10% di una schermata di lettura. In home e nella sfida possono salire: sono i momenti.

**The Owner's White Exception.** Il Bianco puro esiste solo come testo sopra il Viola, come nei post. Ovunque altro, Platino.

## 3. Typography

**Font unico:** Jost (variabile, ospitato in locale, licenza OFL), con fallback di sistema. È il carattere del sito di oggi: i lettori lo riconoscono.
**Numeri:** Jost con cifre tabulari (`tnum`) per contatori e dati della scheda, così 9/12 e 10/12 non ballano.

**Character:** Jost è geometrico e amichevole, con un'energia giocosa nelle curve che regge sia il titolo deciso a 700 sia la lettura lunga a 400.

### Hierarchy
- **Display** (700, clamp 30 → 48 px, 1.1): titolo della guida e dell'hub. Titoli fino a 150 caratteri: deve andare a capo bene, mai troncato.
- **Headline** (700, 24 px, 1.25): sezioni della guida (h2).
- **Title** (600, 19 px, 1.3): titoli delle schede, voci della checklist, sottosezioni (h3).
- **Body** (400, 18 px, 1.65): testo delle guide, massimo 68ch.
- **Label** (600, 13 px, spaziatura 0,04em, maiuscolo): etichette dei dati, categorie, tipo di aiuto.
- **Dato** (700, 28 px, cifre tabulari): numeri della scheda riassuntiva e dei contatori.

### Named Rules
**The Sentence Case Rule.** Titoli con la sola prima lettera maiuscola, all'italiana. Il maiuscolo esiste solo nelle etichette brevi.

## 4. Elevation

Piatto per difetto: la profondità viene dai livelli di neutro (Notte, Piombo, Piombo alto) e dai bordi da 1 px, non dalle ombre. Su un fondo così scuro le ombre non si vedono e sporcano.

### Shadow Vocabulary
- **Sospeso** (`box-shadow: 0 8px 24px oklch(0% 0 0 / 0.45)`): solo per ciò che galleggia sopra il contenuto, cioè la barra di progressione fissata e il pannello del menu su telefono.

### Named Rules
**The Flat-By-Default Rule.** Superfici piatte a riposo. L'ombra compare solo su ciò che sta sopra il testo mentre si scorre.

## 5. Components

### Buttons
- **Shape:** angoli leggermente arrotondati (8 px), altezza 48 px.
- **Primary:** Acido con testo Notte, peso 600. Uno per schermata.
- **Secondary:** trasparente, bordo 1 px Bordo, testo Platino; al passaggio bordo Ciano.
- **Focus:** anello di 2 px Ciano, staccato di 2 px dal pulsante.

### Scheda riassuntiva (PDF 03)
Il cuore della guida, in testa all'articolo. Pannello Piombo, griglia di dati a due colonne su telefono: difficoltà, ore, partite, mancabili, online. Ogni dato ha etichetta (Label), valore (Dato) e condizione della stima in Acciaio. Versione mini in una riga per schede e archivi.

### Checklist e barra di progressione (PDF 05)
- **Spunta:** quadrato da 24 px dentro un bersaglio da 44 px; vuota con bordo, fatta in Acido con il segno di spunta in Notte e il testo «Fatto» per gli screen reader.
- **Barra compatta:** fissata in basso su telefono, in alto su computer; contatore «9 di 24» in cifre tabulari, comandi Indice, Da completare, Riprendi, Inizio. Riappare risalendo, non copre mai i titoli.

### Tabella dei collezionabili (PDF 06)
Righe in Piombo separate da Bordo; colonne stato, elemento, area, prerequisito, soluzione. Su telefono ogni riga diventa una scheda compatta. Le righe fatte si attenuano (opacità) e restano leggibili; filtro «Solo mancanti», filtro per area, spoiler nascosti dietro un tocco.

### Correlati contestuali (PDF 07)
Riquadri «Prima di continuare», «Procedura dettagliata», «Prossimo obiettivo»: bordo completo da 1 px e un'icona iniziale, mai una striscia colorata sul lato. Ogni riquadro dice perché il collegamento serve.

### Etichette e tag
Gioco in Viola pieno con testo Bianco; tipo di aiuto con bordo e testo Acciaio.

### Spazi pubblicitari
Contenitori con altezza minima riservata per ciascun formato di HB Agency, etichetta «Pubblicità» in Label Acciaio, mai sopra la scheda riassuntiva né dentro la barra di progressione.

### Firma visiva dai post social (con misura)
La striscia a tre colori (Ciano, Viola, Acido) in cima alla testata. La parola chiave su blocco Acido inclinato di −6° solo nei titoli della home e della sfida, mai nelle guide.

## 6. Do's and Don'ts

### Do:
- **Do** progettare prima la pagina guida a 375 px, poi home e hub.
- **Do** mettere in testa i dati che servono e dichiarare da dove vengono.
- **Do** accompagnare ogni stato con testo o icona (Fatto, Mancabile, Spoiler).
- **Do** riservare l'altezza degli spazi pubblicitari e delle immagini (CLS < 0,1).
- **Do** rispettare `prefers-reduced-motion`: spunta e contatore diventano istantanei.
- **Do** provare ogni componente con i titoli più lunghi (fino a 150 caratteri) e con dati mancanti.

### Don't:
- **Don't** costruire un portale affollato: niente colonne laterali di notizie, niente banner fra un dato e l'altro.
- **Don't** tornare alla griglia di schede tutte uguali ordinate per data del blog di oggi.
- **Don't** usare il Viola come colore del testo piccolo su scuro.
- **Don't** usare strisce colorate sul lato di riquadri e avvisi, testo sfumato, vetro decorativo, bagliori neon.
- **Don't** affidare completamento e stati al solo colore.
- **Don't** usare trattini lunghi nei testi.
- **Don't** coprire testo o controlli con la pubblicità.

## Componenti nati col piano 07 (18/10/2026)
- **Testata**: logo e nome al centro; a sinistra i tasti Select/Start (menu a barra orizzontale sotto il titolo), a destra mirino (ricerca) e sole/luna (tema). La striscia a tre colori resta in cima.
- **Bottone Acido**: blocco Acido inclinato con scritta Notte, come le ore del Platino. Mai scritta bianca sull'Acido (1,1:1).
- **Ultim'ora**: cornice Errore e bollino rosso chiaro fisso (#FF6B6B, scritta Notte) con il fuoco, sempre sopra l'immagine scurita.
- **Bagliore** della scheda del gioco: il bordo pulsa alternando Ciano, Viola, Acido; fermo con movimento ridotto.
- **Titoli h2** degli articoli: linea Viola di 4 px a sinistra.
- **Barra delle file** della home: cursore sfumato Ciano, Viola, Acido su binario Linea, trascinabile.
- **Cornice-timer** dell'hero: un colore per articolo (Ciano, Viola, Acido), si consuma in 7 s; pausa sempre disponibile.
- **Controller della sfida**: pulsa solo l'alone viola, il pulsante resta fermo.
