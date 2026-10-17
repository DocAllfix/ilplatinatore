# Piano di design 05: mini-gioco «La sfida»

Skill: impeccable `shape`. Stato: **chiuso** (17/10/2026), scelte in fondo. Ancore: `PRODUCT.md`, `DESIGN.md`, PDF sezioni 08, 09 e 10; riferimenti Gamedle Classic e Guess.

## 1. Che cosa
Una sfida giocabile da telefono, con tre formati a rotazione (scelta dell'utente in Fase 0): **Riconosci il gioco** (immagine che si schiarisce a ogni tentativo), **Indovina il trofeo** (indizi progressivi su un trofeo, si indovina il gioco o il trofeo), **Riconosci il classico** (come il primo, su giochi storici). Alla fine: risultato, soluzione sempre visibile e un rimando pertinente (hub del gioco, guida al Platino o approfondimento). PDF 08: «mostrare sempre la soluzione senza imporre un clic su un articolo».

## 2. Azione principale
Fare un tentativo in un tocco e capire subito se ci si è avvicinati.

## 3. Tecnica
React e CSS, un `<canvas>` per l'immagine sgranata; nessuna libreria 3D o di gioco. Stato della partita nel browser (come le spunte), una sfida al giorno o alla settimana uguale per tutti.

## 4. Dati (dal CMS, niente nel codice)
Risposte dell'utente (17/10/2026): sfide **generate dai dati del sito**, **una al giorno** (cambia a mezzanotte di Roma), immagini **solo quelle già sul sito**.
- **Riconosci il gioco**: fra i tag con la spunta «Usabile nella sfida» (77 segnati sul CMS di lavoro, esclusi Novità, PlayStation 5, Xbox, Nintendo Switch, Warhammer 40000) o con l'hub; immagine della guida più recente del gioco. Non accende gli hub (scelta dell'utente).
- **Indovina il trofeo**: dai trofei della guida al Platino dei giochi con hub (campi `pl_trofei`, o tabelle come ripiego). Indizi: come si ottiene, gruppo della guida, lettere a metà.
- **Riconosci il classico**: a indizi, **senza immagini** (nessun problema di diritti): anno, console, studio, genere, serie, come Gamedle Guess. Elenco curato di 53 classici in Strumenti > Classici della sfida (mu-plugin, sezione 7), modificabile dalla redazione.
- Rotazione: un formato al giorno; dentro ogni formato si passa per tutti gli elementi prima di ripeterne uno.

## 5. Struttura e varianti
Comuni: titolo del formato, numero della sfida, tentativi rimasti (di solito 5), indizio o immagine, campo per rispondere, storico dei tentativi, a fine partita soluzione, rimando e condivisione del risultato senza spoiler (quadratini, come Wordle).
- **A, «Scheda»**: tutto in una carta centrale, risposta a scelta multipla (6 opzioni grandi da toccare).
- **B, «Ricerca»**: risposta libera con suggerimenti mentre si scrive (elenco dei giochi del sito), più vicina a Gamedle.
- **C, «Rivelazione»**: l'immagine o gli indizi occupano lo schermo, i tentativi stanno in una fila di caselle in basso; la soluzione si svela con un'animazione.

## 6. Stati
Prima visita; partita in corso (si riprende); vinta; persa (soluzione comunque mostrata); già giocata oggi; immagine che non carica; nessuna sfida pubblicata (la pagina lo dice e rimanda agli hub); movimento ridotto.

## 7. Dove
Pagina nuova `/sfida/` (indirizzo nuovo, nessun conflitto con quelli di oggi), card in home (modulo «Sfida» della Fase 2), accesso dagli articoli dopo il testo.

## 8. Misure
Partite iniziate, completate, vinte; passaggi verso il rimando finale (PDF 10). Si attivano col contatore aggregato in Fase 5.

## Scelte (17/10/2026)

Una scelta per formato, non una variante per tutti (regole in `src/lib/sfida.ts`, `REGOLE`):
- **Riconosci il gioco**: A, risposta a scelta (6 opzioni) e aspetto «Scheda»; 5 tentativi.
- **Indovina il trofeo**: risposta a scelta (A) con aspetto «Rivelazione» (C): niente carta, tentativi in una fila di caselle; 5 tentativi.
- **Riconosci il classico**: C, risposta scritta con suggerimenti e aspetto «Rivelazione»; **10 tentativi**, e dopo il quinto errore un aiuto con iniziale, genere e studio.
- `?f=gioco|trofeo|classico` mostra un formato diverso da quello del giorno: serve alle prove e ai controlli automatici.
