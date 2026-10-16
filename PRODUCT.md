# Product

## Register

product

## Users

Giocatori italiani, quasi tutti da telefono (69% delle sessioni) e quasi tutti arrivati da Google (circa 80%) con una domanda precisa: «dove trovo…», «come sblocco…», «quanto ci vuole per il platino di…». Leggono la guida **mentre giocano**: il telefono accanto al joypad, lo sguardo che va e viene dal televisore, spesso la sera. Hanno fretta di tornare al gioco, ma tornano più volte sulla stessa guida finché non chiudono l'obiettivo.

Un secondo gruppo, più piccolo, arriva in home o sugli hub per scegliere: cosa sta uscendo, quale gioco platinare dopo, quale guida riprendere.

Chi scrive è una redazione minima (un autore, contenuti pubblicati anche via AI con wpvibe, fino a 30 articoli al giorno): il design deve funzionare con contenuti che arrivano tanti e in fretta, con titoli lunghissimi e dati non sempre completi.

## Product Purpose

Trasformare un archivio di 1.700 guide lette solo per data in un sistema di **scoperta, consultazione e avanzamento** (PDF del proprietario): la home fa scoprire, l'hub del gioco fa scegliere, la guida fa avanzare, il prossimo obiettivo fa restare.

Successo, misurato e non supposto:
- il lettore trova la risposta senza scorrere a vuoto (scheda riassuntiva in testa, indice, ancore);
- usa gli strumenti: spunte nella checklist, tabelle dei mancanti, ritorni alla stessa guida;
- passa da una guida a quella pertinente successiva, non solo all'ultima uscita;
- completa la sfida del giorno.

Vincoli che il design non può ignorare: indirizzi e SEO di oggi intatti, pubblicità di HB Agency negli spazi riservati fin dal layout (nessun salto di pagina), velocità misurata sul sito vero (LCP < 2,5 s, CLS < 0,1, INP < 200 ms).

## Brand Personality

**Energico, ludico, curioso.** Il Platinatore parla da giocatore a giocatore: entusiasta del gioco, preciso sui dati, mai pomposo. Ha il piacere di chi colleziona e completa: la spunta, il contatore che sale, il platino come traguardo.

Voce: diretta e calda, frasi brevi, seconda persona. Niente gergo da comunicato stampa, niente trattini lunghi, titoli con la sola prima lettera maiuscola.

Emozioni da suscitare: «ce la faccio» (chiarezza, progresso visibile), «guarda qui» (curiosità verso il prossimo gioco o la sfida), «questi sanno di cosa parlano» (affidabilità dei dati).

## Anti-references

- **Il portale gaming affollato** (Everyeye, Multiplayer.it): banner e colonne ovunque, notizie che seppelliscono le guide, nessuna gerarchia. Le guide sono il cuore, non un'appendice.
- **Il blog WordPress generico** (il sito di oggi, tema Blogread): griglia di schede tutte uguali, ordine solo per data, nessuna identità, nessuno strumento.
- **La pubblicità che copre il contenuto**: oggi interstitial, banner laterale e barra fissa coprono la tabella della guida da telefono. Gli spazi esistono e restano, ma non devono mai coprire testo o controlli.

## Design Principles

1. **La guida è il prodotto.** Ogni scelta di base si decide sulla pagina guida da telefono, poi si estende a home e hub. Se migliora la home ma peggiora la guida, non si fa.
2. **La risposta prima, il racconto dopo.** In testa i dati che servono (scheda riassuntiva, indice, mancabili); la prosa viene dopo. Chi ha il joypad in mano non legge introduzioni.
3. **Il progresso si vede e resta.** Spunte, contatori e stati sono il cuore ludico del sito: evidenti, soddisfacenti, persistenti, dichiarati onestamente (una spunta non certifica il trofeo su PlayStation).
4. **Energia nei momenti, calma nella lettura.** Colore, movimento e gioco si concentrano dove c'è un'azione o un traguardo (spunta, sfida, platino); il testo da consultare resta sobrio e leggibile.
5. **Dati dichiarati, mai inventati.** Ogni stima dice da dove viene e a quali condizioni; ogni selezione («Guide del momento») dice il suo criterio. Dove un dato manca, si mostra che manca.

## Accessibility & Inclusion

WCAG 2.2 AA:
- contrasto AA su testo e controlli, nei due temi;
- tutto usabile da tastiera, con focus visibile; barra di progressione e ancore che non coprono i titoli (`scroll-margin-top`);
- **stati e completamento mai affidati al solo colore**: etichetta testuale o icona sempre presenti (richiesto dal PDF);
- bersagli da almeno 44 px per spunte e controlli usati con una mano;
- `prefers-reduced-motion` rispettato: le animazioni di spunta e contatore diventano istantanee;
- spoiler nascosti per difetto dove la guida li segnala;
- titoli di giochi lunghissimi e caratteri non latini gestiti senza rompere il layout.
