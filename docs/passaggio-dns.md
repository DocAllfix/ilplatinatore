# Passaggio del dominio: DNS su Cloudflare e puntamento a Vercel

Scritto il 20/10/2026. Il dominio **resta registrato su Aruba**: cambiano solo i server DNS (chi risponde alla domanda «dove sta www.ilplatinatore.it?»). Si fa in **due momenti separati**, così il giorno del passaggio il rischio è uno solo.

## Perché in due momenti

| Momento | Che cosa cambia | Che cosa vede il lettore | Rischio |
|---|---|---|---|
| **A. DNS su Cloudflare** (qualche giorno prima) | i server DNS, da Aruba a Cloudflare, con **gli stessi record di oggi** | niente: il sito resta su Aruba | la posta, se manca un record (si prova subito) |
| **B. Il passaggio** (giorno scelto, traffico basso) | due record, `@` e `www`, da Aruba a Vercel | il sito nuovo | il sito, ma con la via di ritorno in un minuto |

Con il DNS su Cloudflare il passaggio B si propaga in pochi minuti (TTL 300 s o meno) e la via di ritorno è rimettere due indirizzi. Con il DNS di Aruba, TTL 3600 s e pannello più lento.

## Record di oggi (letti dal DNS pubblico il 20/10/2026)

Da confrontare con l'**esportazione della zona dal pannello Aruba**, che è l'unica fonte completa (il DNS pubblico non elenca i nomi che non si conoscono, per esempio un eventuale selettore DKIM).

| Nome | Tipo | Valore | Al momento A | Al momento B |
|---|---|---|---|---|
| `@` | A | 89.46.107.229 | uguale | → Vercel: A `216.150.1.1` e A `216.150.16.1` (valori consigliati dall'API di Vercel il 20/10/2026) |
| `@` | AAAA | 2a00:6d40:4:1::c263:229 | uguale | **si toglie** (Vercel non usa IPv6 per i domini esterni) |
| `www` | A | 89.46.107.229 | uguale | → CNAME `c3a53cbb7881e3cd.vercel-dns-016.com` (consigliato dall'API di Vercel per questo progetto) |
| `www` | AAAA | 2a00:6d40:4:1::c263:229 | uguale | **si toglie** |
| `@` | MX | 10 `mx.ilplatinatore.it` | **uguale, mai toccato** | uguale |
| `@` | TXT | `v=spf1 include:_spf.aruba.it ~all` | **uguale** | uguale |
| `_dmarc` | TXT | `v=DMARC1; p=none; adkim=r; aspf=r;` | uguale | uguale |
| `mx` | A | 62.149.128.74, .151, .154, .157, .160, .163, .166 | uguale | uguale |
| `mail` | A | 62.149.128.74, .151, .154, .157, .160, .163, .166 | uguale | uguale |
| `smtp` | A | 62.149.128.200, .201, .202, .203 | uguale | uguale |
| `pop3` | A | 62.149.128.73, .75, .152, .155, .158, .161, .164, .167 | uguale | uguale |
| `imap` | CNAME | `imaps.aruba.it` | uguale | uguale |
| `webmail` | A | 62.149.158.91, 62.149.158.92 | uguale | uguale |
| `autoconfig` | CNAME | `autodiscover.aruba.it` | uguale | uguale |
| `_autodiscover._tcp` | SRV | 0 0 443 `autodiscover.aruba.it` | uguale | uguale |
| `ftp` | A | 89.46.104.211, 89.46.104.218 | uguale | uguale (serve per il sito su Aruba, via di ritorno) |
| `admin` | CNAME | `admin.redirect.aruba.it` | uguale | uguale |
| `_domainconnect` | CNAME | `_domainconnect.hst.aruba.it` | uguale | uguale |
| `cms` | A | 49.13.164.162 | uguale | uguale |

Nessun record jolly (`*`). Tutti i record della posta in Cloudflare vanno con la **nuvola grigia** («solo DNS»): la nuvola arancione (proxy) funziona solo per i siti web e romperebbe la posta e l'FTP.

## Momento A, passo per passo

1. **Account Cloudflare** gratuito (lo crea il proprietario o l'utente; a me serve un token API limitato alla zona, permesso «DNS: modifica», da mettere in `.env.segreti`).
2. Cloudflare → «Aggiungi un dominio» → `ilplatinatore.it`, piano Free. Cloudflare legge da solo i record: **si confrontano uno per uno con la tabella sopra e con l'esportazione di Aruba**, si aggiunge quello che manca.
3. Tutti i record in **grigio**, tranne nessuno: al momento A nemmeno il sito passa dal proxy (il sito su Aruba resta com'è oggi).
4. TTL dei record `@` e `www`: **300 s** (Auto di Cloudflare va bene).
5. Nel pannello Aruba → Gestione DNS → «Modifica server DNS»: si mettono i due nomi che Cloudflare indica. Il cambio può richiedere da qualche ora a 24-48 ore.
6. **Prove subito dopo** (le faccio io e le scrivo qui):
   - i server DNS pubblici restituiscono i nameserver di Cloudflare;
   - ogni record della tabella risponde uguale (script di confronto);
   - una email **inviata** da una casella @ilplatinatore.it e una **ricevuta** da fuori (Gmail), con SPF e DMARC «pass» nelle intestazioni;
   - il sito su Aruba risponde come prima.

## Momento B (giorno del passaggio), in sintesi

La procedura completa è nella Fase 7 di `docs/02-piano-e-metodo.md`. Per la parte DNS:
1. dominio `www.ilplatinatore.it` e `ilplatinatore.it` aggiunti al progetto Vercel `ilplatinatore` (nudo → rimanda a `www` con **301**, come oggi: su Vercel va scelto 301 nel dominio, il predefinito è 308; `http` → `https` lo fa Vercel). Oggi: `ilplatinatore.it/x` → 301 `www.ilplatinatore.it/x`, percorso conservato;
2. in Cloudflare: `@` → A di Vercel, `www` → CNAME di Vercel, AAAA tolti, **nuvola grigia** (Vercel ha già la sua rete; due proxy uno sull'altro complicano certificati e cache);
3. Vercel emette il certificato; si controlla `https://www.ilplatinatore.it` e `https://ilplatinatore.it`;
4. **via di ritorno**: rimettere i due record A/AAAA di Aruba (valori nella tabella). Il sito su Aruba resta acceso e intatto almeno due settimane.
