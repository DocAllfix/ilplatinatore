# Brief 08: la sezione Recensioni

Richiesta del proprietario del 20/10/2026, con le scelte dell'utente e del proprietario. Prima recensione: Control Resonant (7,5/10), `/2026/10/20/control-resonant-recensione-ps5/`.

## Che cosa chiede il proprietario
- Il voto come su IGN, convertito dallo shortcode `[platinatore_voto valore="7.5" scala="10"]`, con una figura e i colori del sito al posto del rombo.
- Una scheda con voto e verdetto breve, una barra laterale con un colore della palette e in basso un invito alle guide del gioco o all'hub.
- Nella recensione, ogni tanto, correlati dello stesso gioco con la logica dei correlati delle guide.
- La recensione come correlato negli articoli del gioco (anche in tutti).
- «Recensioni» nel menu e fra le sezioni della home, con trattamento premium.

## Scelte
| Domanda | Scelta | Di chi |
|---|---|---|
| Verdetto breve | il paragrafo del verdetto finale, che segue lo shortcode | utente |
| Colore del voto | tre fasce: dall'8 Acido, dal 6 Ciano, sotto Viola | utente |
| Barra laterale | sempre del colore della fascia del voto | proprietario |
| Forma della figura | B «Lastra inclinata» (fra esagono, lastra, rombo): «richiama il sito» | proprietario |
| Correlati nella recensione | automatici (una guida ogni due sezioni, prima quella al Platino, mai dopo il verdetto); se la redazione li sceglie a mano valgono quelli | utente |
| La recensione negli altri articoli del gioco | in testa all'hub (il box negli articoli resta da confermare) | utente |

## Come funziona
- **CMS** (mu-plugin, sezione 11): lo shortcode produce lo stesso HTML del sito su Aruba (contenuto identico, parità); a ogni salvataggio il voto si copia nei campi `pl_voto` e `pl_voto_scala`, che schede, home e hub leggono dalla REST.
- **Articolo**: il voto e il paragrafo del verdetto (con il titolo «Verdetto» che li precede) diventano la scheda del verdetto; dati strutturati `Review` con il voto e il gioco recensito (su Aruba oggi non ci sono).
- **Hub**: «La nostra recensione» in testa, con voto, titolo e riassunto; la recensione non sta fra le sezioni delle guide.
- **Home**: regola `recensioni | 8` in Strumenti > Sezioni della home, oggi prima sezione sotto l'hero: l'ultima recensione in vetrina grande, le altre in fila.
- **Locandine**: etichetta «Recensione» e voto nell'angolo, in home e negli archivi; `/category/recensioni/` come archivio.

## Difetti trovati durante il lavoro
- Sull'anteprima la recensione mostrava lo shortcode grezzo: sul CMS di Hetzner non era registrato.
- Il titolo «Verdetto» cercato con `[\s\S]*?` partiva dal primo titolo dell'articolo: il corpo della recensione spariva fino al voto. Corretto con un'espressione che non attraversa altri titoli, con test; stessa correzione nella tabella riassuntiva del Platino.
