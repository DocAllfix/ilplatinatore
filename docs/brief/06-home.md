# Piano di design 06: home a sezioni

Skill: impeccable `shape`. Stato: **chiuso** (17/10/2026), scelte in fondo. Ancore: `PRODUCT.md`, `DESIGN.md`, PDF sezioni 01, 02, 09 e 10; `00-raccordo.md` punto 7.

## 1. Che cosa
Prima proposta: tre moduli (PDF 10). **Cambiata dal proprietario** (17/10/2026), che è anche l'autore del PDF: modello games.gg, «una decina di sezioni diverse, simil modello Netflix». Ogni sezione è una macroarea che **si riempie da sola** con news e guide, ordinate per ultima modifica: nessuno sceglie gli articoli.

Sezioni di partenza (Strumenti > Sezioni della home, modificabili dalla redazione):
1. **Più letti**: Search Console, 28 giorni (scelta dell'utente); finché non c'è l'accesso, ripiego dichiarato in pagina (aggiornati negli ultimi 14 giorni).
2. **I giochi del momento**: gli articoli dei 6 giochi con più uscite negli ultimi 30 giorni.
3. **La sfida del giorno**: la card, con lo stato della partita.
4. **I classici senza tempo**: gli articoli dei giochi segnati «classico» sul tag (16, bozza mia).
5. **Gli enigmi più complicati**: titolo con enigma, enigmi, rompicapo, puzzle, soluzione.
6. **Indie da scoprire**: gli articoli dei giochi segnati «indie» sul tag (15, bozza mia).
7. **Boss da battere**: titolo con sconfiggere o boss.
8. **Guide al Platino**: titolo con platino.
9. **Ultime notizie**: categoria News.
10. **Ultime guide**: categoria Guide.

Il gioco si segna «classico» o «indie» **una volta sola** sul tag (campo «Sezioni della home»): da lì tutti i suoi articoli entrano da soli.

## 2. Azione principale
Scorrere le file e trovare la guida o la news che interessa, o entrare nella sfida.

## 3. Direzione
Formati diversi ma coerenti (PDF 01): etichetta Guida o News su ogni scheda, gioco in Viola, data di aggiornamento. Ogni fila dichiara il suo criterio sotto il titolo.

## 4. Vincolo SEO
La home oggi elenca gli ultimi articoli con `/page/N/`: Google scopre da lì gli articoli nuovi. Restano le file «Ultime notizie» e «Ultime guide» con il link alla categoria, e in fondo «Tutti gli articoli, dal più recente» verso `/page/2/`, che non cambia.

## 5. Varianti
- **A, «File»**: schede 16:9 scorrevoli, come Netflix.
- **B, «Locandine»**: schede verticali, titolo sull'immagine.
- **C, «In evidenza»**: in ogni sezione la prima scheda grande, le altre in elenco compatto (niente scorrimento laterale).

## 6. Stati
Sezione senza articoli (non compare); Search Console non collegata (ripiego dichiarato); sfida già giocata (esito e «nuova sfida domani»); nessuna sezione nel CMS (resta l'elenco degli ultimi articoli di oggi).

## Scelte (17/10/2026)

- Il proprietario: «mi piace la C perché ha una scheda più grande delle altre, e la B per il modo in cui dispone le schede simil-card». Risultato: **file di locandine verticali (B)**, e **una sezione sì e una no apre con una locandina larga il doppio** e alta come le altre (l'impatto della C).
- Nessun articolo si ripete fra le sezioni (resta in quella più in alto), salvo che una fila resti con meno di 4 schede.
