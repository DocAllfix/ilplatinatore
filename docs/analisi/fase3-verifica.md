# Fase 3: verifica del prototipo con i criteri del PDF

Data: 17/10/2026. Contro: `https://ilplatinatore.vercel.app` (anteprima noindex), dati del CMS di lavoro.
Strumenti: `scripts/qa/criteri.py` (criteri del PDF, browser vero da telefono), `scripts/qa/controlli.py` (axe, scorrimento, h1, bersagli, noindex a 390, 1024 e 1440 px), Lighthouse 12.8.2 in locale.

Regola del cancello: ogni criterio provato con un controllo automatico, **visto anche rosso**. Ogni criterio ha un guasto messo apposta (`--rompi`): con il guasto deve fallire, senza deve passare.

## Esito

| # | Criterio (PDF, sezione 10) | Normale | Con il guasto | Guasto usato |
|---|---|---|---|---|
| 1 | Le spunte aggiornano il contatore (trofei e collezionabili) | verde: 0→1 di 11; 0→1 di 12 | rosso | caselle non cliccabili |
| 2 | Le spunte restano al ritorno | verde | rosso | memoria del browser che non salva |
| 3 | Il ritorno alla checklist dall'hub («Riprendi da dove eri») | verde | rosso | memoria che non salva |
| 4 | Ancore, Indice e barre non coprono i titoli | verde (3 «Come prenderlo» + 1 voce dell'Indice) | rosso | barra fissa alta 140 px in cima |
| 5 | Da tastiera: spunta con lo spazio, pillola con Invio, fuoco visibile | verde | rosso | contorno del fuoco tolto |
| 6 | Stati non affidati al solo colore | verde: «Capitolo completato» scritto, tentativi della sfida con etichetta, indizi del classico a parole | rosso | etichette nascoste |
| 7 | Azzeramento con conferma | verde: aprire «Azzera» non toglie niente, confermare toglie tutto | rosso | pulsante di conferma tolto |
| 8 | Dati mancanti | verde: articolo senza campi senza scheda né checklist; tag che non è un gioco resta archivio; nessun errore | rosso | errore JavaScript |
| 9 | Differenze fra versioni e condizioni delle stime | verde: «Stima della redazione: il tempo dipende...» nella scheda | rosso | nota nascosta |
| 10 | Titoli lunghissimi (break-ui), nessuno scorrimento a 360 px | verde su home, hub, guida, capitolo, sfida | rosso | elemento largo 640 px |
| 11 | Si misura l'uso degli strumenti | verde: spunta, come prenderlo, riprendi, lettura completa, inizio e fine sfida, correlato | rosso | eventi bloccati |
| 12 | Spoiler | verde con un oggetto segnato apposta: velo presente, «Mostra spoiler» lo toglie | rosso | pulsante nascosto |

Il 12 si prova solo quando un oggetto è segnato spoiler: nessun dato vero lo è. Per la prova «Iron Grip» (Capitolo 1) è stato segnato sul CMS di lavoro, provato nei due modi e rimesso com'era. Verificato dopo: nessuno spoiler sul CMS né sulla pagina.

Controlli generali (`controlli.py`): **0 problemi** (axe WCAG 2.2 AA senza violazioni, nessuno scorrimento orizzontale, un h1, bersagli da 44 px, noindex) su 16 pagine per 3 larghezze.

## Difetti trovati e corretti in questa fase

1. **Parole lunghissime facevano scorrere la pagina di lato** a 360 px: fino a 560 px in più sulla home, 424 sul capitolo, 403 sulla sfida. Corretto con `overflow-wrap: anywhere` sul corpo; il link «Tutte» accanto ai titoli delle sezioni ha ora una larghezza massima.
2. **Home pesante e lenta**: 106 immagini, 6,6 MB, LCP 3,6 s. Le schede fuori schermo delle file orizzontali si scaricavano tutte. Ora la prima immagine della home ha priorità alta e, in ogni fila, le immagini oltre la quarta partono quando il lettore tocca o scorre la fila: **2,7 MB, LCP 2,4-2,6 s**.
3. **Misure d'uso assenti**: preparate come eventi nella pagina (`src/lib/misure.ts`, `platinatore:misura` e `dataLayer`), nessuna richiesta verso terzi. Il trasporto (contatore aggregato, GA4 dopo il consenso) arriva in Fase 5 e ascolta gli stessi eventi.

## Prestazioni (Lighthouse in locale, telefono simulato)

| Pagina | Prestazioni | Accessibilità | Buone pratiche | LCP | CLS | TBT |
|---|---|---|---|---|---|---|
| Home | 86-87 | 100 | 96 | 2,4-2,6 s | 0 | 150 ms |
| Guida al Platino | 87-97 | 100 | 96 | 2,4-3,0 s | 0 | 350 ms |
| Hub | 95 | 100 | 96 | 2,5 s | 0 | 170 ms |
| Sfida | 97 | 100 | 96 | 2,2 s | 0 | 150 ms |

Limiti dichiarati:
- PageSpeed Insights ha esaurito la quota giornaliera gratuita: misura da ripetere con PageSpeed.
- La misura in locale oscilla (la guida fra 2,4 e 3,0 s nella stessa ora), come già visto su Axialoop.
- L'INP non si misura in laboratorio: il TBT ne è solo un indizio. L'obiettivo vero (LCP < 2,5 s, CLS < 0,1, INP < 200 ms) si verifica con i dati reali di Chrome dopo il passaggio.

## Debiti aperti

- PageSpeed Insights sull'anteprima da ripetere (quota).
- LCP della guida al limite: l'immagine di copertina è servita nelle misure di WordPress, senza AVIF/WebP ridimensionati. Da valutare in Fase 6 (ottimizzazione delle immagini).
- Le misure d'uso non lasciano ancora la pagina (Fase 5).
- Il criterio 12 dipende da un dato segnato spoiler: va riprovato quando la redazione ne segna uno.

## Cancello

Tutti i criteri provati e visti rossi. Manca **l'approvazione dell'utente**.
