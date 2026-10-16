# Piano di design 03: tabella dei collezionabili mancanti e correlati contestuali

Skill: impeccable `shape`. Stato: **confermato** (16/10/2026), varianti in prova sull'anteprima. Ancore: `PRODUCT.md`, `DESIGN.md`, PDF sezioni 06, 07 e 10.

## 1. Che cosa
- **Tabella dei mancanti (PDF 06)** in testa agli articoli «Collezionabili Capitolo 1, 2, 3» di Valor Mortis: tutti gli oggetti del capitolo, da spuntare, con area, tipo, eventuale prerequisito e il link alla sezione dell'articolo che spiega come prenderli.
- **Due correlati contestuali (PDF 07)** dentro la guida al platino, nel punto in cui servono, ciascuno con il perché.

## 2. Azione principale
Vedere subito cosa manca nel capitolo e saltare alla spiegazione di quell'oggetto.

## 3. Direzione
Come la checklist (piano 02): Restrained nella lettura, Acido solo su spunte e contatori. Stessa casella, stessa memoria nel browser, stessa pillola di progressione.

## 4. Dati
- **Collezionabili**: nuovo campo strutturato `pl_collezionabili` (area, oggetto, tipo, prerequisito, sezione della soluzione). Li compilo io leggendo i tre articoli, sul CMS di lavoro; la redazione rivede. Per le guide nuove li compila wpvibe (istruzione in `docs/guida-campi-wpvibe.md`).
- **Correlati**: nuovo campo `pl_correlati` (tipo, articolo, perché, sezione dopo cui compare). Due collegamenti veri fra guide di Valor Mortis; i testi del perché sono una mia bozza ricavata dalle guide, approvata dal proprietario sulle varianti.

## 5. Struttura e varianti
**Tabella dei mancanti**, sempre in testa all'articolo, sotto la testata: contatore generale («7 di 19») e contatore per tipo («Ambre 2 di 3»); comandi Solo mancanti, filtro per area, Mostra spoiler; Azzera con conferma; ogni oggetto porta alla sua sezione.
- **A, «Per area»**: gruppi per area, apribili e chiudibili; righe con spunta, nome, tipo e «Come prenderlo».
- **B, «Tabella»**: colonne Stato, Oggetto, Area, Tipo; filtri per area come pulsanti sopra; da telefono le righe si impilano.
- **C, «Aree a schede»**: le aree in una fila di pulsanti scorrevole; sotto, solo gli oggetti dell'area scelta.

**Correlati**: «Prima di continuare» prima del trofeo mancabile Sfratto Abissale, verso la guida dedicata; «Prossimo obiettivo» alla fine dei trofei della storia, verso i collezionabili del Capitolo 1.
- **A, «Riquadro»**: bordo pieno, icona, tipo del collegamento, titolo e perché.
- **B, «Riga»**: una riga compatta con freccia e il perché sotto.
- **C, «Con immagine»**: miniatura dell'articolo di destinazione accanto a titolo e perché.

## 6. Stati
Nessuna spunta; alcune; raccolta completata («Completato»); tutto il capitolo completato; filtro attivo senza risultati; spoiler nascosti (il nome dell'oggetto si rivela al tocco); dati mancanti (la tabella non compare); correlato verso un articolo non pubblicato (non compare).

## 7. Interazione
Come la checklist: spunta su tutta la riga, contatori che scattano, memoria nel browser, movimento ridotto rispettato. «Come prenderlo» porta all'ancora della sezione, senza coprire il titolo.

## 8. Testi
«7 di 19 oggetti», «Solo mancanti», «Tutte le aree», «Mostra spoiler», «Come prenderlo», «Prima di continuare», «Procedura dettagliata», «Prossimo obiettivo».

## 9. Domande aperte
- Spoiler: quali oggetti sono spoiler lo decide la redazione (campo sì/no); nel prototipo nessuno.
- Le misure d'uso (spunte, passaggi verso i correlati) si attivano in Fase 5.
