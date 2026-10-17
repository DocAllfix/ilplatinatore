# Piano di stabilità ed efficienza

Nato dall'incidente del 17/10/2026 (`docs/analisi/incidente-2026-10-17.md`). Obiettivo: il sito resta online e veloce anche quando il CMS è lento o fermo, e se qualcosa si rompe lo sa per primo un sistema, non un lettore.

Prezzi indicativi, da verificare al momento dell'acquisto.

## Già fatto (17/10/2026)

| Cosa | Effetto |
|---|---|
| Pagine sempre servite pronte, aggiornate in sottofondo (`revalidateTag "max"`) | il sito risponde anche con WordPress spento (provato) |
| Mai una pagina salvata a metà | la home non si salva più senza sezioni |
| Home statica (risultato di Search Console conservato 6 ore) | niente più 40 richieste al CMS a ogni visita |
| Pubblicazione a passo lento (2 processi, 3 pagine ciascuno) | carico del CMS durante una pubblicazione da 99 a meno di 4 |
| Apache limitato a 12 processi | il CMS mette le richieste in coda invece di bloccarsi |
| Immagini servite da Caddy dal disco, mai errori conservati, indirizzi con versione | immagini online con WordPress spento |
| Niente precaricamento dei link, immagini delle file solo quando servono | prima apertura da telefono da 10,3 s a 2,6 s |
| Sorveglianza ogni 10 minuti su GitHub Actions (`.github/workflows/sorveglianza.yml`) | email se sito, immagini o CMS non rispondono; vista anche rossa |

## Da fare subito

| # | Cosa | Costo | Serve da voi | Lavoro mio |
|---|---|---|---|---|
| 1 | **Monitor dedicato** (UptimeRobot o Better Stack): sito, CMS, una guida, un'immagine | 0 € | account gratuito | configurazione e prova rossa |
| 2 | **Server CMS CAX21** (4 processori, 8 GB), ingrandimento sul posto, «solo CPU e RAM» | circa +3 €/mese | «Rescale» dal pannello Hetzner | controlli dopo il riavvio, Apache da 12 a 24 processi |
| 3 | **Allarme dei backup** (healthchecks.io): avvisa se il backup notturno non parte | 0 € | account gratuito | indirizzo nel `.env` del server, prova rossa |
| 4 | **Cache degli oggetti di WordPress** (Redis in un contenitore): risposte della REST più veloci, meno CPU | 0 € | niente | contenitore, plugin, misure prima e dopo |
| 5 | **Riscaldamento dopo ogni pubblicazione**: un lavoro visita le pagine principali appena la pubblicazione è pronta, così il primo lettore non aspetta | 0 € | niente | lavoro su GitHub Actions |

## Al passaggio del dominio (Fase 6 e 7)

| # | Cosa | Costo | Note |
|---|---|---|---|
| 6 | **DNS su Cloudflare**: il dominio resta registrato su Aruba, cambiano solo i server DNS | 0 € | prima si ricopiano e si verificano i record di posta (MX, SPF, DKIM) delle caselle @ilplatinatore.it; aggiornamenti in minuti invece dei giorni di Aruba. Si fa una volta sola, insieme al puntamento del dominio a Vercel |
| 7 | **Immagini su Cloudflare R2**, convertite in WebP o AVIF nelle misure giuste | 0 € (1,8 GB oggi, gratis fino a 10 GB, traffico mai a pagamento) | le immagini non dipendono più dal server del CMS; peso atteso dal 50 al 70% in meno; risolve l'LCP al limite della guida |
| 8 | **Cloudflare davanti al CMS** (proxy): scudo contro gli attacchi a wp-admin e xmlrpc | 0 € | facoltativo, dopo il 6 |

## Da valutare

- **Dati di velocità dei lettori veri** (Vercel Speed Insights): l'INP si misura solo così. Verificare se è incluso nel piano Pro o quanto costa a parte.
- **Pubblicazione più leggera** se gli articoli crescono molto (Quart4 Parete, 14.000 articoli): generare al build solo gli articoli recenti, gli altri alla prima visita.

## Totale

Circa **3 € al mese** in più (solo il server). Tutto il resto è gratuito.
