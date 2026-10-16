# Piano di design 02: checklist dei trofei e barra di progressione

Skill: impeccable `shape`. Stato: **da confermare**. Ancore: `PRODUCT.md`, `DESIGN.md`, PDF sezioni 05, 06 e 10.

## 1. Che cosa
Le tabelle dei trofei della guida diventano liste da spuntare, **al loro posto** nel testo, dove si spiega come ottenerli. Una barra compatta tiene il conto generale e porta dove serve. Il lettore gioca, torna, spunta, e ritrova tutto com'era.

## 2. Azione principale
Spuntare un trofeo ottenuto e vedere quanto manca.

## 3. Direzione
Restrained nella lettura; l'Acido arriva solo quando si spunta (la spunta fatta, il contatore). Energia nel momento della spunta, calma nel resto.

## 4. Ampiezza
Alta fedeltà, componenti veri. Dati: **solo le tabelle della guida** (scelta dell'utente): 33 trofei in tre gruppi, boss e storia (11), missioni (6), combattimento (16). Il contatore lo dichiara: «trofei in elenco in questa guida», mai «su 39».

## 5. Struttura
- **Nel testo:** ogni tabella di trofei diventa un gruppo con titolo, contatore del gruppo («3 di 11») e le righe da spuntare. La riga fatta si attenua e resta leggibile (comportamento di MapGenie, PDF 06).
- **Barra:** fissa in basso da telefono, in alto da computer; riappare risalendo. Contiene il contatore generale («12 di 33 trofei») e quattro comandi: **Indice**, **Da completare**, **Riprendi**, **Inizio** (PDF 05).
- Sotto l'ultimo gruppo: nota onesta («le spunte restano su questo dispositivo, non sono collegate al profilo PlayStation») e **Azzera** con conferma.

Tre varianti della riga, da scegliere sull'anteprima:
- **A, «Lista»:** spunta a sinistra, nome del trofeo in grassetto, come ottenerlo sotto in Acciaio.
- **B, «Schede»:** ogni trofeo è una scheda compatta, con un pulsante «Fatto» grande a destra per il pollice.
- **C, «Tabella»:** le colonne restano come oggi, con una colonna di spunte in testa; da telefono le colonne si impilano.

## 6. Stati
Nessuna spunta (primo arrivo); alcune; gruppo completato (il contatore del gruppo diventa Acido con «Completato»); tutto completato; filtro «Da completare» attivo; dopo Azzera; JavaScript spento (le tabelle restano leggibili, senza spunte); memoria del browser non disponibile (le spunte funzionano ma non restano, e lo si dice).

## 7. Interazione
- Spunta: tocco su tutta la riga (bersaglio ≥ 44 px), segno che si disegna in 150 ms, contatore che scatta; istantaneo con movimento ridotto.
- Salvataggio nel browser (localStorage), per articolo.
- **Indice:** elenco delle sezioni della guida con le ancore; **Da completare:** nasconde le righe fatte; **Riprendi:** porta al primo trofeo non spuntato; **Inizio:** torna su. Nessun comando copre i titoli (`scroll-margin`).
- Azzera: chiede conferma inline, non una finestra.

## 8. Testi
«12 di 33 trofei», «Da completare», «Riprendi», «Indice», «Inizio», «Completato», «Azzera le spunte di questa guida», «Sicuro? Le spunte non si recuperano», nota sul salvataggio locale.

## 9. Riferimenti impeccable
interaction-design, motion-design (spunta e contatore), spatial-design (barra fissa e ancore).

## 10. Domande aperte
- Le misure d'uso (spunte, ritorni) richieste dal PDF: gli eventi si preparano qui, si attivano col contatore aggregato in Fase 5.
- Gli altri trofei citati solo nel testo (Sfratto Abissale, Arsenal Absolute, Ambersmith…) restano fuori finché la lista non passa ai campi strutturati.

## Scelte (16/10/2026)

- Riga della checklist: **A, «Lista»**.
- Barra: il proprietario non voleva la barra in alto. Giro 2 con tre barre in basso; scelta la **B, «Pillola»**, in basso a sinistra, con Indice, Mancanti, Riprendi.
- «Inizio» tolto dalla pillola: al suo posto il pulsante con la freccia «Torna all'inizio», in basso a destra, **su tutti gli articoli**.
