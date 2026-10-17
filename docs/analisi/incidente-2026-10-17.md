# Incidente del 17/10/2026: sito di prova lento, home vuota, immagini rotte

Solo l'anteprima (`ilplatinatore.vercel.app`) e il CMS di lavoro. Il sito vero su Aruba non è stato toccato e ha sempre risposto.

## Cosa si è visto

- Dalle 18:50 circa la home non rispondeva (oltre 30 s), le altre pagine sì.
- Il server del CMS era a un carico di 99 su 2 processori, con WordPress al 144% di CPU.
- Dopo il primo intervento, la home è stata salvata con la sola sfida, senza le altre 9 sezioni.
- Sui telefoni molte immagini erano rotte, e restavano rotte anche dopo che il CMS era tornato normale. Altre ci mettevano decine di secondi.

## Le cause, una dentro l'altra

1. **La home era dinamica senza volerlo.** La richiesta del token a Google (Search Console) era segnata «da non conservare» (`cache: "no-store"`). Bastava questo per far rifare la home da zero a **ogni visita**, con circa 40 richieste al CMS. Tra queste c'erano ricerche nel testo di tutti gli articoli, fino a 100 risultati per parola.
2. **Ogni modifica nel CMS buttava via tutte le pagine.** Il webhook usava `revalidateTag(…, { expire: 0 })`. Il primo visitatore dopo ogni modifica aspettava quindi la rigenerazione completa, e con il CMS lento non arrivava niente. Nella giornata c'erano state molte modifiche: i 77 tag della sfida e le prove.
3. **Ogni pubblicazione travolgeva il CMS.** Vercel rigenerava i circa 1.710 articoli con molti processi in parallelo, e la giornata ne ha contate una quindicina.
4. **WordPress senza limite di processi.** Apache con il valore di fabbrica (150 processi PHP) su 4 GB: sotto carico la memoria finiva e tutto si fermava, invece di mettere le richieste in coda.
5. **Le immagini passavano da WordPress.** Con WordPress bloccato, anche le immagini si bloccavano.
6. **Gli errori venivano conservati per 30 giorni.** Caddy aggiungeva «conserva 30 giorni» a ogni risposta sotto `/wp-content/uploads/`, anche ai 502. Vercel e i browser dei telefoni li hanno tenuti come se fossero immagini.
7. **Una pagina incompleta veniva salvata.** Quando una sezione della home andava oltre il tempo massimo, la home si salvava lo stesso senza quella sezione, e restava così per un'ora.

## Correzioni, ciascuna verificata

| Causa | Correzione | Verifica |
|---|---|---|
| 1 | Risultato di Search Console conservato 6 ore (`unstable_cache`); ricerca solo nei titoli (`search_columns=post_title`); meno articoli per sezione | home servita già pronta (`X-Vercel-Cache: HIT`, 0,28 s) |
| 2 | Webhook con `revalidateTag(…, "max")`: si serve subito l'ultima versione pronta e la si rifà in sottofondo | webhook con WordPress spento: tutte le pagine 200 |
| 3 | Pubblicazione limitata a 2 processi con 3 pagine ciascuno (`next.config.ts`) | carico del CMS durante la pubblicazione al massimo 3,9 (prima 99); home sempre 200 |
| 4 | Apache limitato a 12 processi (`infra/cms/apache/mpm_prefork.conf`) | `apache2ctl -t` corretto, `MaxRequestWorkers 12` attivo |
| 5 | Caddy serve le immagini **dal disco**, senza WordPress (volume in sola lettura) | con WordPress spento: immagini 200 |
| 6 | «Conserva 30 giorni» solo sui file che esistono; ogni errore `no-store`; indirizzi delle immagini con versione `?v=2`, che scavalca gli errori già conservati | 404 con `no-store`; Pixel 7 e iPhone 13 emulati: 0 immagini rotte su home, hub e guida |
| 7 | Una sezione fallita fa fallire la home: Next tiene la versione buona di prima, e una pubblicazione fallisce invece di salvare una home a metà | la home torna sempre con 10 sezioni |

Prova finale con **WordPress spento** e un webhook di modifica:
- 10 pagine su 10 rispondono (200) in meno di mezzo secondo;
- home completa con 10 sezioni;
- immagini 200;
- WordPress riacceso, CMS di nuovo a 200.

Controlli: `controlli.py` 0 problemi, `criteri.py` 0 esiti diversi dall'atteso, 79 test.

## Prima apertura lenta da telefono (segnalata durante l'incidente)

Telefono simulato, rete mobile lenta, processore rallentato 4 volte:
- **prima**: pagina caricata in 10,3 s, 1.268 KB di immagini all'apertura, LCP 3,8 s;
- **dopo**: pagina caricata in 2,6 s, 59 KB di immagini, LCP 2,5-2,8 s.

Cause:
- Next precaricava ogni articolo linkato visibile, circa 550 KB in più, e per gli articoli non ancora pronti faceva lavorare il CMS. Ora `prefetch={false}` su tutti i link di contenuto; restano precaricati solo i tre link del menu.
- Chrome, su rete lenta, scarica in anticipo le immagini entro circa 2.500 px, cioè 4-5 file della home. Ora ogni fila fa partire le sue prime immagini solo quando sta per entrare nello schermo, e le altre quando si tocca la fila.

## Due errori di procedura, con la loro regola

- Sostituendo il `Caddyfile` con `mv`, il contenitore continuava a leggere il file vecchio, perché è collegato come file singolo. Due ricaricamenti non hanno avuto effetto. **Regola: il file collegato si sovrascrive con `cat nuovo > Caddyfile`, oppure si ricrea il contenitore (`up -d --force-recreate caddy`), e poi si verifica la risposta reale, non solo che il ricaricamento sia andato.**
- La prova del webhook usava il nome sbagliato della variabile del token e ha ricevuto 404. **Regola: una prova che risponde 404 non è una prova riuscita; si guarda il codice di risposta prima di trarre conclusioni.**

## Cosa resta da decidere prima di spostare il sito vero

Vedi la risposta all'utente del 17/10/2026: monitoraggio con avviso, server del CMS più grande, immagini fuori dal CMS (archivio con CDN), e Cloudflare solo davanti al CMS se serve.
