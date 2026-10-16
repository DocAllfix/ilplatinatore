# Piano di design 01: testata della guida e scheda riassuntiva

Skill: impeccable `shape`. Stato: **da confermare**. Ancore: `PRODUCT.md`, `DESIGN.md`, PDF sezioni 03 e 10.

## 1. Che cosa
La parte alta della pagina guida, da telefono: chi arriva da Google con il joypad in mano deve capire in tre secondi **quanto è difficile, quanto dura, cosa può perdere**, e poi scendere nella guida. Prima sezione del prototipo su Valor Mortis (`/2026/10/13/valor-mortis-guida-platino-tutti-trofei/`).

## 2. Azione principale
Leggere i dati del platino e decidere da dove partire (roadmap, mancabile, checklist).

## 3. Direzione
- Colore: **Restrained** nella lettura (neutri Notte/Piombo, Platino), Acido solo sui numeri chiave e sul pulsante, Ciano sui link, Viola sull'etichetta del gioco.
- Scena: sera, divano, telefono sul bracciolo con la luce del televisore, sguardo che va e viene: tema scuro, numeri grandi leggibili a colpo d'occhio.
- Ancore: la scheda di PowerPyx (13 voci fisse), la testata di PSNProfiles (tre numeri grandi), la testata delle guide di Eurogamer (gioco, firma, aggiornamento).

## 4. Ampiezza
Alta fedeltà, solo testata + scheda, componenti veri con dati veri, tre varianti sulla stessa pagina scelte con `?v=a|b|c`. Il resto della guida resta com'è.

## 5. Struttura
Ordine dall'alto: briciole → etichetta gioco + tipo di aiuto → titolo → firma e data di aggiornamento → **scheda** → spazio pubblicitario riservato → corpo della guida.

Tre varianti della scheda:
- **A, «Pannello»**: griglia 2 colonne di dati grandi (difficoltà, ore, partite, mancabili), sotto una riga di trofei per tipo, poi un «Mostra tutti i dati» per il resto.
- **B, «Striscia»**: una sola riga compatta di tre numeri (difficoltà con barra da 10 tacche, ore, partite) e il mancabile evidenziato in Avviso; tutti gli altri dati in un pannello che si apre.
- **C, «Copertina»**: l'immagine in evidenza come fondo della testata, scurita; titolo sopra; la scheda come fascia piena sotto, con il numero più importante su blocco Acido inclinato (firma dei post social).

## 6. Stati
- Dati completi (Valor Mortis).
- Dati parziali: una voce mancante non lascia un buco, sparisce; se mancano tutte, la scheda non compare.
- Titolo lunghissimo (150 caratteri), nome del gioco lungo.
- Senza immagine in evidenza (variante C torna a fondo pieno).
- Tema chiaro.

## 7. Interazione
Nessun JavaScript per la scheda: il «Mostra tutti i dati» è un `<details>` nativo. Il selettore delle varianti è l'unico componente client, e sparisce dopo la scelta.

## 8. Testi
Etichette: Difficoltà, Tempo per il platino, Partite, Mancabili, Online, Trofei. Condizione della stima sotto il dato («stima della redazione, dipende dall'abilità»). «Aggiornata il …» accanto alla firma.

## 9. Dati
Dalla prima tabella della guida (`Requisito | Dettaglio`, 14 voci), letta dall'HTML vero dell'articolo al momento del build. I campi strutturati in WordPress arrivano dopo l'approvazione del formato.

## 10. Domande aperte
- Spazio pubblicitario «prima del contenuto» (Header Banner di HB Agency): oggi sta sopra tutto; nel piano sta **dopo** la scheda. Da confermare con HB Agency.
- La scheda va tolta dal corpo dell'articolo dove si ripete (oggi è la prima tabella): nella prova la nascondo dal corpo solo se è identica.

## Giro 2 (16/10/2026)

Scelta dell'utente sul giro 1: la **copertina della C** (titolo sull'immagine, blocco Acido inclinato) con la **griglia di 4 dati della A** e «Tutti i dati» che si apre sotto. Tre varianti di questa combinazione, che differiscono per come la griglia si lega alla copertina:
- **A, «Pannello»**: riquadro separato sotto la copertina;
- **B, «Sovrapposta»**: il riquadro sale sul fondo dell'immagine (copertina più alta, ombra «Sospeso»);
- **C, «Fascia»**: fascia piena a tutta larghezza attaccata alla copertina, linee sottili fra i dati.
In tutte: ore del platino sul blocco Acido, difficoltà con tacche, partite, trofei; mancabile con icona e testo; nota sulle stime.
