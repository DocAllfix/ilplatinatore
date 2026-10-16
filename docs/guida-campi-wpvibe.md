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

Ogni voce di `pl_trofei` è `{"gruppo": "...", "nome": "...", "come": "..."}`. Il `gruppo` raggruppa la checklist e va scritto uguale per i trofei dello stesso gruppo. I gruppi prendono il posto delle tabelle di trofei nel testo, nell'ordine: il primo gruppo dove c'era la prima tabella, e così via.

La scheda compare se ci sono almeno difficoltà o tempo. Un campo da solo non basta.

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

**Attenzione:** `pl_trofei` si sostituisce **per intero** a ogni scrittura. Per aggiungere un trofeo si rimanda l'elenco completo.

## Ripiego: le tabelle nel testo

Per gli articoli senza campi, il sito riconosce due tabelle:
- **scheda**: tabella a due colonne con le righe «Difficoltà stimata» (`5/10`) e «Tempo per il Platino», più a piacere Partite minime, Trofei mancabili, Trofei online, Trofei totali, Platino, Oro, Argento, Bronzo e altre righe;
- **trofei**: tabella con la prima colonna intitolata «Trofeo»; le altre colonne diventano i dettagli.

Basta un'intestazione scritta diversa e la scheda non compare: per questo, d'ora in poi, i campi sono la strada consigliata.

## Istruzione da dare a wpvibe

> Quando scrivi una guida al platino, compila anche i campi `pl_*` del post via REST (formato in docs/guida-campi-wpvibe.md): difficoltà da 1 a 10, ore per il platino con trattino normale, partite, trofei mancabili con numero e nomi, trofei online, trofei totali, eventuali condizioni delle stime, e l'elenco dei trofei con gruppo, nome e come ottenerlo. Non usare trattini lunghi.
