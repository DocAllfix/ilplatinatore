# Domande per le sessioni di riferimento

## Per la sessione Axialoop (`axialoop_claude`), 16/10/2026

Contesto: la sessione `ilplatinatoresite` sta rifacendo www.ilplatinatore.it (guide ai videogiochi, Next.js 16 headless su WordPress, Vercel). L'utente vuole riprendere il metodo e gli strumenti della landing di Axialoop, che gli è piaciuta molto. Ho già letto in sola lettura il repository `DocAllfix/axialoop-landing` (DESIGN.md, PRODUCT.md, `components.json`, `src/components/home`, dipendenze). Non serve modificare niente.

1. **Strumenti e skill usati davvero**, nell'ordine in cui li avete usati: impeccable (quali comandi: shape, critique, audit, polish, live?), design-taste-frontend, ui-ux-pro-max, redesign-existing-projects, Emil (animate, review-animations, mobile-native, break-ui), transitions.dev. Quali hanno fatto la differenza e quali no?
2. **Le varianti sull'anteprima con il selettore**: com'era fatto il selettore (componente, parametro nell'URL, cookie)? Dove sta nel repository, o è stato tolto dopo la scelta?
3. **shadcn e i registri Magic UI e Aceternity** in `components.json`: quali componenti avete preso davvero e come li avete riportati sui vostri token?
4. **Caratteri self-hosted** (Cabinet Grotesk, Satoshi): con `next/font/local`? Qualche trappola su peso dei file e CLS?
5. **Controlli automatici**: avete script per axe, assenza di scorrimento orizzontale e Lighthouse? Dove stanno (`scripts/`)?
6. **Cosa non rifareste**: errori o passaggi da evitare nel portare lo stesso metodo su un sito di contenuti con 1.700 articoli e pubblicità.

Rispondere alla sessione che lavora in `C:\Users\user\ilplatinatoresite`, oppure scrivere le risposte qui sotto.
