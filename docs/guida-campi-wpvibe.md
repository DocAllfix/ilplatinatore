# Campi della guida: come si compilano (redazione e wpvibe)

Ogni guida può avere una **scheda riassuntiva** e una **checklist dei trofei** compilate in campi dedicati, invece che in tabelle dentro il testo. Il sito li legge per primi; se mancano, ripiega sulle tabelle del testo (formato più sotto). I campi sono registrati dal mu-plugin `infra/cms/mu-plugins/platinatore-headless.php`, sezione 5.

## Dove si vedono

- **Nell'editor di WordPress**: con wpvibe attivo, riquadro «Scheda della guida» sotto il testo.
- **Nella REST**: campo `meta` del post (`GET /wp-json/wp/v2/posts/<id>`), leggibile da tutti, scrivibile con un utente che può modificare articoli.

## I campi

| Chiave | Tipo | Esempio | Note |
|---|---|---|---|
| `pl_difficolta` | numero | `5` | da 1 a 10; 0 = non indicata |
| `pl_ore_platino` | testo | `15-25 ore` | trattino normale, mai lungo |
| `pl_partite` | testo | `1` | |
| `pl_mancabili` | testo | `1, Sfratto Abissale` | numero, poi i nomi; `0` se nessuno |
| `pl_online` | testo | `0` | |
| `pl_trofei_totali` | numero | `39` | platino compreso |
| `pl_nota_stime` | testo | `Stima della redazione: ...` | da cosa dipendono tempo e difficoltà |
| `pl_altri_dati` | testo su più righe | `Salvataggi manuali: No` | una voce per riga, «Etichetta: valore» |
| `pl_trofei` | elenco | vedi sotto | un oggetto per trofeo |
| `pl_collezionabili` | elenco | vedi sotto | negli articoli dei collezionabili, un oggetto per riga |
| `pl_correlati` | elenco | vedi sotto | collegamenti ad altre guide nel punto in cui servono |

Ogni voce di `pl_trofei` è `{"gruppo": "...", "nome": "...", "come": "..."}`. Il `gruppo` raggruppa la checklist e va scritto uguale per i trofei dello stesso gruppo. I gruppi prendono il posto delle tabelle di trofei nel testo, nell'ordine: il primo gruppo dove c'era la prima tabella, e così via.

La scheda compare se ci sono almeno difficoltà o tempo. Un campo da solo non basta.

Ogni voce di `pl_collezionabili` è `{"area": "...", "oggetto": "...", "tipo": "...", "prerequisito": "...", "sezione": "...", "spoiler": ""}`:
- `area`: la zona o la Lanterna (raggruppa e filtra la tabella);
- `tipo`: al singolare, `Ambra`, `Arma`, `Trasmutazione`, `Potenziamento`, `Fiaschetta`, `Indizio` (o altro); i contatori li sommano per tipo;
- `prerequisito`: facoltativo, cosa serve prima (es. `Fuoco`);
- `sezione`: il titolo h2 del paragrafo che spiega come prenderlo, **copiato uguale**; se non corrisponde a nessun titolo il link «Come prenderlo» non compare;
- `spoiler`: `si` per nascondere il nome finché il lettore non lo chiede.

La tabella dei mancanti compare in testa all'articolo, sopra il testo.

Ogni voce di `pl_correlati` è `{"tipo": "Prima di continuare", "articolo": "slug-della-guida", "perche": "...", "dopo_sezione": "..."}`. Il riquadro compare alla **fine** della sezione `dopo_sezione` (titolo h2 copiato uguale), cioè subito prima del titolo successivo. `articolo` accetta lo slug o l'indirizzo intero; se la guida collegata non è pubblicata il riquadro non compare. Un `tipo` che contiene «Prima» o «Attenzione» si mostra come avviso; gli altri (es. «Prossimo obiettivo») come indicazione.

## I campi del gioco (sul tag)

Un tag diventa l'**hub del gioco** su `/tag/<slug>/` quando ha «È un gioco» spuntato. I campi stanno nella pagina del tag in wp-admin (riquadro «Hub del gioco») e nella REST (`meta` di `/wp-json/wp/v2/tags/<id>`, scrivibile da chi gestisce le categorie). Senza «È un gioco» la pagina resta l'archivio di oggi.

| Chiave | Esempio | Note |
|---|---|---|
| `pl_gioco` | `1` | `1` = hub; vuoto = archivio |
| `pl_presentazione` | `Soulslike in prima persona di...` | due o tre frasi; diventa anche la descrizione per Google |
| `pl_piattaforme` | `PS5, Xbox Series X\|S, PC` | separate da virgola |
| `pl_uscita` | `2026-10-13` | AAAA-MM-GG |
| `pl_sviluppatore`, `pl_editore` | `One More Level` | |
| `pl_guida_platino` | `valor-mortis-guida-platino-tutti-trofei` | slug: da qui l'hub prende copertina e dati del completamento |
| `pl_inizia_qui` | uno slug per riga | le guide da leggere per prime, in ordine |

Il **tipo di aiuto** di ogni guida (Platino e trofei, Collezionabili, Missioni, Boss, Armi e potenziamenti, Meccaniche e consigli) non si compila: il sito lo deduce dal titolo. Perché finisca nel gruppo giusto, il titolo dice di che si tratta («tutti i collezionabili del Capitolo 4», «come completare la missione...», «come sconfiggere...»). Le notizie del gioco sono gli articoli del tag nella categoria News.

## Scrittura via REST (quello che fa wpvibe)

```http
POST /wp-json/wp/v2/posts/5962
Authorization: Basic <utente:application password>
Content-Type: application/json; charset=utf-8

{
  "meta": {
    "pl_difficolta": 5,
    "pl_ore_platino": "15-25 ore",
    "pl_partite": "1",
    "pl_mancabili": "1, Sfratto Abissale",
    "pl_online": "0",
    "pl_trofei_totali": 39,
    "pl_nota_stime": "Stima della redazione: il tempo dipende dalla familiarità con parate, schivate e scontri contro i boss.",
    "pl_altri_dati": "Difficoltà selezionabile: No\nSalvataggi manuali: No",
    "pl_trofei": [
      { "gruppo": "Tutti i trofei dei boss e della storia", "nome": "Torn Banner", "come": "Sconfiggere General Lothaire, the Eagle-Bearer" }
    ]
  }
}
```

Dopo il salvataggio il CMS avvisa il sito (webhook) e la pagina si aggiorna da sola in pochi secondi. Collaudato il 16/10/2026: 5-40 secondi, senza deploy.

**Attenzione:** gli elenchi (`pl_trofei`, `pl_collezionabili`, `pl_correlati`) si sostituiscono **per intero** a ogni scrittura. Per aggiungere una voce si rimanda l'elenco completo.

## Ripiego: le tabelle nel testo

Per gli articoli senza campi, il sito riconosce due tabelle:
- **scheda**: tabella a due colonne con le righe «Difficoltà stimata» (`5/10`) e «Tempo per il Platino», più a piacere Partite minime, Trofei mancabili, Trofei online, Trofei totali, Platino, Oro, Argento, Bronzo e altre righe;
- **trofei**: tabella con la prima colonna intitolata «Trofeo»; le altre colonne diventano i dettagli.

Basta un'intestazione scritta diversa e la scheda non compare: per questo, d'ora in poi, i campi sono la strada consigliata.

## Istruzione da dare a wpvibe

> Quando scrivi una guida al platino, compila anche i campi `pl_*` del post via REST (formato in docs/guida-campi-wpvibe.md): difficoltà da 1 a 10, ore per il platino con trattino normale, partite, trofei mancabili con numero e nomi, trofei online, trofei totali, eventuali condizioni delle stime, e l'elenco dei trofei con gruppo, nome e come ottenerlo. Non usare trattini lunghi.

> Quando scrivi un articolo sui collezionabili di un capitolo, compila `pl_collezionabili`: un oggetto per riga con area, nome, tipo al singolare, prerequisito se serve, e in `sezione` il titolo h2 esatto del paragrafo che lo spiega. Se una guida rimanda a un'altra in un punto preciso, aggiungi una voce in `pl_correlati` con lo slug, il perché in una frase e il titolo h2 dopo cui mostrarla.
