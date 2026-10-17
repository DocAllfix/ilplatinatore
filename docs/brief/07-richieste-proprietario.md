# Piano di design 07: richieste del proprietario dopo il prototipo

Stato: **in prova sull'anteprima** (18/10/2026). Piano approvato dall'utente; decisioni prese con lui prima di partire.

## Fatto

| Richiesta | Come | Dove |
|---|---|---|
| Nome più grande, logo al centro, menu a sinistra, ricerca a destra, simboli videoludici | Testata a tre colonne: tasti **Select/Start** (menu), logo e nome al centro, **mirino** (ricerca) e sole/luna | `src/components/testata/testata.tsx` |
| Menu non verticale ma una barra discreta sotto il titolo | Barra orizzontale con Guide, News, Approfondimenti, Sfida del giorno; sempre nell'HTML (chiusa = inert), Esc chiude | idem |
| Tasto chiaro/scuro | Sempre in testata; scelta salvata e applicata prima del primo disegno (niente lampo) | `layout.tsx`, `globals.css` |
| Sezioni con solo il titolo | Criterio tolto dalla pagina (resta nei dati). Scostamento dal PDF 02 voluto dal proprietario, che ne è l'autore | `home/sezioni.tsx` |
| Barra di scorrimento delle file più interattiva e nei colori della palette | Indicatore trascinabile e cliccabile; **varianti** A sfumata, B tacche | `home/fila-scorrevole.tsx` |
| Sfida nel menu e richiamabile ovunque, non invasiva | Voce nel menu; controller che pulsa (solo l'alone) in basso a destra sopra il «torna su», sparisce a sfida finita; apre la sfida a schermo intero | `sfida/richiamo.tsx`, `api/sfida-oggi` |
| Bottoni «Tutte», «Tutti gli articoli», «Meno recenti» come il blocco giallo delle ore | `BottoneAcido`, **scritta scura** (il bianco sull'Acido non si legge, 1,1:1: deciso con l'utente) | `bottone-acido.tsx` |
| Logica dei collezionabili in tutti gli articoli-elenco | Campo `pl_collezionabili` oppure tabella nel testo con prima colonna «Oggetto/Arma/...»; «Come prenderlo» trova da solo il titolo che contiene il nome; testi generici («Cosa ti manca», «Completato», «Dove») | `lib/guida/collezionabili.ts` |
| Il tag a fine articolo come mini-scheda col bagliore; dati dalla descrizione del tag | La descrizione del tag contiene solo righe «Anno / Genere / Voto medio / Storia / Storia + extra / Completista»; mai mostrata grezza; **varianti** del bagliore A ruota, B pulsa | `lib/scheda-gioco.ts`, `gioco/scheda-gioco.tsx` |
| Pagina del tag: prima la scheda, poi «Tutti gli articoli su …» | Per ogni gioco (scheda o spunta del tag); descrizione per Google fatta dalla scheda | `archivio-termine.tsx` |
| h2 in viola o con una linea viola | **Varianti** A testo Viola, B linea Viola | `globals.css` |
| Hero con gli ultimi 3 articoli e cornice-timer nei tre colori | Cornice SVG che si consuma in 7 s, poi il successivo; pausa (tasto, mouse, fuoco, dito), pallini, scorrimento col dito; con movimento ridotto niente rotazione | `home/hero.tsx` |
| News con cornice rossa e fuoco | «Ultim'ora»: news uscite nelle 48 ore prima dell'ultimo articolo pubblicato (sul sito vero = ultime 48 ore) | `carta-articolo.tsx` |
| Articoli delle sezioni come le card della home | Griglia di schede «locandina» piccole in tutti gli archivi | `archivio.tsx`, `carta-articolo.tsx` |

## Varianti da scegliere (proprietario)
- Home, barra delle file: **A sfumata** / **B tacche** (`/?v=a`, `/?v=b`).
- Articolo: **A** h2 viola + bagliore che ruota / **B** linea viola + bagliore che pulsa (`?v=a`, `?v=b` su un articolo).

## Da compilare (wpvibe)
- Descrizione dei tag dei giochi con le righe della scheda (istruzione in `docs/guida-campi-wpvibe.md`). Sul CMS di lavoro Valor Mortis ha solo anno, genere e completista (stima del Platino della guida): voto e altre durate vanno inseriti da chi ha i dati.
- Tabella «Oggetto | Tipo | Dove | Sblocco» negli articoli-elenco. Esempio: Warzone Stagione 6, compilato nel campo.

## Verifica
`controlli.py` 0 problemi; `criteri.py` 15 criteri verdi e rossi con i guasti (nuovi: 13 testata da tastiera, 14 tema senza lampo, 15 scheda del gioco senza righe grezze); 87 test; WordPress spento: tutto online; LCP della home con l'hero 2,4-2,6 s su telefono e rete lenta simulati.
