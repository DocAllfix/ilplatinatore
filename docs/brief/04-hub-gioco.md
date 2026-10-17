# Piano di design 04: hub del gioco

Skill: impeccable `shape`. Stato: **chiuso** (17/10/2026), scelte in fondo. Ancore: `PRODUCT.md`, `DESIGN.md`, PDF sezioni 04, 05, 09 e 10; riferimenti Game8 (hub Elden Ring) e Nintendo Life (scheda del gioco), `docs/analisi/fase0-analisi.md` 3.2.

## 1. Che cosa
La pagina `/tag/valor-mortis/` smette di essere un archivio in ordine di data e diventa la **scheda del gioco** (PDF 04): presentazione, piattaforme, dati del completamento, «Inizia qui», guida al Platino, guide specifiche per tipo di aiuto, notizie separate. Stesso indirizzo di oggi (decisione presa: l'hub prende il posto del tag, nessun redirect). La paginazione `/tag/valor-mortis/page/N/` resta raggiungibile come archivio completo.

## 2. Azione principale
Capire da dove partire e arrivare in un tocco alla guida che serve adesso.

## 3. Direzione
Strumento, non portale: niente griglia di copertine tutte uguali. Gerarchia netta: prima il percorso (Inizia qui, Platino), poi le guide per tipo. Viola come identità del gioco, Acido solo per progresso e azioni.

## 4. Dati (tutti dal CMS, niente nel codice)
- **Sul tag** (campi nuovi del termine, `pl_*`): «è un gioco» sì/no (00-raccordo, punto 4: non tutti i tag sono giochi), presentazione breve, piattaforme, data di uscita, sviluppatore, guida al Platino (slug), «Inizia qui» (slug in ordine).
- **Dati del completamento**: letti dalla guida al Platino (campi della scheda già compilati: difficoltà, ore, partite, mancabili, online). Nessun doppione.
- **Tipo di aiuto di ogni guida**: dedotto dal titolo (scelta dell'utente), con regole provate sui 26 titoli veri (`src/lib/hub.test.ts`): Platino e trofei, Collezionabili, Missioni, Boss, Armi e potenziamenti, Meccaniche e consigli.
- **Notizie**: articoli del tag nella categoria News, in un flusso a parte (per Valor Mortis oggi 0: stato vuoto).
- **Il tuo progresso**: dalle spunte già salvate nel browser (trofei della guida al Platino, oggetti dei capitoli), solo se ci sono.

## 5. Struttura e varianti
Comuni a tutte: testata del gioco (copertina, nome, piattaforme, uscita), dati del completamento in mini-scheda, «Inizia qui» (3 passi), guida al Platino in evidenza, guide per tipo di aiuto con filtro (primo filtro chiesto dal PDF), «Riprendi» se c'è progresso, notizie, archivio completo.
- **A, «Percorso»**: dopo la testata, una colonna unica a passi numerati (1 Inizia qui, 2 Platino, 3 Collezionabili, 4 Pulizia finale) che ricalca le fasi della roadmap; le guide per tipo sotto, in elenchi compatti.
- **B, «Indice»** (Game8): indice delle categorie in testa come griglia di accessi per tipo di aiuto con il numero di guide; ogni tocco filtra l'elenco sotto. Il percorso è un riquadro laterale da computer, in testa da telefono.
- **C, «Pannello»**: testata più alta con i dati del completamento e il tuo progresso a fianco (anelli/barre per Platino e collezionabili); sotto, schede orizzontali per tipo di aiuto scorrevoli da telefono.

## 6. Stati
Primo arrivo senza progresso; progresso parziale (Riprendi porta al primo trofeo/oggetto mancante); tipo di aiuto senza guide (non compare); nessuna notizia (lo si dice, con rimando alle guide); tag senza campi del gioco (resta l'archivio di oggi, nessuna pagina rotta); guida al Platino non indicata (il riquadro non compare).

## 7. SEO
Titolo e descrizione dell'hub nuovi (oggi «Valor Mortis Archivi», nessuna descrizione); schema `CollectionPage` con `ItemList` e `about: VideoGame`; canonical invariato; la paginazione resta.

## 8. Testi
«Inizia qui», «Guida al Platino», «Tutte le guide», «Riprendi da dove eri», «Notizie», «Archivio completo», etichette dei tipi di aiuto.

## 9. Risposte dell'utente (17/10/2026)
- Tipo di aiuto: automatico dal titolo.
- Presentazione e dati del gioco: bozza mia nei campi del tag, approva il proprietario.
- Progresso del lettore: «Riprendi da dove eri» solo se c'è.
- Copertina: quella della guida al Platino.
- In più: **barra di lettura** su tutti gli articoli, semplice ma più ludica. Tre varianti: A «Linea» (linea Acido in cima con il trofeo in punta, che si accende a fine lettura), B «Livelli» (una tacca per sezione, come una barra dell'esperienza, con «Sezione 3 di 13»), C «Anello» (anello intorno al pulsante per tornare su, che diventa un trofeo a fine lettura).
- Breaking, Hot take e flusso delle notizie (PDF 01, 02, 09): home completa, Fase 4.

## Scelte (17/10/2026)

- Hub del gioco: **A, «Percorso»** (passi numerati Inizia qui, Platino, Raccogli tutto, Pulizia finale; poi tutte le guide con il filtro a pulsanti).
- Barra di lettura: **C, «Anello»** intorno al pulsante per tornare all'inizio, su tutti gli articoli; sostituisce il vecchio pulsante «Torna all'inizio».
- Da far confermare al proprietario: presentazione del gioco, guide di «Inizia qui», editore (Lyrical Games).
